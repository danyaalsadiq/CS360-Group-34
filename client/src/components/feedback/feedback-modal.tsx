import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { insertFeedbackSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Appointment } from "@shared/schema";
import { format } from "date-fns";
import { Star } from "lucide-react";

// Extended schema with validation
const feedbackFormSchema = insertFeedbackSchema.extend({
  rating: z.number().min(1, "Please select a rating").max(5, "Please select a rating"),
});

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

interface FeedbackModalProps {
  isOpen: boolean;
  appointmentId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function FeedbackModal({ isOpen, appointmentId, onClose, onSuccess }: FeedbackModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  
  // Get appointment details
  const { 
    data: appointment,
    isLoading: isLoadingAppointment
  } = useQuery<Appointment & { 
    therapist: { id: number; name: string; specialization?: string; }
  }>({
    queryKey: ["/api/appointments", appointmentId],
    enabled: isOpen && !!appointmentId && !!user
  });

  // Form setup
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      appointmentId: appointmentId,
      rating: 0,
      comment: ""
    }
  });
  
  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && appointmentId) {
      form.reset({
        appointmentId: appointmentId,
        rating: 0,
        comment: ""
      });
    }
  }, [isOpen, appointmentId, form]);

  // Form submission
  const onSubmit = async (data: FeedbackFormValues) => {
    try {
      setIsSubmitting(true);
      
      await apiRequest("POST", "/api/feedback", data);
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/feedback"] });
      
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      
      onSuccess();
    } catch (error) {
      toast({
        title: "Failed to submit feedback",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarClick = (rating: number) => {
    form.setValue("rating", rating);
  };

  const renderStars = () => {
    const stars = [];
    const currentRating = form.getValues("rating");
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 focus:outline-none"
          onMouseEnter={() => setHoveredRating(i)}
          onMouseLeave={() => setHoveredRating(0)}
          onClick={() => handleStarClick(i)}
        >
          <Star 
            className={`h-8 w-8 ${
              i <= (hoveredRating || currentRating) 
                ? "text-amber-500 fill-current" 
                : "text-neutral-300 dark:text-neutral-600"
            }`} 
          />
        </button>
      );
    }
    
    return stars;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Rate Your Session</DialogTitle>
          {appointment && (
            <DialogDescription>
              Please rate your session with {appointment.therapist.name} on {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}.
            </DialogDescription>
          )}
        </DialogHeader>
        
        {isLoadingAppointment ? (
          <div className="py-4 text-center">Loading appointment details...</div>
        ) : !appointment ? (
          <div className="py-4 text-center text-red-500">
            Appointment details not found. Please try again.
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex flex-col items-center">
                      <FormLabel className="mb-2">How would you rate your session?</FormLabel>
                      <div className="flex justify-center space-x-1">
                        {renderStars()}
                      </div>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="comment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Comments (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Share your thoughts about the session..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}