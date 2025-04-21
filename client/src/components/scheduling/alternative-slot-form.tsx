import { useState } from 'react';
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

export interface AlternativeSlotFormProps {
  date: string;
  startTime: string;
  endTime: string;
  therapistId?: string;
  therapistName?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AlternativeSlotForm({
  date,
  startTime,
  endTime,
  therapistId,
  therapistName,
  onSuccess,
  onCancel
}: AlternativeSlotFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // State for option selection
  const [option, setOption] = useState<'auto' | 'other'>('auto');
  
  // State for response display
  const [responseStatus, setResponseStatus] = useState<'idle' | 'loading' | 'success' | 'no_match' | 'error'>('idle');
  const [responseMessage, setResponseMessage] = useState<string>('');
  const [alternativeSlot, setAlternativeSlot] = useState<any>(null);
  
  // Submit alternative slot request
  const requestAlternativeMutation = useMutation({
    mutationFn: async () => {
      // If option is 'auto', try to find the next available slot
      // If option is 'other', just add student to waiting list for the selected date/time
      
      if (option === 'auto') {
        // Send the request to find any available slot
        const response = await apiRequest(
          'POST',
          '/api/slots/student/request',
          {
            preferred_days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
            preferred_times: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            preferred_therapist_id: therapistId,
            notes: `Auto-requested after original slot was unavailable`
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to request alternative slot');
        }
        
        return response.json();
      } else {
        // Add student to waiting list for the specific date/time
        const response = await apiRequest(
          'POST',
          '/api/slots/student/request',
          {
            specific_date: date,
            specific_time: startTime,
            preferred_therapist_id: therapistId,
            notes: 'Waiting for therapist to mark this slot as available'
          }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add to waiting list');
        }
        
        return response.json();
      }
    },
    onSuccess: (data) => {
      console.log('Alternative slot response:', data);
      
      if (data.match_status === 'matched' || data.match_status === 'alternate_offered') {
        // Found an immediate match
        setResponseStatus('success');
        setAlternativeSlot(data);
        setResponseMessage('Great! We found an available slot for you.');
        queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      } else if (data.match_status === 'waiting') {
        // Added to waiting list
        setResponseStatus('success');
        setResponseMessage(data.message || 'You have been added to the waiting list for this slot. You will be notified if the therapist makes this slot available.');
        queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
        
        // Close the modal after a short delay for waiting list confirmation
        setTimeout(() => {
          onSuccess();
        }, 3000);
      } else if (data.match_status === 'no_match' || data.match_status === 'pending') {
        // No match found
        setResponseStatus('no_match');
        setResponseMessage(data.message || 'No matching slots were found. Please try selecting different availability options.');
      } else {
        // For 'already_booked' or other unknown statuses
        setResponseStatus('success');
        setResponseMessage(data.message || 'Your request has been processed.');
        
        // Close the modal after a short delay
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    },
    onError: (error: Error) => {
      console.error('Alternative slot request error:', error);
      setResponseStatus('error');
      setResponseMessage(error.message);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  const handleSubmit = () => {
    setResponseStatus('loading');
    requestAlternativeMutation.mutate();
  };
  
  // Render the success message after finding an alternative slot
  const renderSuccess = () => {
    if (!alternativeSlot) {
      return (
        <Alert className="bg-green-50 border-green-200 mb-4">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-700">
            {responseMessage}
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <div className="space-y-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-700">
            {responseMessage}
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-md">Alternative Slot Details</CardTitle>
            <CardDescription>
              You've been assigned to the following slot
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Date:</span>
                <span className="text-sm">{format(new Date(alternativeSlot.date), 'EEEE, MMMM d, yyyy')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Time:</span>
                <span className="text-sm">{alternativeSlot.start_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Therapist:</span>
                <span className="text-sm">{alternativeSlot.therapist_name}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={onSuccess}
            >
              Close
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  };
  
  // Render the no match message
  const renderNoMatch = () => {
    return (
      <div className="space-y-4">
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertDescription className="text-yellow-700">
            {responseMessage}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Close
          </Button>
          <Button onClick={onSuccess}>
            View Calendar
          </Button>
        </div>
      </div>
    );
  };
  
  // Render the error message
  const renderError = () => {
    return (
      <div className="space-y-4">
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-700">
            {responseMessage || 'An error occurred while processing your request. Please try again.'}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-end space-x-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button onClick={() => setResponseStatus('idle')}>
            Try Again
          </Button>
        </div>
      </div>
    );
  };
  
  // Render the form
  const renderForm = () => {
    return (
      <div className="space-y-6">
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-700">
            This slot is already booked or not yet marked by the therapist. You can either join the waiting list for this specific time, or let the system find you any available slot with {therapistName || 'this therapist'}.
          </AlertDescription>
        </Alert>
        
        <RadioGroup value={option} onValueChange={(value) => setOption(value as 'auto' | 'other')} className="space-y-4">
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="auto" id="auto" className="mt-1" />
            <div className="grid gap-1.5">
              <Label htmlFor="auto" className="font-medium">
                Find me the next available slot
              </Label>
              <p className="text-sm text-muted-foreground">
                The system will automatically find and book you into the next available slot with {therapistName || 'this therapist'}.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-2">
            <RadioGroupItem value="other" id="other" className="mt-1" />
            <div className="grid gap-1.5">
              <Label htmlFor="other" className="font-medium">
                Join waiting list for this slot
              </Label>
              <p className="text-sm text-muted-foreground">
                You'll be added to the waiting list for this specific time slot. If the therapist marks it as available, you may be assigned to it.
              </p>
            </div>
          </div>
        </RadioGroup>
        
        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <ArrowRight className="mr-2 h-4 w-4" />
            Continue
          </Button>
        </div>
      </div>
    );
  };
  
  // Render loading state
  const renderLoading = () => {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin text-primary mx-auto h-6 w-6 mb-4">
          <RefreshCw className="h-6 w-6" />
        </div>
        <p className="text-sm text-muted-foreground">
          Looking for available slots...
        </p>
      </div>
    );
  };
  
  // Determine which content to render based on the response status
  switch (responseStatus) {
    case 'loading':
      return renderLoading();
    case 'success':
      return renderSuccess();
    case 'no_match':
      return renderNoMatch();
    case 'error':
      return renderError();
    case 'idle':
    default:
      return renderForm();
  }
}