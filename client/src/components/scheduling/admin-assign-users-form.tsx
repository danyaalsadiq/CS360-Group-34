import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface AdminAssignUsersFormProps {
  date: string;
  startTime: string;
  endTime: string;
  slotId?: string;
  therapistId?: string;
  onClose: () => void;
}

export default function AdminAssignUsersForm({
  date,
  startTime,
  endTime,
  slotId,
  therapistId: initialTherapistId,
  onClose
}: AdminAssignUsersFormProps) {
  const { toast } = useToast();
  const [selectedTherapistId, setSelectedTherapistId] = useState<string | null>(initialTherapistId || null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [createNewSlot, setCreateNewSlot] = useState(!slotId);
  const [waitlistStudent, setWaitlistStudent] = useState(false);
  
  // Format display date
  const formattedDate = format(new Date(date), 'EEEE, MMMM d, yyyy');
  
  // Fetch therapist list
  const { data: therapists, isLoading: therapistsLoading } = useQuery({
    queryKey: ['/api/users?role=therapist'],
    queryFn: async () => {
      const res = await fetch('/api/users?role=therapist');
      if (!res.ok) throw new Error('Failed to fetch therapists');
      return res.json();
    }
  });
  
  // Fetch student list
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/users?role=student'],
    queryFn: async () => {
      const res = await fetch('/api/users?role=student');
      if (!res.ok) throw new Error('Failed to fetch students');
      return res.json();
    }
  });
  
  // Mutation for assigning a student to an existing slot
  const assignStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/slots/admin/assign', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign student');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Student has been successfully assigned to the slot',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/slots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudentId) {
      toast({
        title: 'Missing information',
        description: 'Please select a student',
        variant: 'destructive',
      });
      return;
    }
    
    if (!waitlistStudent && !selectedTherapistId) {
      toast({
        title: 'Missing information',
        description: 'Please select a therapist or choose to waitlist the student',
        variant: 'destructive',
      });
      return;
    }
    
    // Prepare data for different scenarios
    if (slotId && !createNewSlot) {
      // Case 1: Assigning to an existing slot
      assignStudentMutation.mutate({
        slotId,
        studentId: selectedStudentId,
        notes: notes || undefined
      });
    } else if (selectedTherapistId && !waitlistStudent) {
      // Case 2: Creating a new booked slot with both therapist and student
      assignStudentMutation.mutate({
        date,
        startTime,
        endTime,
        therapistId: selectedTherapistId,
        studentId: selectedStudentId,
        notes: notes || undefined
      });
    } else if (waitlistStudent) {
      // Case 3: Waitlisting student for future therapist availability
      assignStudentMutation.mutate({
        date,
        startTime,
        endTime,
        studentId: selectedStudentId,
        notes: notes || undefined
      });
    }
  };
  
  // When slotId changes, update form mode
  useEffect(() => {
    setCreateNewSlot(!slotId);
  }, [slotId]);
  
  // Get the selected therapist and student names for display
  const selectedTherapist = therapists?.find(t => t.id === selectedTherapistId)?.name || '';
  const selectedStudent = students?.find(s => s.id === selectedStudentId)?.name || '';
  
  const isLoading = therapistsLoading || studentsLoading;
  const isSubmitting = assignStudentMutation.isPending;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Admin Scheduling</h3>
        <p className="text-sm text-muted-foreground">
          {slotId && !createNewSlot
            ? 'Assign a student to this existing slot'
            : 'Create a new appointment for a student'}
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <Label htmlFor="date">Date and Time</Label>
          <p className="text-sm mt-1">{formattedDate} @ {startTime} - {endTime}</p>
        </div>
        
        {!createNewSlot && slotId && (
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="createNew" 
              checked={createNewSlot}
              onCheckedChange={(checked) => setCreateNewSlot(checked as boolean)}
            />
            <Label htmlFor="createNew" className="text-sm">Create new slot instead of using existing one</Label>
          </div>
        )}
        
        {(createNewSlot || !slotId) && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="waitlist" 
                checked={waitlistStudent}
                onCheckedChange={(checked) => setWaitlistStudent(checked as boolean)}
              />
              <Label htmlFor="waitlist" className="text-sm">
                Waitlist student (no therapist assigned yet)
              </Label>
            </div>
            
            {!waitlistStudent && (
              <div>
                <Label htmlFor="therapist">Therapist</Label>
                <Select
                  value={selectedTherapistId || ''}
                  onValueChange={setSelectedTherapistId}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger id="therapist" className="w-full">
                    <SelectValue placeholder="Select a therapist" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Therapists</SelectLabel>
                      {therapistsLoading ? (
                        <div className="flex items-center justify-center py-2">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading therapists...</span>
                        </div>
                      ) : (
                        therapists?.map((therapist) => (
                          <SelectItem key={therapist.id} value={therapist.id}>
                            {therapist.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
        
        <div>
          <Label htmlFor="student">Student</Label>
          <Select
            value={selectedStudentId || ''}
            onValueChange={setSelectedStudentId}
            disabled={isLoading || isSubmitting}
          >
            <SelectTrigger id="student" className="w-full">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Students</SelectLabel>
                {studentsLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Loading students...</span>
                  </div>
                ) : (
                  students?.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name}
                    </SelectItem>
                  ))
                )}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes for this appointment"
            className="min-h-[80px]"
            disabled={isSubmitting}
          />
        </div>
      </div>
      
      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isSubmitting || !selectedStudentId || (!waitlistStudent && !selectedTherapistId && createNewSlot)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Assigning...
            </>
          ) : waitlistStudent ? (
            'Waitlist Student'
          ) : createNewSlot ? (
            'Create Appointment'
          ) : (
            'Assign Student'
          )}
        </Button>
      </div>
      
      {/* Preview what will be created */}
      {(selectedTherapistId || selectedStudentId) && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md text-sm">
          <h4 className="text-sm font-medium mb-2">Assignment Preview:</h4>
          <ul className="space-y-1">
            <li><strong>Date:</strong> {formattedDate}</li>
            <li><strong>Time:</strong> {startTime} - {endTime}</li>
            <li><strong>Type:</strong> {
              waitlistStudent 
                ? 'Student Waitlisted (No Therapist Yet)' 
                : slotId && !createNewSlot 
                  ? 'Student Assigned to Existing Slot' 
                  : 'New Appointment Created'
            }</li>
            {selectedStudent && (
              <li><strong>Student:</strong> {selectedStudent}</li>
            )}
            {selectedTherapistId && !waitlistStudent && (
              <li><strong>Therapist:</strong> {selectedTherapist}</li>
            )}
            {notes && <li><strong>Notes:</strong> {notes}</li>}
          </ul>
        </div>
      )}
    </form>
  );
}