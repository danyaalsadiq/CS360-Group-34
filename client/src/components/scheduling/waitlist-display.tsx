import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Clock, Calendar, X, AlertCircle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface WaitlistDisplayProps {
  slotId: string;
  therapistName: string;
  date: string;
  time: string;
  onSuccess: () => void;
}

export function WaitlistDisplay({
  slotId,
  therapistName,
  date,
  time,
  onSuccess,
}: WaitlistDisplayProps) {
  const { toast } = useToast();
  const [studentRequestId, setStudentRequestId] = useState<string>('');
  
  // Get the student request ID associated with this slot
  const getStudentRequestIdMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', `/api/student-requests?slot_id=${slotId}`);
      if (!response.ok) {
        throw new Error('Failed to get request details');
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.length > 0) {
        setStudentRequestId(data[0]._id);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Call this when component mounts
  React.useEffect(() => {
    if (slotId) {
      getStudentRequestIdMutation.mutate();
    }
  }, [slotId]);
  
  // Cancel waitlist request mutation
  const cancelWaitlistMutation = useMutation({
    mutationFn: async () => {
      // Try to cancel the slot waitlist request
      const response = await apiRequest(
        'DELETE', 
        `/api/slots/waitlist/${slotId}`, 
        {}
      );
      
      if (!response.ok) {
        // If the direct slot deletion fails, try to delete the student request
        if (studentRequestId) {
          const fallbackResponse = await apiRequest('DELETE', `/api/student-requests/${studentRequestId}`);
          if (!fallbackResponse.ok) {
            throw new Error('Failed to remove from waitlist');
          }
          return fallbackResponse.json();
        } else {
          throw new Error('Failed to remove from waitlist');
        }
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      toast({
        title: 'Availability cancelled',
        description: 'You have been successfully removed from the waitlist for this slot.',
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  return (
    <div className="space-y-4 py-4">
      <div className="grid gap-2">
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">{format(new Date(date), 'EEEE, MMMM d, yyyy')}</span>
        </div>
        <div className="flex items-center">
          <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">{time}</span>
        </div>
        <div className="flex items-center">
          <User className="h-4 w-4 mr-2 text-muted-foreground" />
          <span className="text-sm">Preferred Therapist: {therapistName}</span>
        </div>
      </div>
      
      <div className="pt-2">
        <Button 
          variant="destructive" 
          onClick={() => cancelWaitlistMutation.mutate()}
          disabled={cancelWaitlistMutation.isPending || !studentRequestId}
          className="w-full"
        >
          {cancelWaitlistMutation.isPending ? (
            <span className="flex items-center justify-center">
              <Clock className="mr-2 h-4 w-4 animate-spin" />
              Cancelling Availability...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <X className="mr-2 h-4 w-4" />
              Cancel Availability
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}