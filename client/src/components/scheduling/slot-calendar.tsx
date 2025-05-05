import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format, startOfWeek, addDays, parse, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ChevronLeft, 
  ChevronRight,
  CheckCircle,
  Clock,
  Calendar as CalendarIcon 
} from 'lucide-react';
import { SlotSubmissionModal } from './slot-submission-modal';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

// Calendar header styles
const headerStyle = "bg-primary/10 text-center p-2 text-sm font-medium";
// Calendar cell styles
const cellStyle = "border border-border p-0 h-16 hover:bg-accent/20 transition-colors";
// Time slot button styles - different for each type of slot
const emptySlotStyle = "flex flex-col items-center justify-center border border-dashed border-blue-100 rounded p-1 text-xs mb-1 w-full hover:bg-blue-50 transition-colors cursor-pointer";
const markedSlotStyle = "flex flex-col items-center justify-center bg-blue-50 text-blue-600 border border-blue-200 rounded p-1 text-xs mb-1 w-full hover:bg-blue-100 transition-colors cursor-pointer";
const bookedSlotStyle = "flex flex-col items-center justify-center bg-green-50 text-green-700 border border-green-100 rounded p-1 text-xs mb-1 w-full hover:bg-green-100 transition-colors cursor-pointer";
const completedSlotStyle = "flex flex-col items-center justify-center bg-purple-50 text-purple-700 border border-purple-100 rounded p-1 text-xs mb-1 w-full hover:bg-purple-100 transition-colors cursor-pointer";
const pendingSlotStyle = "flex flex-col items-center justify-center bg-amber-50 text-amber-700 border border-amber-100 rounded p-1 text-xs mb-1 w-full hover:bg-amber-100 transition-colors cursor-pointer";
const waitlistedSlotStyle = "flex flex-col items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-100 rounded p-1 text-xs mb-1 w-full hover:bg-indigo-100 transition-colors cursor-pointer";
const unavailableSlotStyle = "flex flex-col items-center justify-center bg-gray-50 text-gray-400 border border-gray-100 rounded p-1 text-xs mb-1 w-full cursor-not-allowed";

interface SlotCalendarProps {
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
  userId?: string;      // Admin can specify user ID
  userRole?: string;    // Admin can specify role
  therapistId?: string; // Admin can view a specific therapist's calendar
  studentId?: string;   // Admin can view a specific student's calendar
  adminMode?: boolean;  // Enable admin functions
  onSlotClick?: (date: string, time: string) => void; // Handler for when a slot is clicked
  allowAllInteractions?: boolean; // Enable all interactions regardless of slot status
}

interface TimeSlot {
  id?: string;
  time: string;
  status: 'available' | 'booked' | 'pending' | 'unavailable' | 'completed' | 'waitlisted';
  therapistId?: string;
  therapistName?: string;
  studentId?: string;
  studentName?: string;
  notes?: string;
}

