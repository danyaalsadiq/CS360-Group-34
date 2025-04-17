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
  User,
  MessageSquare,
  BarChart3,
  ArrowRight,
  Star,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { Appointment, User as UserType } from "@shared/schema";

export function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch appointments
  const { 
    data: appointments = [], 
    isLoading: isLoadingAppointments,
    error: appointmentsError
  } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user
  });
  
  // Fetch users
  const { 
    data: therapists = [], 
    isLoading: isLoadingTherapists,
    error: therapistsError
  } = useQuery<UserType[]>({
    queryKey: ["/api/users", { role: "therapist" }],
    enabled: !!user
  });
  
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
        description: "Failed to load the appointments. Please try again later.",
        variant: "destructive",
      });
    }
    
    if (therapistsError || studentsError) {
      toast({
        title: "Error loading users",
        description: "Failed to load user data. Please try again later.",
        variant: "destructive",
      });
    }
  }, [appointmentsError, therapistsError, studentsError, toast]);

  // Calculate metrics
  const totalAppointments = appointments.length;
  const completedAppointments = appointments.filter(appointment => appointment.status === "completed").length;
  const scheduledAppointments = appointments.filter(appointment => appointment.status === "scheduled").length;
  
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
    .length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Removed redundant heading as it's already in the header */}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-primary/10 dark:bg-primary/20 rounded-md p-3">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    Therapists
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-neutral-900 dark:text-white">
                      {isLoadingTherapists ? "..." : therapists.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
            <Link href="/therapists">
              <Button variant="link" className="h-auto p-0">
                Manage therapists
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
                      {isLoadingStudents ? "..." : students.length}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
            <Link href="/students">
              <Button variant="link" className="h-auto p-0">
                Manage students
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 dark:bg-amber-900/30 rounded-md p-3">
                <Calendar className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    Today's Sessions
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-neutral-900 dark:text-white">
                      {isLoadingAppointments ? "..." : todaysAppointments}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
            <Link href="/schedule">
              <Button variant="link" className="h-auto p-0">
                View schedule
              </Button>
            </Link>
          </CardFooter>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 rounded-md p-3">
                <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-neutral-500 dark:text-neutral-400 truncate">
                    Total Sessions
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-neutral-900 dark:text-white">
                      {isLoadingAppointments ? "..." : totalAppointments}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 px-5 py-3">
            <Link href="/analytics">
              <Button variant="link" className="h-auto p-0">
                View analytics
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>

      {/* Session Statistics */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
          Session Statistics
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-primary">
                  {isLoadingAppointments ? "..." : completedAppointments}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Completed Sessions
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-amber-500">
                  {isLoadingAppointments ? "..." : scheduledAppointments}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Upcoming Sessions
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-col items-center">
                <div className="text-3xl font-bold text-green-500">
                  {isLoadingAppointments && isLoadingTherapists ? "..." : 
                    therapists.length > 0 ? (totalAppointments / therapists.length).toFixed(1) : "0"}
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                  Avg. Sessions per Therapist
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg leading-6 font-medium text-neutral-900 dark:text-white">
                Schedule Sessions
              </h3>
              <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                <p>Assign therapists to students and schedule new therapy sessions.</p>
              </div>
              <div className="mt-5">
                <Link href="/schedule/new">
                  <Button className="flex items-center">
                    <Calendar className="-ml-1 mr-2 h-5 w-5" />
                    Schedule Session
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg leading-6 font-medium text-neutral-900 dark:text-white">
                Therapist Feedback
              </h3>
              <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                <p>View student feedback for all therapists in the system.</p>
              </div>
              <div className="mt-5">
                <Link href="/feedback">
                  <Button className="flex items-center">
                    <Star className="-ml-1 mr-2 h-5 w-5" />
                    View Feedback
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg leading-6 font-medium text-neutral-900 dark:text-white">
                Forum Moderation
              </h3>
              <div className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                <p>Moderate community discussions and manage forum content.</p>
              </div>
              <div className="mt-5">
                <Link href="/forums">
                  <Button className="flex items-center">
                    <MessageSquare className="-ml-1 mr-2 h-5 w-5" />
                    Moderate Forums
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Settings */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-neutral-900 dark:text-white mb-4">
          System Management
        </h2>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg leading-6 font-medium text-neutral-900 dark:text-white">
                  System Settings
                </h3>
                <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                  Manage application settings, user access, and system configuration.
                </p>
              </div>
              <Link href="/settings">
                <Button variant="outline" className="flex items-center">
                  <Settings className="mr-2 h-5 w-5" />
                  Configure
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
