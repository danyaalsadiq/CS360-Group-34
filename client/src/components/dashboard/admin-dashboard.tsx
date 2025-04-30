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
import { MessageSquare } from "lucide-react";
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
      {/* Only showing Forum Moderation and Website Assistant */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {/* Forum Moderation Card */}
        <Card className="bg-white overflow-hidden rounded-xl shadow-md">
          <CardContent className="p-0">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Forum Moderation</h3>
              <p className="text-sm text-neutral-600 mb-4">Review reported content, moderate discussions, and manage forum</p>
              <div className="flex items-center justify-between">
                <div className="bg-[#E7F4F3] rounded-full px-3 py-1 text-sm text-[#417772]">
                  Review required
                </div>
                <MessageSquare className="h-10 w-10 text-[#417772]" />
              </div>
            </div>
            <div className="bg-[#FFF5E1] px-5 py-3 border-t border-[#F0EEEB]">
              <Link href="/forums">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center bg-white hover:bg-[#F8F8F8] text-[#417772] font-medium rounded-full px-4 py-2 shadow-sm"
                >
                  Moderate Forums
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Website Assistant Card */}
        <Card className="bg-white overflow-hidden rounded-xl shadow-md">
          <CardContent className="p-0">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Website Assistant</h3>
              <p className="text-sm text-neutral-600 mb-4">Get help navigating the platform</p>
              <div className="flex items-center justify-between">
                <div className="bg-[#E7F4F3] rounded-full px-3 py-1 text-sm text-[#417772]">
                  Available 24/7
                </div>
                <MessageSquare className="h-10 w-10 text-[#417772]" />
              </div>
            </div>
            <div className="bg-[#FFF5E1] px-5 py-3 border-t border-[#F0EEEB]">
              <Link href="/chat">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center bg-white hover:bg-[#F8F8F8] text-[#417772] font-medium rounded-full px-4 py-2 shadow-sm"
                >
                  Start Chat
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
