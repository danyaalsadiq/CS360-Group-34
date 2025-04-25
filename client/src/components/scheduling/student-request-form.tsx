import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Loader2, Calendar, Check, AlertCircle } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StudentRequestFormProps {
  date: string;
  startTime: string;
  endTime: string;
  onSuccess: () => void;
  onCancel: () => void;
  therapistId?: string;
  isWaitlisted?: boolean;
  studentId?: string;   // For admin to manage specific student
  adminMode?: boolean;  // Enable admin functions
}

type FormValues = {
  preferredDays: string[];
  preferredTimes: string[];
  preferredTherapistId: string;
  notes: string;
};

const weekdays = [
  { value: 'MON', label: 'Monday' },
  { value: 'TUE', label: 'Tuesday' },
  { value: 'WED', label: 'Wednesday' },
  { value: 'THU', label: 'Thursday' },
  { value: 'FRI', label: 'Friday' },
];

const timeSlots = [
  { value: '09:00', label: '9:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '11:00', label: '11:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '17:00', label: '5:00 PM' },
];

export function StudentRequestForm({
  date,
  startTime,
  endTime,
  onSuccess,
  onCancel,
  therapistId,
  isWaitlisted = false,
  studentId,
  adminMode
}: StudentRequestFormProps) {
  const { toast } = useToast();
  
  // Get day of the week from date
  const getDayOfWeek = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 is Sunday, 1 is Monday, etc.
    
    // Convert to our day format
    const dayMap: { [key: number]: string } = {
      1: 'MON',
      2: 'TUE',
      3: 'WED',
      4: 'THU',
      5: 'FRI',
    };
    
    return dayMap[day] || '';
  };
  
  // Get therapist list
  const { data: therapists = [] } = useQuery({
    queryKey: ['/api/users?role=therapist'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users?role=therapist');
      return res.json();
    },
    placeholderData: [],
  });
  
  // Set the form default values, using the provided therapist ID if it exists
  const form = useForm<FormValues>({
    defaultValues: {
      preferredDays: [getDayOfWeek(date)],
      preferredTimes: [startTime],
      preferredTherapistId: therapistId || (therapists && therapists.length > 0 ? therapists[0].id : ''),
      notes: '',
    },
  });
  
  // Indicate availability and request appointment
  const requestAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        'POST',
        '/api/slots/student/request',
        data
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit availability');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate slots query to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      
      if (data.match_status === 'matched') {
        toast({
          title: 'Appointment Booked!',
          description: `You have been matched with ${data.therapist_name} on ${format(new Date(data.date), 'EEEE, MMMM d')} at ${data.start_time}.`,
        });
      } else if (data.match_status === 'pending') {
        toast({
          title: 'Availability submitted',
          description: 'Your availability has been recorded. The system will try to match you with an available therapist.',
        });
      } else if (data.match_status === 'alternate_offered') {
        toast({
          title: 'Alternative slot offered',
          description: 'An alternative time has been suggested - please check your appointments.',
        });
      } else if (data.match_status === 'waitlisted') {
        toast({
          title: 'Added to waitlist',
          description: 'This slot is already booked by another student. You have been added to the waitlist and will be notified if it becomes available.',
        });
      } else {
        toast({
          title: 'Availability submitted',
          description: 'Your availability has been recorded. You will be notified when matched with a therapist.',
        });
      }
      
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
    requestAppointmentMutation.mutate({
      preferred_days: values.preferredDays,
      preferred_times: values.preferredTimes,
      preferred_therapist_id: values.preferredTherapistId,
      notes: values.notes,
      student_id: adminMode ? studentId : undefined, // Include studentId if in admin mode
    });
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Calendar className="h-4 w-4 text-blue-600 mr-2" />
          <AlertDescription className="text-blue-700">
            {adminMode 
              ? `You are managing this student's availability. The system will match with an available therapist.`
              : `You are indicating your availability. The system will match you with an available therapist.`
            }
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-col space-y-1.5">
            <h3 className="text-sm font-medium">Selected Time Slot</h3>
            <p className="text-sm text-muted-foreground">
              {format(new Date(date), 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-sm text-muted-foreground">
              {startTime} - {endTime}
            </p>
            <p className="text-xs text-blue-600 mt-1 flex items-center">
              <Check className="w-3 h-3 mr-1" /> This slot has been pre-selected based on your calendar selection
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Additional Availability (Optional)</h3>
          <p className="text-xs text-muted-foreground">Expand your availability to increase chances of being matched.</p>
          
          <details className="mt-2">
            <summary className="text-sm font-medium cursor-pointer text-primary hover:underline">
              Show additional options
            </summary>
            <div className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="preferredDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Available Days</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {weekdays.map((day) => (
                        <FormField
                          key={day.value}
                          control={form.control}
                          name="preferredDays"
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
              
              <FormField
                control={form.control}
                name="preferredTimes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Available Times</FormLabel>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      {timeSlots.map((time) => (
                        <FormField
                          key={time.value}
                          control={form.control}
                          name="preferredTimes"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={time.value}
                                className="flex flex-row items-start space-x-2 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(time.value)}
                                    onCheckedChange={(checked) => {
                                      const updatedValues = checked
                                        ? [...field.value, time.value]
                                        : field.value?.filter(
                                            (value) => value !== time.value
                                          );
                                      field.onChange(updatedValues);
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">
                                  {time.label}
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
            </div>
          </details>
        </div>
        
        {/* Only show therapist dropdown if not waitlisted and we have therapists to choose from */}
        {!isWaitlisted && therapists.length > 0 && (
          <FormField
            control={form.control}
            name="preferredTherapistId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Therapist</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isWaitlisted || !!therapistId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a therapist" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {therapists.map((therapist: any) => (
                      <SelectItem key={therapist.id} value={therapist.id}>
                        {therapist.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the therapist you want to work with. The system will try to match you with this therapist based on their availability.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        
        {/* Display selected therapist when waitlisted */}
        {isWaitlisted && therapistId && (
          <div className="py-2">
            <h4 className="text-sm font-medium">Preferred Therapist</h4>
            <p className="text-sm text-muted-foreground">
              {therapists.find((t: any) => t.id === therapistId)?.name || 'Selected therapist'}
            </p>
          </div>
        )}
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional information about your availability or preferences" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Optional notes about your schedule or needs.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={requestAppointmentMutation.isPending}
          >
            {requestAppointmentMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {adminMode ? 'Set Student Availability' : 'Submit Availability'}
          </Button>
        </div>
      </form>
    </Form>
  );
}