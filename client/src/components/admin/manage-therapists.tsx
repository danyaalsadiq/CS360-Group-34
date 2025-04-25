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

export function ManageTherapists() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [_, navigate] = useLocation();

  const [selectedTherapist, setSelectedTherapist] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [slotDate, setSlotDate] = useState('');
  const [slotTime, setSlotTime] = useState('');
  const [selectedTab, setSelectedTab] = useState('calendar');

  // Fetch therapists
  const { 
    data: therapists, 
    isLoading: isLoadingTherapists 
  } = useQuery({
    queryKey: ['/api/users', 'therapist'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/users?role=therapist');
      if (!res.ok) throw new Error('Failed to fetch therapists');
      return res.json();
    }
  });

  // Fetch slots for the selected therapist
  const { 
    data: slots,
    isLoading: isLoadingSlots,
    refetch: refetchSlots
  } = useQuery({
    queryKey: ['/api/slots', selectedTherapist],
    queryFn: async () => {
      if (!selectedTherapist) return [];
      const res = await apiRequest('GET', `/api/slots?therapist_id=${selectedTherapist}`);
      if (!res.ok) throw new Error('Failed to fetch therapist slots');
      return res.json();
    },
    enabled: !!selectedTherapist,
  });

  // Mutation to mark slot availability on behalf of a therapist
  const markAvailabilityMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/slots/therapist/availability', {
        ...data,
        therapist_id: selectedTherapist
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark availability');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Therapist availability has been marked successfully.',
      });
      refetchSlots();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation to cancel a slot
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
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle modal open
  const handleModalOpen = (date: string, time: string) => {
    setSlotDate(date);
    setSlotTime(time);
    setIsModalOpen(true);
  };

  // Handle back button click
  const handleBack = () => {
    navigate('/admin');
  };

  // Handle therapist change
  const handleTherapistChange = (value: string) => {
    setSelectedTherapist(value);
    setSelectedTab('calendar');
  };

  // Handle therapist submission form submission
  const handleAdminTherapistSubmission = (formData: any) => {
    markAvailabilityMutation.mutate({
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

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'EEEE, MMMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Manage Therapist Calendar</h1>
        <Button variant="outline" onClick={handleBack}>
          Back to Admin Dashboard
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Therapist</CardTitle>
          <CardDescription>
            Choose a therapist to view and manage their calendar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select
              value={selectedTherapist || ''}
              onValueChange={handleTherapistChange}
            >
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a therapist" />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTherapists ? (
                  <SelectItem value="loading" disabled>
                    Loading therapists...
                  </SelectItem>
                ) : (
                  therapists?.map((therapist: any) => (
                    <SelectItem key={therapist.id} value={therapist.id.toString()}>
                      {therapist.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="icon"
              onClick={() => refetchSlots()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedTherapist && (
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
          </TabsList>

          <TabsContent value="calendar" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Therapist Calendar</CardTitle>
                <CardDescription>
                  View and manage the therapist's calendar. Click on a time slot to mark availability or manage appointments.
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
                    therapistId={selectedTherapist}
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
                  View and manage the therapist's booked appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSlots ? (
                  <div className="flex items-center justify-center h-32">
                    <p>Loading appointments...</p>
                  </div>
                ) : slots?.filter((slot: any) => 
                    slot.status === 'booked' && 
                    slot.therapist_id === selectedTherapist
                  ).length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No booked appointments for this therapist
                  </p>
                ) : (
                  <div className="space-y-4">
                    {slots
                      ?.filter(
                        (slot: any) => 
                          slot.status === 'booked' && 
                          slot.therapist_id === selectedTherapist
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
                                <span>Student: {slot.student_name}</span>
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
        </Tabs>
      )}

      {!selectedTherapist && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-center text-muted-foreground">
              Please select a therapist to manage their calendar
            </p>
          </CardContent>
        </Card>
      )}

      {isModalOpen && selectedTherapist && (
        <SlotSubmissionModal 
          date={slotDate}
          startTime={slotTime}
          endTime={incrementTimeByOneHour(slotTime)}
          therapistId={selectedTherapist}
          adminMode={true}
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          onTherapistSubmission={handleAdminTherapistSubmission}
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