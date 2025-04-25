import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TherapistSubmissionFormProps {
  date: string;
  startTime: string;
  endTime: string;
  onSuccess: () => void;
  onCancel: () => void;
  therapistId?: string;    // For admin to manage specific therapist
  adminMode?: boolean;     // Enable admin functions
}

type FormValues = {
  notes: string;
  isRecurring: boolean;
  recurringDays: string[];
};

const weekdays = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
];

export function TherapistSubmissionForm({
  date,
  startTime,
  endTime,
  onSuccess,
  onCancel,
  therapistId,
  adminMode,
}: TherapistSubmissionFormProps) {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    defaultValues: {
      notes: '',
      isRecurring: false,
      recurringDays: [],
    },
  });
  
  const isRecurring = form.watch('isRecurring');
  
  // Mark therapist availability
  const markAvailabilityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        'POST',
        '/api/slots/therapist/availability',
        data
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to set availability');
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate slots query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      
      toast({
        title: 'Availability set',
        description: 'Your availability has been successfully recorded.',
      });
      
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    markAvailabilityMutation.mutate({
      date,
      start_time: startTime,
      end_time: endTime,
      is_recurring: values.isRecurring,
      recurring_days: values.isRecurring ? values.recurringDays : undefined,
      notes: values.notes,
      therapist_id: adminMode ? therapistId : undefined, // Include therapistId if in admin mode
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium">Selected Time Slot</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              {startTime} - {endTime}
            </p>
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any notes about this availability" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Optional notes about your availability.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="isRecurring"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Repeat Weekly</FormLabel>
                <FormDescription>
                  Make this time slot available weekly for the same day.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        
        {isRecurring && (
          <FormField
            control={form.control}
            name="recurringDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Days</FormLabel>
                <FormDescription>
                  Select additional days of the week to make this time slot available.
                </FormDescription>
                <div className="flex flex-wrap gap-2 mt-2">
                  {weekdays.map((day) => (
                    <FormField
                      key={day.value}
                      control={form.control}
                      name="recurringDays"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={day.value}
                            className="flex flex-row items-start space-x-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(day.value)}
                                onCheckedChange={(checked) => {
                                  const updatedValues = checked
                                    ? [...field.value, day.value]
                                    : field.value?.filter(
                                        (value) => value !== day.value
                                      );
                                  field.onChange(updatedValues);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {day.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={markAvailabilityMutation.isPending}
          >
            {markAvailabilityMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Set Availability
          </Button>
        </div>
      </form>
    </Form>
  );
}