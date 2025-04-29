import { useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { FeedbackModal } from "@/components/feedback/feedback-modal";
import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Star,
  ArrowRight,
  Video,
  Clock,
  MessageSquare,
  Plus,
  Users
} from "lucide-react";
import { formatRelative, format, isBefore, isToday } from "date-fns";
import { Appointment } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";

export function StudentDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch appointments
  const { 
    data: appointments = [], 
    isLoading: isLoadingAppointments,
    error: appointmentsError
  } = useQuery<(Appointment & { 
    therapist: { id: number; name: string; specialization?: string; profileImage?: string }; 
    hasFeedback: boolean;
  })[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user
  });

  // Filter appointments
  const upcomingAppointments = appointments
    .filter(appointment => 
      appointment.status === "scheduled" && 
      !isBefore(new Date(appointment.date), new Date())
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const pendingFeedback = appointments
    .filter(appointment => 
      appointment.status === "completed" && 
      !appointment.hasFeedback
    );

  return (
    <div className="max-w-7xl mx-auto">
      {/* Removed redundant greeting as it's already in the header */}

      {/* Main Feature Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3 mb-8">
        {/* Appointments Card */}
        <Card className="bg-white overflow-hidden rounded-xl shadow-md">
          <CardContent className="p-0">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Appointments</h3>
              <p className="text-sm text-neutral-600 mb-4">View and schedule your therapy sessions</p>
              <div className="flex items-center justify-between">
                <div className="bg-[#E7F4F3] rounded-full px-3 py-1 text-sm text-[#417772]">
                  {isLoadingAppointments ? "..." : `${upcomingAppointments.length} upcoming`}
                </div>
                <Calendar className="h-10 w-10 text-[#417772]" />
              </div>
            </div>
            <div className="bg-[#FFF5E1] px-5 py-3 border-t border-[#F0EEEB]">
              <Link href="/appointments">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center bg-white hover:bg-[#F8F8F8] text-[#417772] font-medium rounded-full px-4 py-2 shadow-sm"
                >
                  View Appointments
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* Feedback Card */}
        <Card className="bg-white overflow-hidden rounded-xl shadow-md">
          <CardContent className="p-0">
            <div className="p-5">
              <h3 className="text-lg font-semibold text-neutral-800 mb-2">Feedback</h3>
              <p className="text-sm text-neutral-600 mb-4">Rate and review your therapy sessions</p>
              <div className="flex items-center justify-between">
                <div className="bg-[#E7F4F3] rounded-full px-3 py-1 text-sm text-[#417772]">
                  {isLoadingAppointments ? "..." : `${pendingFeedback.length} pending`}
                </div>
                <Star className="h-10 w-10 text-[#CD9746]" />
              </div>
            </div>
            <div className="bg-[#FFF5E1] px-5 py-3 border-t border-[#F0EEEB]">
              <Link href="/feedback">
                <Button 
                  variant="ghost" 
                  className="w-full justify-center bg-white hover:bg-[#F8F8F8] text-[#417772] font-medium rounded-full px-4 py-2 shadow-sm"
                >
                  Submit Feedback
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
        
        {/* AI Chat Card */}
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

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-neutral-800">
            Upcoming Appointments
          </h2>
          <Link href="/appointments/new">
            <Button 
              className="bg-[#FFF5E1] hover:bg-[#FFE9C4] text-[#CD9746] border border-[#EADDCA] hover:border-[#EECA93]"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
            </Button>
          </Link>
        </div>
        
        {isLoadingAppointments ? (
          <div className="p-6 text-center bg-white rounded-xl shadow-md">Loading appointments...</div>
        ) : upcomingAppointments.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-xl shadow-md">
            <div className="p-6 text-center text-neutral-600">
              No upcoming appointments. 
              <Link href="/appointments/new">
                <Button variant="link" className="text-[#417772] px-1 py-0">
                  Book one now
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {upcomingAppointments.slice(0, 2).map((appointment) => {
              const appointmentDate = new Date(appointment.date);
              const isToday = new Date().toDateString() === appointmentDate.toDateString();
              const canJoin = Math.abs(new Date().getTime() - appointmentDate.getTime()) < 15 * 60 * 1000; // within 15 minutes
              
              return (
                <Card key={appointment.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <CardContent className="p-0">
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center">
                          {appointment.therapist.profileImage ? (
                            <img 
                              className="h-12 w-12 rounded-full mr-3" 
                              src={appointment.therapist.profileImage} 
                              alt={appointment.therapist.name} 
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-[#E7F4F3] text-[#417772] flex items-center justify-center mr-3">
                              <span className="text-lg font-medium">
                                {appointment.therapist.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="text-lg font-semibold text-neutral-800">
                              {appointment.therapist.name}
                            </p>
                            <p className="text-sm text-neutral-600">
                              {appointment.therapist.specialization || "Therapist"}
                            </p>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-[#E7F4F3] text-sm text-[#417772]">
                          {appointment.status}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2 mb-5">
                        <div className="flex items-center text-neutral-700">
                          <Calendar className="h-5 w-5 mr-3 text-[#417772]" />
                          <span className="text-sm">
                            {isToday ? 'Today' : format(appointmentDate, 'EEEE, MMMM d, yyyy')}
                          </span>
                        </div>
                        <div className="flex items-center text-neutral-700">
                          <Clock className="h-5 w-5 mr-3 text-[#417772]" />
                          <span className="text-sm">
                            {format(appointmentDate, 'h:mm a')} - 
                            {format(new Date(appointmentDate.getTime() + appointment.duration * 60000), ' h:mm a')} 
                            ({appointment.duration} min)
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-3">
                        <Button 
                          className={`flex-1 rounded-full ${canJoin ? 
                            'bg-[#417772] hover:bg-[#356560] text-white' : 
                            'bg-neutral-100 text-neutral-400'}`}
                          disabled={!canJoin}
                        >
                          <Video className="mr-2 h-4 w-4" />
                          Join Session
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1 rounded-full border-[#E7F4F3] text-[#417772] hover:bg-[#E7F4F3]/50"
                        >
                          <Clock className="mr-2 h-4 w-4" />
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
        
        {upcomingAppointments.length > 2 && (
          <div className="mt-4 text-center">
            <Link href="/appointments">
              <Button variant="link" className="text-[#417772]">
                View all {upcomingAppointments.length} appointments <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Pending Feedback */}
      {pendingFeedback.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-800">
              Pending Feedback
            </h2>
            <Link href="/feedback">
              <Button 
                className="text-[#417772] bg-[#E7F4F3] hover:bg-[#D5EEEA] border border-[#D5EEEA]"
              >
                <Star className="mr-2 h-4 w-4" />
                All Feedback
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {pendingFeedback.map((appointment) => (
              <Card key={appointment.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <CardContent className="p-0">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        {appointment.therapist.profileImage ? (
                          <img 
                            className="h-12 w-12 rounded-full mr-3" 
                            src={appointment.therapist.profileImage} 
                            alt={appointment.therapist.name} 
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-[#FFF5E1] text-[#CD9746] flex items-center justify-center mr-3">
                            <span className="text-lg font-medium">
                              {appointment.therapist.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="text-lg font-semibold text-neutral-800">
                            {appointment.therapist.name}
                          </p>
                          <p className="text-sm text-neutral-600">
                            {appointment.therapist.specialization || "Therapist"}
                          </p>
                        </div>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-[#FFF5E1] text-sm text-[#CD9746]">
                        Needs feedback
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 mb-5">
                      <div className="flex items-center text-neutral-700">
                        <Calendar className="h-5 w-5 mr-3 text-[#417772]" />
                        <span className="text-sm">
                          {format(new Date(appointment.date), 'EEEE, MMMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center text-neutral-700">
                        <Clock className="h-5 w-5 mr-3 text-[#417772]" />
                        <span className="text-sm">
                          {format(new Date(appointment.date), 'h:mm a')} - 
                          {format(new Date(new Date(appointment.date).getTime() + appointment.duration * 60000), ' h:mm a')}
                        </span>
                      </div>
                    </div>

                    <Link href={`/feedback/new/${appointment.id}`}>
                      <Button 
                        className="w-full rounded-full bg-[#CD9746] hover:bg-[#BD8736] text-white"
                      >
                        <Star className="mr-2 h-4 w-4" />
                        Rate Session
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}