import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, User, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

interface CancellationFormProps {
  slotId: string;
  date: string;
  startTime: string;
  endTime: string;
  therapistName?: string;
  studentName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const formSchema = z.object({
  reason: z.string().min(5, 'Please provide a reason for cancellation'),
});

type FormValues = z.infer<typeof formSchema>;

export function CancellationForm({
  slotId,
  date,
  startTime,
  endTime,
  therapistName,
  studentName,
  onSuccess,
  onCancel,
}: CancellationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: '',
    },
  });
  
  const cancelMutation = useMutation({
    mutationFn: async (values: FormValues) => {
      return await apiRequest('POST', '/api/scheduling/cancellations', {
        slotId,
        userId: user?.id,
        userRole: user?.role,
        reason: values.reason,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Cancellation Requested',
        description: 'Your cancellation request has been submitted successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/scheduling/slots'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit cancellation request. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  const onSubmit = (values: FormValues) => {
    cancelMutation.mutate(values);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Cancel Appointment</CardTitle>
        <CardDescription>
          Please provide a reason for cancelling this appointment
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">
                  {startTime} - {endTime}
                </span>
              </div>
            </div>
            
            {therapistName && user?.role === 'student' && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Therapist: {therapistName}</span>
              </div>
            )}
            
            {studentName && user?.role === 'therapist' && (
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2 text-gray-500" />
                <span className="text-sm">Student: {studentName}</span>
              </div>
            )}
            
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Are you sure you want to cancel?
                  </p>
                  <p className="text-xs mt-1 text-amber-700">
                    Cancellation requests may take time to process. The appointment will remain in your schedule until the cancellation is approved.
                  </p>
                </div>
              </div>
            </div>
            
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Cancellation</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please explain why you need to cancel this appointment"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" onClick={onCancel}>
              Back
            </Button>
            <Button variant="destructive" type="submit" disabled={cancelMutation.isPending}>
              {cancelMutation.isPending ? 'Submitting...' : 'Submit Cancellation'}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}