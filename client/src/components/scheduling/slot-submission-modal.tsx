import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TherapistSubmissionForm } from './therapist-submission-form';
import { StudentRequestForm } from './student-request-form';
import { AlternativeSlotForm } from './alternative-slot-form';
import { FeedbackForm } from '@/components/feedback/feedback-form';
// Removed WaitlistDisplay import - using inline component instead
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Calendar, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import AdminAssignUsersForm from '@/components/scheduling/admin-assign-users-form';

interface SlotSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  // For direct property access (admin mode)
  date?: string;
  startTime?: string;
  endTime?: string;
  // Slot data for normal mode
  slotData?: {
    id?: string;
    date: string;
    startTime: string;
    endTime: string;
  };
  // User context overrides for admin
  userId?: string;      // Admin can specify user ID
  userRole?: string;    // Admin can specify role
  therapistId?: string; // Admin can view a specific therapist's calendar
  studentId?: string;   // Admin can view a specific student's calendar
  adminMode?: boolean;  // Enable admin functions
  // Callback handlers
  onTherapistSubmission?: (formData: any) => void;
  onStudentRequest?: (formData: any) => void;
}

export function SlotSubmissionModal({ 
  isOpen, 
  onClose, 
  slotData, 
  date,
  startTime,
  endTime,
  userId, 
  userRole,
  therapistId,
  studentId,
  adminMode,
  onTherapistSubmission,
  onStudentRequest
}: SlotSubmissionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Use specified values for admin mode, otherwise use logged-in user
  const effectiveUserId = adminMode ? userId : user?.id.toString();
  const effectiveUserRole = adminMode ? userRole : user?.role;
  
  const isTherapist = effectiveUserRole === 'therapist';
  const isStudent = effectiveUserRole === 'student';
  const isAdmin = adminMode || user?.role === 'admin';
  
  // State to track if this is a new or existing slot
  const [slotStatus, setSlotStatus] = useState<'empty' | 'marked' | 'assigned' | 'completed' | 'alternative' | 'waitlisted'>('empty');
  const [slotDetails, setSlotDetails] = useState<any>(null);
  
  // Create consolidated slot data for component usage, prioritizing direct props
  const effectiveSlotData = React.useMemo(() => {
    // If all direct props are provided, use them (admin mode case)
    if (date && startTime && endTime) {
      return {
        date,
        startTime,
        endTime,
        // No ID for direct props usually means it's a new slot
      };
    }
    // Otherwise use the slotData object (normal mode case)
    return slotData || { date: '', startTime: '', endTime: '' };
  }, [date, startTime, endTime, slotData]);
  
  // Fetch slot details if we have an ID, with polling for real-time updates
  const { data: slotInfo, isLoading: isLoadingSlot } = useQuery({
    queryKey: ['/api/slots', effectiveSlotData.id],
    queryFn: async () => {
      if (!effectiveSlotData.id) return null;
      console.log('Fetching slot details for ID:', effectiveSlotData.id);
      try {
        const res = await apiRequest('GET', `/api/slots/${effectiveSlotData.id}`);
        if (!res.ok) {
          console.error('Error fetching slot:', res.status, res.statusText);
          return null;
        }
        const data = await res.json();
        console.log('Slot details received:', data);
        return data;
      } catch (error) {
        console.error('Error in slot fetch:', error);
        return null;
      }
    },
    enabled: !!effectiveSlotData.id,
    // Enable polling to get real-time updates every 20 seconds (reduced from 5 to improve performance)
    refetchInterval: 20000,
    // Only poll when the component is visible
    refetchIntervalInBackground: false,
    // Refetch when window regains focus
    refetchOnWindowFocus: true
  });
  
  // Cancel slot mutation
  const cancelSlotMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!effectiveSlotData.id) throw new Error('Slot ID is missing');
      
      console.log('Canceling slot with ID:', effectiveSlotData.id, 'reason:', data.reason);
      
      const response = await apiRequest(
        'POST',
        `/api/slots/${effectiveSlotData.id}/cancel`,
        { reason: data.reason }
      );
      
      if (!response.ok) {
        console.error('Error response from cancel API:', response.status, response.statusText);
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel slot');
      }
      
      const result = await response.json();
      console.log('Cancel slot response:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      toast({
        title: 'Slot cancelled',
        description: 'The slot has been successfully cancelled.',
      });
      onClose();
    },
    onError: (error: Error) => {
      console.error('Cancel slot error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Mark slot as completed mutation
  const markCompletedMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveSlotData.id) throw new Error('Slot ID is missing');
      
      const response = await apiRequest(
        'POST',
        `/api/slots/${effectiveSlotData.id}/complete`,
        {}
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark slot as completed');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      toast({
        title: 'Appointment completed',
        description: 'The appointment has been marked as completed.',
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Determine slot status when slot info changes
  useEffect(() => {
    if (slotInfo) {
      setSlotDetails(slotInfo);
      
      // Check if this is a past slot
      const isPast = () => {
        const slotDate = new Date(effectiveSlotData.date);
        const slotTime = effectiveSlotData.startTime;
        const today = new Date();
        
        // If date is in the past, slot is completed
        if (slotDate < today && slotDate.toDateString() !== today.toDateString()) {
          return true;
        }
        
        // If it's today, check if the time has passed
        if (slotDate.toDateString() === today.toDateString()) {
          const [hours, minutes] = slotTime.split(':').map(Number);
          const slotDateTime = new Date(slotDate);
          slotDateTime.setHours(hours, minutes, 0, 0);
          return slotDateTime < today;
        }
        
        return false;
      };
      
      // Check if this slot is already booked by someone else
      const isBookedByOther = () => {
        return isStudent && 
               slotInfo.status === 'booked' && 
               slotInfo.student_id && 
               slotInfo.student_id !== user?.id.toString();
      };
      
      // If slot has explicit completed status
      if (slotInfo.status === 'completed') {
        setSlotStatus('completed');
      }
      // If slot is in the past and was booked, mark as completed
      else if (isPast() && slotInfo.therapist_id && slotInfo.student_id) {
        setSlotStatus('completed');
      }
      // If slot is waitlisted (virtual slot from student request)
      else if (slotInfo.isWaitlisted || slotInfo.status === 'waitlisted') {
        setSlotStatus('waitlisted');
      }
      // If student is trying to access a slot that's already booked by someone else
      else if (isBookedByOther()) {
        setSlotStatus('alternative');
      }
      // Otherwise follow normal status flow
      else if (slotInfo.therapist_id && slotInfo.student_id) {
        setSlotStatus('assigned');
      } else if (slotInfo.therapist_id) {
        setSlotStatus('marked');
      }
    } else {
      setSlotStatus('empty');
    }
  }, [slotInfo, effectiveSlotData, user?.id, isStudent]);
  
  // State for therapist cancellation options (reassign or remove)
  const [showTherapistCancelOptions, setShowTherapistCancelOptions] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelAction, setCancelAction] = useState<'reassign' | 'remove' | null>(null);
  
  const handleCancelSlot = () => {
    if (!effectiveSlotData.id) return;
    
    // For therapists with students assigned, show reassignment options first
    if (isTherapist && slotStatus === 'assigned' && !showTherapistCancelOptions) {
      setShowTherapistCancelOptions(true);
      return;
    }
    
    // Generate reason based on role and action
    let reason = '';
    
    if (isStudent) {
      reason = 'Cancelled by student';
    } else if (isTherapist) {
      reason = cancellationReason || 'Cancelled by therapist';
      
      // Add the chosen action to the reason
      if (cancelAction === 'reassign') {
        reason += ' - Requested automatic reassignment from waitlist';
      } else if (cancelAction === 'remove') {
        reason += ' - Requested complete removal';
      }
    } else {
      reason = 'Cancelled by admin';
    }
    
    // Include reassignment preference in the mutation data
    cancelSlotMutation.mutate({ 
      reason, 
      reassign: cancelAction === 'reassign'
    });
  };
  
  const handleSuccess = () => {
    // Close the modal after successful submission
    onClose();
  };
  
  const renderEmptySlotContent = () => {
    if (isTherapist) {
      return (
        <TherapistSubmissionForm
          date={effectiveSlotData.date}
          startTime={effectiveSlotData.startTime}
          endTime={effectiveSlotData.endTime}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      );
    }
    
    if (isStudent) {
      return (
        <>
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <Calendar className="h-4 w-4 text-blue-600 mr-2" />
            <AlertDescription className="text-blue-700">
              You're indicating your availability for counseling sessions. The system will match you with an available therapist.
            </AlertDescription>
          </Alert>
          <StudentRequestForm
            date={effectiveSlotData.date}
            startTime={effectiveSlotData.startTime}
            endTime={effectiveSlotData.endTime}
            onSuccess={handleSuccess}
            onCancel={onClose}
            isWaitlisted={false}
          />
        </>
      );
    }
    
    if (isAdmin) {
      // Determine which form to show based on therapistId or studentId prop
      // If viewing a therapist's calendar, show the therapist form
      if (therapistId) {
        return (
          <>
            <Alert className="mb-4 bg-indigo-50 border-indigo-200">
              <Calendar className="h-4 w-4 text-indigo-600 mr-2" />
              <AlertDescription className="text-indigo-700">
                You're managing this therapist's availability. Any changes will be reflected in their calendar.
              </AlertDescription>
            </Alert>
            <TherapistSubmissionForm
              date={effectiveSlotData.date}
              startTime={effectiveSlotData.startTime}
              endTime={effectiveSlotData.endTime}
              onSuccess={handleSuccess}
              onCancel={onClose}
              therapistId={therapistId}
              adminMode={true}
            />
          </>
        );
      }
      
      // If viewing a student's calendar, show the student form
      if (studentId) {
        return (
          <>
            <Alert className="mb-4 bg-green-50 border-green-200">
              <Calendar className="h-4 w-4 text-green-600 mr-2" />
              <AlertDescription className="text-green-700">
                You're managing this student's appointments. Any changes will be reflected in their calendar.
              </AlertDescription>
            </Alert>
            <StudentRequestForm
              date={effectiveSlotData.date}
              startTime={effectiveSlotData.startTime}
              endTime={effectiveSlotData.endTime}
              onSuccess={handleSuccess}
              onCancel={onClose}
              studentId={studentId}
              adminMode={true}
              isWaitlisted={false}
            />
          </>
        );
      }
      
      // If not specific to therapist or student, show admin options
      return (
        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">Manage Slot</TabsTrigger>
            <TabsTrigger value="assign">Assign Users</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manage">
            <div className="space-y-4 py-4">
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                <AlertDescription className="text-blue-700">
                  You can mark this slot as available or unavailable for all therapists or specific therapists.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{format(new Date(slotData.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{slotData.startTime} - {slotData.endTime}</span>
                </div>
              </div>
              
              <div className="pt-4 flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1"
                  onClick={handleSuccess}
                >
                  Mark Available
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="assign">
            <div className="space-y-4 py-4">
              <Alert className="mb-4 bg-amber-50 border-amber-200">
                <Calendar className="h-4 w-4 text-amber-600 mr-2" />
                <AlertDescription className="text-amber-700">
                  You can directly assign a therapist and student to this slot.
                </AlertDescription>
              </Alert>
              
              <div className="grid gap-4">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{format(new Date(slotData.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">{slotData.startTime} - {slotData.endTime}</span>
                </div>
                
                {/* Implement drop-downs for therapist and student selection */}
                <div className="space-y-4 pt-2">
                  <AdminAssignUsersForm 
                    date={effectiveSlotData.date}
                    startTime={effectiveSlotData.startTime}
                    endTime={effectiveSlotData.endTime}
                    slotId={slotDetails?._id?.toString() || effectiveSlotData.id}
                    therapistId={slotDetails?.therapist_id}
                    onClose={onClose}
                  />
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      );
    }
    
    return <div>No actions available for your role.</div>;
  };
  
  const renderMarkedSlotContent = () => {
    return (
      <div className="space-y-4 py-4">
        <Alert className="bg-blue-50 border-blue-200">
          <CheckCircle className="h-4 w-4 text-blue-500 mr-2" />
          <AlertDescription className="text-blue-700">
            {isTherapist && "You've marked this slot as available. It's waiting for student assignment."}
            {isStudent && "This slot has been marked by a therapist. Submit your availability to be considered for this time slot."}
            {isAdmin && "This slot has been marked as available by a therapist and is waiting for assignment."}
            {!isTherapist && !isStudent && !isAdmin && "This slot has been marked as available by a therapist and is waiting for assignment."}
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{format(new Date(slotData.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{slotData.startTime} - {slotData.endTime}</span>
          </div>
        </div>
        
        {slotDetails?.therapist_name && (
          <div className="pt-2">
            <h4 className="text-sm font-medium">Therapist</h4>
            <p className="text-sm text-muted-foreground">{slotDetails.therapist_name}</p>
          </div>
        )}
        
        {isTherapist && (
          <div className="pt-4">
            <Button 
              variant="destructive" 
              onClick={handleCancelSlot}
              disabled={cancelSlotMutation.isPending}
              className="w-full"
            >
              Cancel this availability
            </Button>
          </div>
        )}
        
        {isStudent && (
          <div className="pt-4">
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Calendar className="h-4 w-4 text-blue-600 mr-2" />
              <AlertDescription className="text-blue-700">
                You're indicating your availability for counseling sessions. The system will match you with an available therapist.
              </AlertDescription>
            </Alert>
            <StudentRequestForm
              date={slotData.date}
              startTime={slotData.startTime}
              endTime={slotData.endTime}
              onSuccess={handleSuccess}
              onCancel={onClose}
              therapistId={slotDetails?.therapist_id}
              isWaitlisted={slotStatus === 'waitlisted'}
            />
          </div>
        )}
        
        {isAdmin && (
          <div className="pt-4">
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <Calendar className="h-4 w-4 text-amber-600 mr-2" />
              <AlertDescription className="text-amber-700">
                As an administrator, you can assign a student to this therapist's marked availability.
              </AlertDescription>
            </Alert>
            <AdminAssignUsersForm
              date={slotData.date}
              startTime={slotData.startTime}
              endTime={slotData.endTime}
              slotId={slotDetails?._id?.toString()}
              therapistId={slotDetails?.therapist_id}
              onClose={onClose}
            />
          </div>
        )}
      </div>
    );
  };
  
  // State for showing feedback form after joining meeting
  const [showJoinMeetingFeedback, setShowJoinMeetingFeedback] = useState(false);
  
  const renderAssignedSlotContent = () => {
    if (!effectiveSlotData) return <div>Error: No slot data available</div>;
    
    // If the therapist is cancelling and we're showing options
    if (isTherapist && showTherapistCancelOptions) {
      return (
        <div className="space-y-4 py-4">
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-500 mr-2" />
            <AlertDescription className="text-amber-700">
              Please select what you'd like to do with this appointment:
            </AlertDescription>
          </Alert>
          
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Cancellation Options</h3>
            
            <div className="flex flex-col gap-4">
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="reassign" 
                  name="cancelOption"
                  checked={cancelAction === 'reassign'}
                  onChange={() => setCancelAction('reassign')}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="reassign" className="text-sm font-medium text-gray-900 ml-2">
                  Reassign to waitlisted student
                  <p className="text-xs text-gray-500">
                    The first student on the waitlist for this time slot will automatically be assigned to replace the current student.
                    This maintains your availability and helps students who were waiting.
                  </p>
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="radio" 
                  id="remove" 
                  name="cancelOption"
                  checked={cancelAction === 'remove'}
                  onChange={() => setCancelAction('remove')}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary-500"
                />
                <label htmlFor="remove" className="text-sm font-medium text-gray-900 ml-2">
                  Remove this slot completely
                  <p className="text-xs text-gray-500">
                    The appointment will be cancelled and the slot will be completely removed from your calendar.
                    All waitlisted students will be notified that this slot is no longer available.
                  </p>
                </label>
              </div>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium">Optional Reason</h3>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 text-sm"
                placeholder="Enter an optional reason for cancellation"
                rows={2}
              />
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTherapistCancelOptions(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancelSlot}
                disabled={!cancelAction || cancelSlotMutation.isPending}
                className="flex-1"
              >
                {cancelSlotMutation.isPending ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span> Cancelling...
                  </>
                ) : (
                  "Confirm Cancellation"
                )}
              </Button>
            </div>
          </div>
        </div>
      );
    }
    
    // Check if the appointment is in the past to show "Mark as Completed" button
    const isPastAppointment = () => {
      const slotDate = new Date(effectiveSlotData.date);
      const slotTime = effectiveSlotData.startTime;
      const today = new Date();
      
      // If date is in the past, it's a past appointment
      if (slotDate < today && slotDate.toDateString() !== today.toDateString()) {
        return true;
      }
      
      // If it's today, check if the time has passed
      if (slotDate.toDateString() === today.toDateString()) {
        const [hours, minutes] = slotTime.split(':').map(Number);
        const slotDateTime = new Date(slotDate);
        slotDateTime.setHours(hours, minutes, 0, 0);
        return slotDateTime < today;
      }
      
      return false;
    };
    
    const showMarkAsCompletedButton = isPastAppointment();
    
    // If the student has clicked "Join Meeting" button, show the feedback form
    if (isStudent && showJoinMeetingFeedback) {
      return (
        <FeedbackForm 
          appointmentId={effectiveSlotData?.id?.toString() || slotDetails?._id?.toString() || ""}
          therapistId={slotDetails?.therapist_id || ""}
          onSubmitSuccess={onClose}
          onCancel={() => setShowJoinMeetingFeedback(false)}
        />
      );
    }
    
    return (
      <div className="space-y-4 py-4">
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
          <AlertDescription className="text-green-700">
            {isTherapist && "Your availability has been matched with a student."}
            {isStudent && "You've been matched with a therapist for this time slot."}
            {isAdmin && "This slot has been successfully matched between therapist and student."}
            {!isTherapist && !isStudent && !isAdmin && "This slot has been assigned."}
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{format(new Date(effectiveSlotData.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{effectiveSlotData.startTime} - {effectiveSlotData.endTime}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <h4 className="text-sm font-medium">Therapist</h4>
            <p className="text-sm text-muted-foreground">{slotDetails?.therapist_name || 'Not assigned'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Student</h4>
            <p className="text-sm text-muted-foreground">{slotDetails?.student_name || 'Not assigned'}</p>
          </div>
        </div>
        
        {slotDetails?.notes && (
          <div className="pt-2">
            <h4 className="text-sm font-medium">Notes</h4>
            <p className="text-sm text-muted-foreground">{slotDetails.notes}</p>
          </div>
        )}
        
        <div className="pt-4 flex flex-col gap-2">
          {/* Join Meeting button for students */}
          {isStudent && !showMarkAsCompletedButton && (
            <Button 
              onClick={() => setShowJoinMeetingFeedback(true)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Join Meeting & Rate Your Experience
            </Button>
          )}
          
          {/* Show "Mark as Completed" button for past appointments */}
          {showMarkAsCompletedButton && (isTherapist || isAdmin) && (
            <Button 
              variant="outline" 
              onClick={() => markCompletedMutation.mutate()}
              disabled={markCompletedMutation.isPending}
              className="w-full"
            >
              {markCompletedMutation.isPending && (
                <Clock className="mr-2 h-4 w-4 animate-spin" />
              )}
              Mark as Completed
            </Button>
          )}
          
          {/* Show Cancel button for therapists */}
          {!showMarkAsCompletedButton && isTherapist && (
            <Button 
              variant="destructive" 
              onClick={handleCancelSlot}
              disabled={cancelSlotMutation.isPending}
              className="w-full"
            >
              Cancel this appointment
            </Button>
          )}
          
          {/* Show Cancel button for students to cancel their assigned appointments */}
          {!showMarkAsCompletedButton && isStudent && (
            <Button 
              variant="destructive" 
              onClick={handleCancelSlot}
              disabled={cancelSlotMutation.isPending}
              className="w-full"
            >
              {cancelSlotMutation.isPending ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel my appointment'
              )}
            </Button>
          )}
        </div>
      </div>
    );
  };
  
  // Check if feedback exists for an appointment
  const { data: existingFeedback, isLoading: isLoadingFeedback } = useQuery({
    queryKey: ['/api/feedback/appointment', effectiveSlotData?.id],
    queryFn: async () => {
      if (!effectiveSlotData?.id) return null;
      try {
        const res = await apiRequest('GET', `/api/feedback/appointment/${effectiveSlotData.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            return null; // No feedback found is not an error
          }
          console.error('Error fetching feedback:', res.status, res.statusText);
          return null;
        }
        return await res.json();
      } catch (error) {
        console.error('Error in feedback fetch:', error);
        return null;
      }
    },
    enabled: !!effectiveSlotData?.id && slotStatus === 'completed' && isStudent,
  });

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Render completed slot content
  const renderCompletedSlotContent = () => {
    // Make sure effectiveSlotData exists
    if (!effectiveSlotData) return <div>Error: No slot data available</div>;
    
    return (
      <div className="space-y-4 py-4">
        <Alert className="bg-purple-50 border-purple-200">
          <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
          <AlertDescription className="text-purple-700">
            {isTherapist && "Your session with this student has been completed."}
            {isStudent && "Your session with the therapist has been completed."}
            {isAdmin && "This counseling session has been completed."}
            {!isTherapist && !isStudent && !isAdmin && "This appointment has been completed."}
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{format(new Date(effectiveSlotData.date), 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{effectiveSlotData.startTime} - {effectiveSlotData.endTime}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <h4 className="text-sm font-medium">Therapist</h4>
            <p className="text-sm text-muted-foreground">{slotDetails?.therapist_name || 'Not assigned'}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium">Student</h4>
            <p className="text-sm text-muted-foreground">{slotDetails?.student_name || 'Not assigned'}</p>
          </div>
        </div>
        
        {slotDetails?.notes && (
          <div className="pt-2">
            <h4 className="text-sm font-medium">Notes</h4>
            <p className="text-sm text-muted-foreground">{slotDetails.notes}</p>
          </div>
        )}

        {/* Student feedback section */}
        {isStudent && (
          <div className="pt-4 border-t mt-4">
            {isLoadingFeedback ? (
              <div className="text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading feedback...</p>
              </div>
            ) : existingFeedback ? (
              <div className="bg-green-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-green-800">Thank you for your feedback!</h4>
                <p className="text-sm text-green-700">You've already rated this session {existingFeedback.rating} out of 5 stars.</p>
              </div>
            ) : showFeedbackForm ? (
              <FeedbackForm 
                appointmentId={effectiveSlotData?.id?.toString() || slotDetails?._id?.toString() || ""}
                therapistId={slotDetails?.therapist_id || ""}
                onSubmitSuccess={onClose}
                onCancel={() => setShowFeedbackForm(false)}
              />
            ) : (
              <div className="text-center">
                <Button 
                  onClick={() => setShowFeedbackForm(true)}
                  className="w-full"
                >
                  Join Meeting & Rate Your Experience
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Render alternative slot content with options for students
  const renderAlternativeSlotContent = () => {
    if (!effectiveSlotData) return <div>Error: No slot data available</div>;
    
    return (
      <AlternativeSlotForm 
        date={effectiveSlotData.date}
        startTime={effectiveSlotData.startTime}
        endTime={effectiveSlotData.endTime}
        therapistId={slotDetails?.therapist_id}
        therapistName={slotDetails?.therapist_name}
        onSuccess={handleSuccess}
        onCancel={onClose}
      />
    );
  };
  
  // Waitlist cancellation mutation - defined at the component level to follow React hooks rules
  const cancelWaitlistMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveSlotData?.id) throw new Error('Slot ID is missing');
      
      // Try to cancel the slot waitlist request
      const response = await apiRequest(
        'DELETE', 
        `/api/student-requests/${effectiveSlotData.id}`, 
        {}
      );
      
      if (!response.ok) {
        // If the direct deletion fails, try the waitlist endpoint as fallback
        const fallbackResponse = await apiRequest('DELETE', `/api/slots/waitlist/${effectiveSlotData.id}`);
        if (!fallbackResponse.ok) {
          throw new Error('Failed to cancel availability');
        }
        return fallbackResponse.json();
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      toast({
        title: 'Availability cancelled',
        description: 'Your availability has been cancelled for this slot.',
      });
      handleSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Render waitlisted slot content - simplified version
  const renderWaitlistedSlotContent = () => {
    if (!effectiveSlotData) return <div>Error: No slot data available</div>;
    
    return (
      <div className="space-y-4 py-2">
        <div className="grid gap-2">
          <p className="text-sm">{format(new Date(effectiveSlotData.date), 'EEEE, MMMM d, yyyy')}</p>
          <p className="text-sm">{effectiveSlotData.startTime} - {effectiveSlotData.endTime}</p>
          <p className="text-sm">Preferred Therapist: {slotDetails?.therapist_name || 'Selected Therapist'}</p>
        </div>
        
        <div className="pt-2">
          <Button 
            variant="destructive" 
            onClick={() => cancelWaitlistMutation.mutate()}
            disabled={cancelWaitlistMutation.isPending}
            className="w-full"
          >
            {cancelWaitlistMutation.isPending ? 'Cancelling...' : 'Cancel Availability'}
          </Button>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoadingSlot) {
      return (
        <div className="py-8 text-center">
          <div className="animate-spin text-primary mx-auto h-6 w-6 mb-4">
            <Clock className="h-6 w-6" />
          </div>
          <p className="text-sm text-muted-foreground">Loading slot information...</p>
        </div>
      );
    }
    
    switch (slotStatus) {
      case 'empty':
        return renderEmptySlotContent();
      case 'marked':
        return renderMarkedSlotContent();
      case 'assigned':
        return renderAssignedSlotContent();
      case 'completed':
        return renderCompletedSlotContent();
      case 'alternative':
        return renderAlternativeSlotContent();
      case 'waitlisted':
        return renderWaitlistedSlotContent();
      default:
        return <div>No actions available.</div>;
    }
  };
  
  // Dialog title based on slot status
  const getDialogTitle = () => {
    if (isLoadingSlot) return 'Loading...';
    
    switch (slotStatus) {
      case 'empty':
        if (isTherapist) return 'Set Your Availability';
        if (isStudent) return 'Indicate Your Availability';
        if (isAdmin) return 'Manage Slot';
        return 'View Slot';
      case 'marked':
        if (isTherapist) return 'Available Slot';
        if (isStudent) return 'Indicate Your Availability';
        if (isAdmin) return 'Available Slot';
        return 'Available Slot';
      case 'assigned':
        return 'Assigned Appointment';
      case 'completed':
        return 'Completed Appointment';
      case 'alternative':
        return 'Alternative Options';
      case 'waitlisted':
        return 'Your Waitlisted Slot';
      default:
        return 'Slot Details';
    }
  };
  
  // Only render the dialog when it's open
  if (!isOpen) return null;
  
  // Ensure we have effectiveSlotData for the dialog description
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 -ml-2"
              onClick={onClose}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <DialogTitle>{getDialogTitle()}</DialogTitle>
          </div>
          {slotStatus !== 'waitlisted' && effectiveSlotData && (
            <DialogDescription>
              {format(new Date(effectiveSlotData.date), 'EEEE, MMMM d, yyyy')} at {effectiveSlotData.startTime} - {effectiveSlotData.endTime}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}