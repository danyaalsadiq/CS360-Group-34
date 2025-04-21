import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { CalendarIcon, UserIcon, Clock, Calendar, RefreshCw } from 'lucide-react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlotCalendar } from '@/components/scheduling/slot-calendar';
import { SlotSubmissionModal } from '@/components/scheduling/slot-submission-modal';

export function ManageStudents() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();
  
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [selectedTab, setSelectedTab] = useState('calendar');

  // Fetch students
  const { 
    data: students, 
    isLoading: isLoadingStudents 
  } = useQuery({
    queryKey: ['/api/users', 'student'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users?role=student');
      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json();
    }
  });

  // Fetch slots (appointments and waitlist entries) for the selected student
  const { 
    data: slots,
    isLoading: isLoadingSlots,
    refetch: refetchSlots
  } = useQuery({
    queryKey: ['/api/slots', 'student', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const res = await apiRequest('GET', `/api/slots?student_id=${selectedStudent}`);
      if (!res.ok) throw new Error('Failed to fetch student slots');
      return res.json();
    },
    enabled: !!selectedStudent,
  });

  // Fetch waitlisted slots for the selected student
  const { 
    data: waitlistedSlots,
    isLoading: isLoadingWaitlist,
    refetch: refetchWaitlist
  } = useQuery({
    queryKey: ['/api/slots', 'waitlist', selectedStudent],
    queryFn: async () => {
      if (!selectedStudent) return [];
      const res = await apiRequest('GET', `/api/slots/waitlist?student_id=${selectedStudent}`);
      if (!res.ok) throw new Error('Failed to fetch waitlisted slots');
      return res.json();
    },
    enabled: !!selectedStudent,
  });

  // Mutation for student to request a slot
  const requestSlotMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/slots/student/request', {
        ...data,
        student_id: selectedStudent
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request slot');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Slot has been requested successfully.',
      });
      refetchSlots();
      refetchWaitlist();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to cancel a slot/waitlist entry
  const cancelSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const response = await apiRequest('POST', `/api/slots/${slotId}/cancel`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel slot');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Slot has been cancelled successfully.',
      });
      refetchSlots();
      refetchWaitlist();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to cancel a waitlisted slot
  const cancelWaitlistMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const response = await apiRequest('POST', `/api/slots/waitlist/${slotId}/cancel`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel waitlisted slot');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Waitlisted slot has been cancelled successfully.',
      });
      refetchSlots();
      refetchWaitlist();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle modal open for slot
  const handleModalOpen = (date: string, time: string) => {
    setSlotDate(date);
    setSlotTime(time);
    setIsModalOpen(true);
  };

  // Handle back button
  const handleBack = () => {
    navigate('/admin');
  };

  // Handle student change
  const handleStudentChange = (value: string) => {
    setSelectedStudent(value);
    setSelectedTab('calendar');
  };

  // Handle student request form submission
  const handleAdminStudentRequest = (formData: any) => {
    requestSlotMutation.mutate({
      date: slotDate,
      start_time: slotTime,
      end_time: incrementTimeByOneHour(slotTime),
      ...formData
    });
    setIsModalOpen(false);
  };

  // Handle cancel slot
  const handleCancelSlot = (slotId: string) => {
    cancelSlotMutation.mutate(slotId);
  };

  // Handle cancel waitlisted slot
  const handleCancelWaitlist = (slotId: string) => {
    cancelWaitlistMutation.mutate(slotId);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  // Get day name from date string
  const getDayName = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE');
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Student Calendar</h1>
        <Button variant="outline" onClick={handleBack}>
          Back to Admin Dashboard
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Student</CardTitle>
          <CardDescription>
            Choose a student to view and manage their appointments and waitlist entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedStudent || ''}
              onValueChange={handleStudentChange}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingStudents ? (
                  <SelectItem value="loading" disabled>
                    Loading students...
                  </SelectItem>
                ) : (
                  students?.map((student: any) => (
                    <SelectItem key={student.id} value={student.id.toString()}>
                      {student.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => {
                refetchSlots();
                refetchWaitlist();
              }}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedStudent && (
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="calendar">
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="appointments">
              <Clock className="h-4 w-4 mr-2" />
              Booked Appointments
            </TabsTrigger>
            <TabsTrigger value="waitlist">
              <UserIcon className="h-4 w-4 mr-2" />
              Waitlisted Slots
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Calendar</CardTitle>
                <CardDescription>
                  View and manage the student's calendar. Click on a time slot to request an appointment.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center h-64">
                    <p>Loading calendar...</p>
                  </div>
                ) : (
                  <SlotCalendar
                    onSlotClick={handleModalOpen}
                    studentId={selectedStudent}
                    allowAllInteractions={true}
                    adminMode={true}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appointments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Booked Appointments</CardTitle>
                <CardDescription>
                  View and manage the student's booked appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center h-32">
                    <p>Loading appointments...</p>
                  </div>
                ) : !slots || slots.filter((slot: any) => 
                    slot.status === 'booked' && 
                    slot.student_id === selectedStudent
                  ).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No booked appointments for this student
                  </p>
                ) : (
                  <div className="space-y-4">
                    {slots
                      ?.filter(
                        (slot: any) => 
                          slot.status === 'booked' && 
                          slot.student_id === selectedStudent
                      )
                      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((slot: any) => (
                        <Card key={slot._id} className="overflow-hidden">
                          <div className="flex flex-col sm:flex-row">
                            <div className="p-4 sm:w-2/3">
                              <div className="flex gap-2 items-center mb-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(slot.date)}</span>
                              </div>
                              <div className="flex gap-2 items-center mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{slot.start_time} - {slot.end_time}</span>
                              </div>
                              <div className="flex gap-2 items-center mb-2">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                <span>With: {slot.therapist_name}</span>
                              </div>
                              {slot.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Notes: {slot.notes}
                                </p>
                              )}
                            </div>
                            <div className="bg-muted p-4 flex flex-col justify-center items-center sm:w-1/3">
                              <Button
                                variant="destructive"
                                onClick={() => handleCancelSlot(slot._id)}
                                className="w-full"
                              >
                                Cancel Appointment
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waitlist" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Waitlisted Slots</CardTitle>
                <CardDescription>
                  View and manage the student's waitlisted slots
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingWaitlist ? (
                  <div className="flex items-center justify-center h-32">
                    <p>Loading waitlist...</p>
                  </div>
                ) : !waitlistedSlots || waitlistedSlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No waitlisted slots for this student
                  </p>
                ) : (
                  <div className="space-y-4">
                    {waitlistedSlots
                      ?.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                      .map((slot: any) => (
                        <Card key={slot._id} className="overflow-hidden">
                          <div className="flex flex-col sm:flex-row">
                            <div className="p-4 sm:w-2/3">
                              <div className="flex gap-2 items-center mb-2">
                                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{formatDate(slot.date)}</span>
                              </div>
                              <div className="flex gap-2 items-center mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span>{slot.start_time} - {slot.end_time}</span>
                              </div>
                              <div className="flex gap-2 items-center mb-2">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                <span>Preferred therapist: {slot.therapist_name || "Any"}</span>
                              </div>
                              {slot.notes && (
                                <p className="text-sm text-muted-foreground mt-2">
                                  Notes: {slot.notes}
                                </p>
                              )}
                            </div>
                            <div className="bg-muted p-4 flex flex-col justify-center items-center sm:w-1/3">
                              <Button
                                variant="destructive"
                                onClick={() => handleCancelWaitlist(slot._id)}
                                className="w-full"
                              >
                                Cancel Waitlist
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {!selectedStudent && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Please select a student to manage their calendar
            </p>
          </CardContent>
        </Card>
      )}

      {isModalOpen && selectedStudent && (
        <SlotSubmissionModal 
          date={slotDate}
          startTime={slotTime}
          endTime={incrementTimeByOneHour(slotTime)}
          studentId={selectedStudent}
          adminMode={true}
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onStudentRequest={handleAdminStudentRequest}
        />
      )}
    </div>
  );
}

// Helper function to increment time by one hour
function incrementTimeByOneHour(timeString: string): string {
  const [hours, minutes] = timeString.split(':').map(Number);
  let newHours = hours + 1;
  if (newHours >= 24) {
    newHours = newHours - 24;
  }
  return `${newHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}