import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Users,
  Star,
  ArrowRight,
  Video,
  Clock,
  User
} from "lucide-react";
import { format } from "date-fns";
import { Appointment, Feedback, User as UserType } from "@shared/schema";

export function TherapistDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch appointments
  const { 
    data: appointments = [], 
    isLoading: isLoadingAppointments,
    error: appointmentsError
  } = useQuery<(Appointment & { 
    student?: { id: number; name: string; profileImage?: string }; 
    _id?: string; // MongoDB ID
  })[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user
  });
  
  // Fetch feedback
  const { 
    data: feedback = [], 
    isLoading: isLoadingFeedback, 
    error: feedbackError
  } = useQuery<(Feedback & { 
    appointment?: { id: number; date: string; status: string };
    student?: { id: number; name: string; profileImage?: string };
    studentName?: string;
    appointmentDate?: string;
    appointmentStatus?: string;
    _id?: string;  // MongoDB ID
  })[]>({
    queryKey: [`/api/feedback/therapist/${user?.id}`],
    enabled: !!user && !!user.id
  });
  
  // Fetch students
  const { 
    data: students = [], 
    isLoading: isLoadingStudents, 
    error: studentsError
  } = useQuery<UserType[]>({
    queryKey: ["/api/users", { role: "student" }],
    enabled: !!user
  });

  useEffect(() => {
    if (appointmentsError) {
      toast({
        title: "Error loading appointments",
        description: "Failed to load your appointments. Please try again later.",
        variant: "destructive",
      });
    }
    
    if (feedbackError) {
      toast({
        title: "Error loading feedback",
        description: "Failed to load your feedback. Please try again later.",
        variant: "destructive",
      });
    }
    
    if (studentsError) {
      toast({
        title: "Error loading students",
        description: "Failed to load student data. Please try again later.",
        variant: "destructive",
      });
    }
  }, [appointmentsError, feedbackError, studentsError, toast]);

  // Filter appointments for today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todaysAppointments = appointments
    .filter(appointment => {
      const appointmentDate = new Date(appointment.date);
      return appointmentDate >= today && appointmentDate < tomorrow;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Calculate average rating
  const calculateAverageRating = () => {
    if (feedback.length === 0) return 0;
    const sum = feedback.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / feedback.length).toFixed(1);
  };
  
  const averageRating = calculateAverageRating();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Removed redundant greeting as it's already in the header */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 rounded-md p-3">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    Today's Sessions
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-neutral-900 dark:text-white">
                      {isLoadingAppointments ? "..." : todaysAppointments.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
            <Link href="/appointments">
              <Button variant="link" className="h-auto p-0">
                View schedule
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-md p-3">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    Students
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-neutral-900 dark:text-white">
                      {isLoadingStudents ? "..." : "0"}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
            <Link href="/students">
              <Button variant="link" className="h-auto p-0">
                View students
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 rounded-md p-3">
                <Star className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    Average Rating
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-neutral-900 dark:text-white">
                      {isLoadingFeedback ? "..." : (
                        feedback.length > 0 ? 
                        <span className="flex items-center">
                          {averageRating}
                          <Star className="ml-1 h-4 w-4 fill-current text-amber-500" />
                          <span className="text-sm text-neutral-500 dark:text-neutral-400 ml-1">
                            ({feedback.length} reviews)
                          </span>
                        </span> : 
                        <span className="text-sm">No reviews yet</span>
                      )}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
            <Link href="/feedback">
              <Button variant="link" className="h-auto p-0">
                View feedback
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Today's Appointments */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
          Today's Sessions
        </h2>
        <Card>
          <CardContent className="p-0">
            {isLoadingAppointments ? (
              <div className="p-6 text-center">Loading sessions...</div>
            ) : todaysAppointments.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                No sessions scheduled for today.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {todaysAppointments.map((appointment) => {
                  const appointmentDate = new Date(appointment.date);
                  const canJoin = Math.abs(new Date().getTime() - appointmentDate.getTime()) < 15 * 60 * 1000; // within 15 minutes
                  
                  // Handle possible missing student data
                  const studentName = appointment.student?.name || "Student";
                  const studentInitial = studentName.charAt(0);
                  const studentId = appointment.student?.id || "";
                  
                  return (
                    <li key={appointment.id || appointment._id}>
                      <div className="block hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                        <div className="flex items-center px-4 py-4 sm:px-6">
                          <div className="min-w-0 flex-1 flex items-center">
                            <div className="flex-shrink-0">
                              {/* Always use avatar for consistency */}
                              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-lg font-medium text-primary">
                                  {studentInitial}
                                </span>
                              </div>
                            </div>
                            <div className="min-w-0 flex-1 px-4">
                              <div>
                                <p className="text-sm font-medium text-primary truncate">
                                  {studentName}
                                </p>
                                <p className="mt-1 flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                                  <span>Therapy Session</span>
                                </p>
                                <p className="mt-1 flex items-center text-xs text-neutral-500 dark:text-neutral-400">
                                  <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                                  <span>
                                    {format(appointmentDate, 'h:mm a')} - 
                                    {format(new Date(appointmentDate.getTime() + appointment.duration * 60000), ' h:mm a')}
                                  </span>
                                </p>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div className="ml-5 flex flex-col gap-2 md:flex-row">
                              <Button 
                                size="sm" 
                                variant={canJoin ? "default" : "secondary"}
                                disabled={!canJoin}
                                className="flex items-center"
                              >
                                <Video className="-ml-0.5 mr-2 h-4 w-4" />
                                Join Session
                              </Button>
                              {studentId && (
                                <Link href={`/student/${studentId}`}>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex items-center"
                                  >
                                    <User className="-ml-0.5 mr-2 h-4 w-4" />
                                    View Profile
                                  </Button>
                                </Link>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
            <Link href="/appointments">
              <Button variant="link" className="h-auto p-0">
                View full schedule <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Recent Feedback */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
          Recent Feedback
        </h2>
        <Card>
          <CardContent className="p-0">
            {isLoadingFeedback ? (
              <div className="p-6 text-center">Loading feedback...</div>
            ) : feedback.length === 0 ? (
              <div className="p-6 text-center text-neutral-500 dark:text-neutral-400">
                No feedback received yet.
              </div>
            ) : (
              <ul className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {feedback.slice(0, 3).map((item) => {
                  // Get student name from either format (direct or nested)
                  const studentName = item.studentName || (item.student?.name) || "Anonymous";
                  
                  // Get date from either format (direct or nested)
                  const appointmentDate = item.appointmentDate || 
                    (item.appointment?.date) || new Date().toISOString();
                  
                  // Function to render star rating
                  const renderStarRating = (rating: number) => (
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < rating ? "text-amber-500 fill-current" : "text-gray-300"}`} 
                        />
                      ))}
                    </div>
                  );
                  
                  return (
                    <li key={item.id || item._id}>
                      <div className="px-4 py-4 sm:px-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {/* Use avatar with initials */}
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                              <span className="text-base font-medium text-primary">
                                {studentName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-neutral-900 dark:text-white">
                                {studentName}
                              </p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                                {format(new Date(appointmentDate), 'MMMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            {renderStarRating(item.rating)}
                          </div>
                        </div>
                        {item.comments && (
                          <div className="mt-2">
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">
                              "{item.comments}"
                            </p>
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
          {feedback.length > 3 && (
            <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
              <Link href="/feedback">
                <Button variant="link" className="h-auto p-0">
                  View all feedback <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          )}
        </Card>
      </div>

      {/* No session actions section as requested */}
    </div>
  );
}