export function SlotCalendar({ 
  selectedDate = new Date(), 
  onDateChange, 
  userId, 
  userRole, 
  therapistId, 
  studentId, 
  adminMode,
  onSlotClick,
  allowAllInteractions
}: SlotCalendarProps) {
  const { user } = useAuth();
  // Use specified values for admin mode, otherwise use logged-in user
  const effectiveUserId = adminMode ? userId : user?.id.toString();
  const effectiveUserRole = adminMode ? userRole : user?.role;
  
  const isTherapist = effectiveUserRole === 'therapist';
  const isStudent = effectiveUserRole === 'student';
  const isAdmin = adminMode || user?.role === 'admin';
  
  const [currentStartDate, setCurrentStartDate] = useState<Date>(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Start on Monday
    return start;
  });
  
  const [selectedSlot, setSelectedSlot] = useState<{
    id?: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  
  // Format date as YYYY-MM-DD
  const formatDateForApi = (date: Date) => format(date, 'yyyy-MM-dd');
  
  // Calculate the end date (currentStartDate + 6 days)
  const currentEndDate = addDays(currentStartDate, 6);
  
  // Query for slots with polling for real-time updates
  const { data: slots = [], isLoading } = useQuery({
    queryKey: [
      '/api/slots', 
      formatDateForApi(currentStartDate), 
      formatDateForApi(currentEndDate),
      therapistId, 
      studentId, 
      adminMode
    ],
    queryFn: async () => {
      console.log(`Fetching slots from ${formatDateForApi(currentStartDate)} to ${formatDateForApi(currentEndDate)}`);
      
      // Build query parameters
      let queryParams = `start_date=${formatDateForApi(currentStartDate)}&end_date=${formatDateForApi(currentEndDate)}`;
      
      // Add admin-specific parameters if in admin mode
      if (adminMode) {
        if (therapistId) {
          queryParams += `&therapist_id=${therapistId}`;
        }
        if (studentId) {
          queryParams += `&student_id=${studentId}`;
        }
      }
      
      // Server will automatically filter based on user role or admin params
      const res = await apiRequest(
        'GET', 
        `/api/slots?${queryParams}`
      );
      
      if (!res.ok) {
        console.error('Error fetching slots:', res.status, res.statusText);
        return [];
      }
      
      const data = await res.json();
      console.log(`Received ${data.length} slots:`, data);
      return data;
    },
    placeholderData: [],
    // Enable polling to get real-time updates every 10 seconds
    refetchInterval: 30000,
    // Only poll when the component is visible
    refetchIntervalInBackground: false,
    // Refetch when window regains focus
    refetchOnWindowFocus: true
  });
  
  // Generate days of the week
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      // Only show Monday to Friday (0 = Monday through 4 = Friday)
      if (i < 5) {
        const day = addDays(currentStartDate, i);
        days.push(day);
      }
    }
    return days;
  }, [currentStartDate]);
  
  // Check if a date is in the past (before today)
  const isDateInPast = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() < today.getTime();
  };
  
  // Check if a time slot is in the past (already passed today)
  const isTimeSlotInPast = (date: Date, timeStr: string): boolean => {
    if (!isSameDay(date, new Date())) return false;
    
    const now = new Date();
    const [hour, minute] = timeStr.split(':').map(Number);
    
    // Create a date object for the time slot
    const timeSlotDate = new Date(date);
    timeSlotDate.setHours(hour, minute, 0, 0);
    
    return now > timeSlotDate;
  };
  
  // Generate time slots from 9 AM to 5 PM
  const timeSlots = useMemo(() => {
    return [
      '09:00', '10:00', '11:00', '12:00', 
      '13:00', '14:00', '15:00', '16:00', '17:00'
    ];
  }, []);
  
  // Get slots for a specific day and time
  const getSlotsForDateTime = (day: Date, time: string): TimeSlot[] => {
    const dateStr = formatDateForApi(day);
    const isPast = isDateInPast(day) || isTimeSlotInPast(day, time);
    
    // Add debug information
    console.log(`Looking for slots on ${dateStr} at ${time} from ${slots.length} slots`);
    
    // For students:
    // 1. Students should only see their own assigned/booked slots (already filtered by backend)
    // 2. If they have a completed appointment, show it as 'completed'
    // 3. For empty cells, show slots as available for indicating preference
    if (isStudent) {
      // Find any slots where this student is assigned (server already filters to only return this student's slots)
      const studentSlot = slots.find((slot: any) => 
        slot.date === dateStr && 
        slot.start_time === time
      );
      
      if (studentSlot) {
        // Determine status based on slot data and whether it's in the past
        let status: 'waitlisted' | 'completed' | 'booked' = 
          (studentSlot.status === 'waitlisted' || studentSlot.isWaitlisted) ? 
            'waitlisted' : 
            (isPast || studentSlot.status === 'completed' ? 'completed' : 'booked');
        
        return [{
          id: studentSlot._id,
          time,
          status,
          therapistId: studentSlot.therapist_id,
          therapistName: studentSlot.therapist_name,
          studentId: studentSlot.student_id,
          studentName: studentSlot.student_name,
          notes: studentSlot.notes
        }];
      }
      
      // No appointment for this student in this slot, show as available for preference selection
      return [{ 
        time, 
        status: isPast ? 'unavailable' : 'available' 
      }];
    }
    
    // For therapists and admins, show actual slots
    const matchingSlots = slots.filter((slot: any) => {
      // Add debug logging for each slot's date and time
      if (slot.date === dateStr) {
        console.log(`Found slot with matching date ${dateStr}:`, slot);
      }
      return slot.date === dateStr && slot.start_time === time;
    });
    
    if (matchingSlots.length > 0) {
      console.log(`Found ${matchingSlots.length} slots matching ${dateStr} at ${time}:`, matchingSlots);
    }
    
    if (matchingSlots.length === 0) {
      // If no slot exists, make it available for therapists to mark if not in the past
      console.log(`No slots found for ${dateStr} at ${time}, creating default ${isPast ? 'unavailable' : 'available'} slot`);
      return [{ 
        time, 
        status: isPast ? 'unavailable' : 'available' 
      }];
    }
    
    return matchingSlots.map((slot: any) => {
      // Determine status based on slot data
      let status: 'available' | 'booked' | 'pending' | 'unavailable' | 'completed' | 'waitlisted' = 'available';
      
      // Check for waitlisted status explicitly
      if (slot.status === 'waitlisted' || slot.isWaitlisted === true) {
        status = 'waitlisted';
      }
      // If the slot has a status "completed", keep it
      else if (slot.status === 'completed') {
        status = 'completed';
      } else if (isPast && slot.therapist_id && slot.student_id) {
        // If the slot is in the past and was booked, mark it as completed
        status = 'completed';
      } else if (isPast) {
        // Any other type of slot in the past is unavailable
        status = 'unavailable';
      } else if (slot.therapist_id && !slot.student_id) {
        // Therapist marked available but no student assigned
        status = 'pending';
      } else if (slot.therapist_id && slot.student_id) {
        // Both therapist and student assigned - booked
        status = 'booked';
      } else if (slot.status) {
        // Use status from database if available
        status = slot.status;
      }
      
      return {
        id: slot._id, // MongoDB uses _id
        time,
        status,
        therapistId: slot.therapist_id,
        therapistName: slot.therapist_name,
        studentId: slot.student_id,
        studentName: slot.student_name,
        notes: slot.notes
      };
    });
  };
  
  // Navigate to the previous week
  const goToPreviousWeek = () => {
    const newStartDate = addDays(currentStartDate, -7);
    setCurrentStartDate(newStartDate);
    if (onDateChange) {
      onDateChange(newStartDate);
    }
  };
  
  // Navigate to the next week
  const goToNextWeek = () => {
    const newStartDate = addDays(currentStartDate, 7);
    setCurrentStartDate(newStartDate);
    if (onDateChange) {
      onDateChange(newStartDate);
    }
  };
  
  // Handle slot click to open modal
  const handleSlotClick = (day: Date, timeSlot: string, slot: TimeSlot) => {
    // Calculate end time (1 hour later)
    const startHour = parseInt(timeSlot.split(':')[0]);
    const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;
    
    console.log('Slot clicked:', { 
      day: format(day, 'yyyy-MM-dd'), 
      timeSlot, 
      slotId: slot.id, 
      slotStatus: slot.status,
      slot: JSON.stringify(slot)
    });
    
    const dateStr = formatDateForApi(day);
    
    // If using external slot click handler (like in admin mode)
    if (onSlotClick) {
      onSlotClick(dateStr, timeSlot);
      return;
    }
    
    // Default behavior - open the built-in modal
    setSelectedSlot({
      id: slot.id,
      date: dateStr,
      startTime: timeSlot,
      endTime,
    });
  };
  
  // Handle modal close
  const handleModalClose = () => {
    setSelectedSlot(null);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Schedule Calendar</h2>
        <div className="flex space-x-4 items-center">
          <Button variant="outline" onClick={goToPreviousWeek} size="sm">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous Week
          </Button>
          <h3 className="text-sm font-medium">
            {format(currentStartDate, 'MMMM d')} - {format(addDays(currentStartDate, 4), 'MMMM d, yyyy')}
          </h3>
          <Button variant="outline" onClick={goToNextWeek} size="sm">
            Next Week
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
      
      <Card>
        <CardContent className="p-0">
          <div className="w-full overflow-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={headerStyle} style={{ width: '80px' }}>Time</th>
                  {weekDays.map((day) => (
                    <th key={day.toISOString()} className={headerStyle}>
                      <div className="text-center">
                        <div>{format(day, 'EEEE')}</div>
                        <div>{format(day, 'MMM d')}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  // Show skeleton loading state
                  Array.from({ length: timeSlots.length }).map((_, index) => (
                    <tr key={`loading-${index}`}>
                      <td className="border p-1">
                        <Skeleton className="h-6 w-16" />
                      </td>
                      {weekDays.map((day, dayIndex) => (
                        <td key={`loading-${index}-${dayIndex}`} className="border p-1">
                          <Skeleton className="h-12 w-full" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  // Show time slots
                  timeSlots.map((time) => (
                    <tr key={time}>
                      <td className="border text-center p-1 text-sm font-medium bg-muted/20">
                        <div className="flex items-center justify-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {/* Convert 24h to 12h format */}
                          {parseInt(time) > 12 
                            ? `${parseInt(time) - 12}:00 PM` 
                            : (parseInt(time) === 12 ? '12:00 PM' : `${parseInt(time)}:00 AM`)}
                        </div>
                      </td>
                      
                      {weekDays.map((day) => {
                        const slotsForDateTime = getSlotsForDateTime(day, time);
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                          <td key={`${day.toISOString()}-${time}`} className={`${cellStyle} ${isToday ? 'bg-blue-50' : ''}`}>
                            <div className="p-1">
                              {slotsForDateTime.map((slot, index) => {
                                // Show different UI based on slot status
                                switch (slot.status) {
                                  case 'available':
                                    // Empty, clickable slot
                                    return (
                                      <div 
                                        key={index}
                                        className="flex flex-col items-center justify-center border border-dashed border-blue-100 rounded p-1 text-xs mb-1 w-full hover:bg-blue-50 transition-colors cursor-pointer"
                                        onClick={() => handleSlotClick(day, time, slot)}
                                      >
                                        {/* Empty slot - no text */}
                                      </div>
                                    );
                                    
                                  case 'pending':
                                    // Marked slot - Therapist set availability but no student assigned
                                    return (
                                      <div 
                                        key={index} 
                                        className="flex flex-col items-center justify-center bg-blue-50 text-blue-600 border border-blue-200 rounded p-1 text-xs mb-1 w-full hover:bg-blue-100 transition-colors cursor-pointer"
                                        onClick={() => handleSlotClick(day, time, slot)}
                                      >
                                        <div>Marked</div>
                                        {/* Only show therapist name to therapists/admin */}
                                        {(isTherapist || isAdmin) && slot.therapistName && (
                                          <div className="text-xs opacity-75">{slot.therapistName}</div>
                                        )}
                                      </div>
                                    );
                                    
                                  case 'booked':
                                    // Assigned slot - Both therapist and student assigned
                                    return (
                                      <div 
                                        key={index} 
                                        className="flex flex-col items-center justify-center bg-green-50 text-green-700 border border-green-100 rounded p-1 text-xs mb-1 w-full hover:bg-green-100 transition-colors cursor-pointer"
                                        onClick={() => handleSlotClick(day, time, slot)}
                                      >
                                        <div>Assigned</div>
                                        {/* Show appropriate info based on user role */}
                                        {isTherapist && slot.studentName && (
                                          <div className="text-xs opacity-75">{slot.studentName}</div>
                                        )}
                                        {isStudent && slot.therapistName && (
                                          <div className="text-xs opacity-75">{slot.therapistName}</div>
                                        )}
                                        {isAdmin && (
                                          <>
                                            {slot.therapistName && <div className="text-xs opacity-75">{slot.therapistName}</div>}
                                            {slot.studentName && <div className="text-xs opacity-75">{slot.studentName}</div>}
                                          </>
                                        )}
                                      </div>
                                    );
                                    
                                  case 'completed':
                                    // Completed slot - Past appointment that was completed
                                    return (
                                      <div 
                                        key={index} 
                                        className="flex flex-col items-center justify-center bg-purple-50 text-purple-700 border border-purple-100 rounded p-1 text-xs mb-1 w-full hover:bg-purple-100 transition-colors cursor-pointer"
                                        onClick={() => handleSlotClick(day, time, slot)}
                                      >
                                        <div>Completed</div>
                                        {/* Show appropriate info based on user role */}
                                        {isTherapist && slot.studentName && (
                                          <div className="text-xs opacity-75">{slot.studentName}</div>
                                        )}
                                        {isStudent && slot.therapistName && (
                                          <div className="text-xs opacity-75">{slot.therapistName}</div>
                                        )}
                                        {isAdmin && (
                                          <>
                                            {slot.therapistName && <div className="text-xs opacity-75">{slot.therapistName}</div>}
                                            {slot.studentName && <div className="text-xs opacity-75">{slot.studentName}</div>}
                                          </>
                                        )}
                                      </div>
                                    );
                                    
                                  case 'waitlisted':
                                    // Waitlisted slot - Student is waiting for therapist to mark this time
                                    return (
                                      <div 
                                        key={index} 
                                        className="flex flex-col items-center justify-center bg-indigo-50 text-indigo-700 border border-indigo-100 rounded p-1 text-xs mb-1 w-full hover:bg-indigo-100 transition-colors cursor-pointer"
                                        onClick={() => handleSlotClick(day, time, slot)}
                                      >
                                        <div>Waitlisted</div>
                                        {isStudent && slot.therapistName && (
                                          <div className="text-xs opacity-75">{slot.therapistName}</div>
                                        )}
                                        {slot.notes && (
                                          <div className="text-xs opacity-75 truncate max-w-full" title={slot.notes}>
                                            {slot.notes.length > 20 ? slot.notes.substring(0, 20) + '...' : slot.notes}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  
                                  case 'unavailable':
                                  default:
                                    // Unavailable slot
                                    return (
                                      <div key={index} className="flex flex-col items-center justify-center bg-gray-50 text-gray-400 border border-gray-100 rounded p-1 text-xs mb-1 w-full cursor-not-allowed">
                                        {/* Empty unavailable slot */}
                                      </div>
                                    );
                                }
                              })}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Slot Selection Modal */}
      {selectedSlot && (
        <SlotSubmissionModal
          isOpen={!!selectedSlot}
          onClose={handleModalClose}
          slotData={selectedSlot}
          userId={effectiveUserId}
          userRole={effectiveUserRole}
          therapistId={therapistId}
          studentId={studentId}
          adminMode={adminMode}
        />
      )}
    </div>
  );
}