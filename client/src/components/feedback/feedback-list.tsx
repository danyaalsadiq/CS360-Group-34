import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Feedback, User } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FeedbackModal } from "./feedback-modal";
import { format } from "date-fns";
import { Star, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type ExtendedFeedback = Feedback & {
  appointment: { id: number; date: string; status: string };
  student: { id: number; name: string; profileImage?: string };
};

export function FeedbackList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTherapistId, setSelectedTherapistId] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | undefined>(undefined);
  
  // Fetch therapists for admin
  const { 
    data: therapists = [],
    isLoading: isLoadingTherapists
  } = useQuery<User[]>({
    queryKey: ["/api/users", { role: "therapist" }],
    enabled: !!user && user.role === "admin"
  });
  
  // Set default therapist if admin
  useEffect(() => {
    if (user?.role === "admin" && therapists.length > 0 && !selectedTherapistId) {
      setSelectedTherapistId(therapists[0].id.toString());
    }
  }, [therapists, user, selectedTherapistId]);
  
  // If user is therapist, use their ID
  useEffect(() => {
    if (user?.role === "therapist") {
      setSelectedTherapistId(user.id.toString());
    }
  }, [user]);
  
  // Fetch feedback
  const { 
    data: feedback = [], 
    isLoading: isLoadingFeedback,
    refetch
  } = useQuery<ExtendedFeedback[]>({
    queryKey: ["/api/feedback", { therapistId: parseInt(selectedTherapistId) }],
    enabled: !!selectedTherapistId
  });
  
  // Fetch appointments for student to show pending feedback
  const { 
    data: appointments = [],
    isLoading: isLoadingAppointments
  } = useQuery<{
    id: number;
    date: string;
    status: string;
    therapist: { id: number; name: string; };
    hasFeedback: boolean;
  }[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user && user.role === "student"
  });
  
  // Filter appointments that need feedback (completed but no feedback yet)
  const pendingFeedback = appointments.filter(
    appointment => appointment.status === "completed" && !appointment.hasFeedback
  );

  // Calculate average rating
  const calculateAverageRating = () => {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / feedback.length).toFixed(1);
  };
  
  // Group feedback by rating
  const feedbackByRating = [5, 4, 3, 2, 1].map(rating => {
    const count = feedback.filter(f => f.rating === rating).length;
    const percentage = feedback.length ? Math.round((count / feedback.length) * 100) : 0;
    return { rating, count, percentage };
  });
  
  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? "text-amber-500 fill-current" : "text-gray-300"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">
          {user?.role === "student" ? "Your Feedback" : "Therapist Feedback"}
        </h2>
        
        {user?.role === "admin" && (
          <div className="w-64">
            <Select
              value={selectedTherapistId}
              onValueChange={setSelectedTherapistId}
              disabled={isLoadingTherapists}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a therapist" />
              </SelectTrigger>
              <SelectContent>
                {therapists.map((therapist) => (
                  <SelectItem key={therapist.id} value={therapist.id.toString()}>
                    {therapist.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {user?.role === "student" ? (
        <div className="space-y-6">
          {isLoadingAppointments ? (
            <div className="flex justify-center items-center h-32">
              <p>Loading appointments...</p>
            </div>
          ) : (
            <>
              {pendingFeedback.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium mb-4">Pending Feedback</h3>
                  <div className="space-y-4">
                    {pendingFeedback.map((appointment) => (
                      <Card key={appointment.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium">{appointment.therapist.name}</h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Session on {format(new Date(appointment.date), 'MMMM d, yyyy')} at {format(new Date(appointment.date), 'h:mm a')}
                              </p>
                            </div>
                            <button
                              className="px-4 py-2 rounded-md bg-primary text-white text-sm font-medium flex items-center"
                              onClick={() => {
                                setSelectedAppointmentId(appointment.id);
                                setIsModalOpen(true);
                              }}
                            >
                              <Star className="mr-2 h-4 w-4" />
                              Rate Session
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {pendingFeedback.length === 0 && (
                <Card>
                  <CardContent className="pt-6 pb-6 text-center">
                    <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p>No pending feedback to submit.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {isLoadingFeedback ? (
            <div className="flex justify-center items-center h-32">
              <p>Loading feedback...</p>
            </div>
          ) : feedback.length === 0 ? (
            <Card>
              <CardContent className="pt-6 pb-6 text-center">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p>No feedback available yet.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rating Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center mb-6">
                      <div className="text-4xl font-bold mr-2">{calculateAverageRating()}</div>
                      <div className="flex flex-col">
                        {renderStars(parseFloat(calculateAverageRating()))}
                        <span className="text-sm text-muted-foreground mt-1">
                          {feedback.length} {feedback.length === 1 ? 'review' : 'reviews'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {feedbackByRating.map(({ rating, count, percentage }) => (
                        <div key={rating} className="flex items-center">
                          <div className="w-12 text-sm font-medium">{rating} star</div>
                          <div className="flex-1 mx-4 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-amber-500 rounded-full" 
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="w-12 text-right text-sm text-muted-foreground">
                            {count}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Latest Reviews</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-y-auto space-y-4">
                    {feedback.slice(0, 3).map((item) => (
                      <div key={item.id} className="pb-4 border-b dark:border-neutral-800 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {item.student.profileImage ? (
                              <img 
                                src={item.student.profileImage} 
                                alt={item.student.name}
                                className="w-8 h-8 rounded-full mr-2"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
                                <span className="text-sm font-medium text-primary">
                                  {item.student.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">{item.student.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(item.appointment.date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          {renderStars(item.rating)}
                        </div>
                        {item.comment && (
                          <p className="mt-2 text-sm">"{item.comment}"</p>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">All Feedback</h3>
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center">
                            {item.student.profileImage ? (
                              <img 
                                src={item.student.profileImage} 
                                alt={item.student.name}
                                className="w-10 h-10 rounded-full mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                <span className="text-base font-medium text-primary">
                                  {item.student.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{item.student.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Session on {format(new Date(item.appointment.date), 'MMMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex">
                            {renderStars(item.rating)}
                          </div>
                        </div>
                        
                        {item.comment && (
                          <div className="mt-4 pl-13">
                            <p className="text-sm">"{item.comment}"</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      <FeedbackModal
        isOpen={isModalOpen}
        appointmentId={selectedAppointmentId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />
    </div>
  );
}
