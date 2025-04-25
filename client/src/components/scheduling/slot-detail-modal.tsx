import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { StudentRequestForm } from './student-request-form';
import { TherapistSubmissionForm } from './therapist-submission-form';
import { CancellationForm } from './cancellation-form';
import { useAuth } from '@/hooks/use-auth';

interface Slot {
  _id: string;
  day: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  therapist_id?: string;
  therapist_name?: string;
  student_id?: string;
  student_name?: string;
  created_at: string;
  updated_at: string;
}

interface SlotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: Slot;
  actionType: 'book' | 'cancel' | 'find-next';
  onSuccess: () => void;
  onFindNext: () => void;
}

export function SlotDetailModal({
  isOpen,
  onClose,
  slot,
  actionType,
  onSuccess,
  onFindNext,
}: SlotDetailModalProps) {
  const { user } = useAuth();
  const [currentAction, setCurrentAction] = useState(actionType);
  
  // Determine which form to show based on user role and action
  const renderForm = () => {
    if (user?.role === 'student') {
      if (currentAction === 'book' || currentAction === 'find-next') {
        return (
          <StudentRequestForm
            slotId={slot._id}
            date={slot.date}
            startTime={slot.start_time}
            endTime={slot.end_time}
            therapistId={slot.therapist_id}
            therapistName={slot.therapist_name}
            onSuccess={onSuccess}
            onCancel={onClose}
            onFindNext={onFindNext}
          />
        );
      } else if (currentAction === 'cancel') {
        return (
          <CancellationForm
            slotId={slot._id}
            date={slot.date}
            startTime={slot.start_time}
            endTime={slot.end_time}
            therapistName={slot.therapist_name}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        );
      }
    } else if (user?.role === 'therapist') {
      if (currentAction === 'book') {
        return (
          <TherapistSubmissionForm
            slotId={slot._id}
            date={slot.date}
            startTime={slot.start_time}
            endTime={slot.end_time}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        );
      } else if (currentAction === 'cancel') {
        return (
          <CancellationForm
            slotId={slot._id}
            date={slot.date}
            startTime={slot.start_time}
            endTime={slot.end_time}
            studentName={slot.student_name}
            onSuccess={onSuccess}
            onCancel={onClose}
          />
        );
      }
    }
    
    // Default case - should not happen with proper UI flow
    return (
      <div className="p-4 text-center">
        <p>No action available for this slot.</p>
      </div>
    );
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        {renderForm()}
      </DialogContent>
    </Dialog>
  );
}