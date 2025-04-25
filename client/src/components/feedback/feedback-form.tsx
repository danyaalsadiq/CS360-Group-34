import React, { useState } from 'react';
import { StarRating } from './star-rating';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface FeedbackFormProps {
  appointmentId: string;
  therapistId: string;
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

export function FeedbackForm({ appointmentId, therapistId, onSubmitSuccess, onCancel }: FeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const { toast } = useToast();

  const submitFeedbackMutation = useMutation({
    mutationFn: async (data: { rating: number; comments: string }) => {
      // Log data for debugging
      console.log('Submitting feedback with data:', {
        appointmentId,
        therapistId,
        rating: data.rating,
        comments: data.comments,
      });
      
      const response = await apiRequest('POST', '/api/feedback', {
        appointmentId,
        therapistId,
        rating: data.rating,
        comments: data.comments,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Feedback submission failed:', errorData);
        throw new Error(errorData.message || 'Failed to submit feedback');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      
      toast({
        title: 'Feedback submitted',
        description: 'Thank you for your feedback!',
      });
      
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast({
        title: 'Please select a rating',
        description: 'You must provide a star rating before submitting feedback.',
        variant: 'destructive',
      });
      return;
    }

    submitFeedbackMutation.mutate({ rating, comments });
  };

  return (
    <Card className="w-full">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Rate Your Experience</CardTitle>
          <CardDescription>
            How would you rate your experience with this therapist?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center space-y-2">
            <StarRating rating={rating} onChange={setRating} size="lg" />
            <span className="text-sm text-muted-foreground">
              {rating > 0 ? `${rating} out of 5 stars` : 'Select a rating'}
            </span>
          </div>

          <div className="space-y-2">
            <label htmlFor="comments" className="text-sm font-medium">
              Additional Comments (Optional)
            </label>
            <Textarea
              id="comments"
              placeholder="Share your thoughts about this session..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={submitFeedbackMutation.isPending}>
            {submitFeedbackMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Feedback'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}