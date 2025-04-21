import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Appointment } from "@shared/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Video,
  X,
  CheckCircle,
  AlertCircle,
  Star,
  ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppointmentModal } from "./appointment-modal";
import { format, isAfter, isBefore, isToday, compareAsc } from "date-fns";

type ExtendedAppointment = Appointment & { 
  therapist?: { id: number; name: string; specialization?: string; profileImage?: string }; 
  student?: { id: number; name: string; profileImage?: string };
  hasFeedback?: boolean;
};

export function AppointmentList() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { 
    data: appointments = [], 
    isLoading,
    refetch
  } = useQuery<ExtendedAppointment[]>({
    queryKey: ["/api/appointments"],
    enabled: !!user
  });

  // Organize appointments
  const upcoming = appointments.filter(
    (appointment) => 
      appointment.status === "scheduled" && 
      isAfter(new Date(appointment.date), new Date())
  ).sort((a, b) => compareAsc(new Date(a.date), new Date(b.date)));
  
  const today = appointments.filter(
    (appointment) => 
      appointment.status === "scheduled" && 
      isToday(new Date(appointment.date))
  ).sort((a, b) => compareAsc(new Date(a.date), new Date(b.date)));
  
  const past = appointments.filter(
    (appointment) => 
      appointment.status === "completed" || 
      (appointment.status === "scheduled" && isBefore(new Date(appointment.date), new Date()))
  ).sort((a, b) => compareAsc(new Date(b.date), new Date(a.date))); // Most recent first

  const formatAppointmentTime = (appointment: ExtendedAppointment) => {
    const startTime = new Date(appointment.date);
    const endTime = new Date(startTime.getTime() + appointment.duration * 60000);
    
    return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  };

  // State for appointment detail modal
  const [selectedAppointment, setSelectedAppointment] = useState<ExtendedAppointment | null>(null);

  const handleAppointmentClick = (appointment: ExtendedAppointment) => {
    setSelectedAppointment(appointment);
  };
  
  const renderAppointmentCard = (appointment: ExtendedAppointment) => {
    const appointmentDate = new Date(appointment.date);
    const canJoin = Math.abs(new Date().getTime() - appointmentDate.getTime()) < 15 * 60 * 1000; // within 15 minutes
    
    // Determine who to show based on user role
    const showPerson = user?.role === "student" ? appointment.therapist : appointment.student;
    
    return (
      <Card 
        key={appointment.id} 
        className="mb-4 cursor-pointer transition-colors hover:bg-accent/5"
        onClick={() => handleAppointmentClick(appointment)}
      >
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                {showPerson?.profileImage ? (
                  <img 
                    className="h-12 w-12 rounded-full" 
                    src={showPerson.profileImage} 
                    alt={showPerson.name} 
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-lg font-medium text-primary">
                      {showPerson?.name.charAt(0) || "?"}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <CardTitle className="text-base">{showPerson?.name || "Unknown"}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {user?.role === "student" ? appointment.therapist?.specialization || "Therapist" : "Student"}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className={appointment.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-200" : ""}>
              {appointment.status === "completed" ? "Completed" : "Scheduled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{format(appointmentDate, 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{formatAppointmentTime(appointment)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/">
            <Button variant="ghost" size="icon" className="mr-2">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Appointments</h2>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <p>Loading appointments...</p>
        </div>
      ) : (
        <Tabs defaultValue="upcoming">
          <TabsList className="mb-4">
            <TabsTrigger value="today">
              Today {today.length > 0 && `(${today.length})`}
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming {upcoming.length > 0 && `(${upcoming.length})`}
            </TabsTrigger>
            <TabsTrigger value="past">
              Past {past.length > 0 && `(${past.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="today">
            {today.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p>No appointments scheduled for today.</p>
                </CardContent>
              </Card>
            ) : (
              today.map(renderAppointmentCard)
            )}
          </TabsContent>
          
          <TabsContent value="upcoming">
            {upcoming.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p>No upcoming appointments.</p>
                </CardContent>
              </Card>
            ) : (
              upcoming.map(renderAppointmentCard)
            )}
          </TabsContent>
          
          <TabsContent value="past">
            {past.length === 0 ? (
              <Card>
                <CardContent className="pt-6 pb-6 text-center">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p>No past appointments.</p>
                </CardContent>
              </Card>
            ) : (
              past.map(renderAppointmentCard)
            )}
          </TabsContent>
        </Tabs>
      )}
      
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          refetch();
        }}
      />
      
      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <Dialog open={!!selectedAppointment} onOpenChange={(open) => !open && setSelectedAppointment(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  className="mr-2 -ml-2"
                  onClick={() => setSelectedAppointment(null)}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <DialogTitle>
                  {user?.role === "student" && `Appointment with ${selectedAppointment.therapist?.name || 'Therapist'}`}
                  {user?.role === "therapist" && `Appointment with ${selectedAppointment.student?.name || 'Student'}`}
                  {user?.role === "admin" && "Appointment Details"}
                </DialogTitle>
              </div>
              <DialogDescription>
                {format(new Date(selectedAppointment.date), 'EEEE, MMMM d, yyyy')} at {formatAppointmentTime(selectedAppointment)}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div className="flex items-center">
                    <Badge variant="secondary" className={selectedAppointment.status === "completed" ? "bg-green-100 text-green-800" : ""}>
                      <span className="capitalize">{selectedAppointment.status}</span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium">Duration</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAppointment.duration} minutes
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-2">
                {user?.role === "admin" && (
                  <>
                    <div>
                      <div className="text-sm font-medium">Student</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedAppointment.student?.name || 'Not assigned'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium">Therapist</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedAppointment.therapist?.name || 'Not assigned'}
                      </div>
                    </div>
                  </>
                )}
                
                {user?.role === "student" && selectedAppointment.therapist?.specialization && (
                  <div className="col-span-2">
                    <div className="text-sm font-medium">Specialization</div>
                    <div className="text-sm text-muted-foreground">
                      {selectedAppointment.therapist.specialization}
                    </div>
                  </div>
                )}
              </div>
              
              {selectedAppointment.notes && (
                <div className="pt-2">
                  <div className="text-sm font-medium">Notes</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedAppointment.notes}
                  </div>
                </div>
              )}
              
              <div className="pt-6 flex flex-wrap gap-2">
                {selectedAppointment.status === "scheduled" && (
                  <>
                    <Button 
                      size="sm" 
                      variant="default"
                      className="flex items-center"
                      disabled={!isToday(new Date(selectedAppointment.date))}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      Join Session
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex items-center"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  </>
                )}
                
                {selectedAppointment.status === "completed" && user?.role === "student" && !selectedAppointment.hasFeedback && (
                  <Link href={`/feedback/new/${selectedAppointment.id}`}>
                    <Button 
                      size="sm" 
                      className="flex items-center"
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Rate Session
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
