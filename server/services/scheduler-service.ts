import { SlotService } from './slot-service';
import { TherapistSubmissionService } from './therapist-submission-service';
import { StudentRequestService } from './student-request-service';
import { CancellationService } from './cancellation-service';
import { ISlot } from '../models/slot';
import { ITherapistSubmission } from '../models/therapist-submission';
import { IStudentRequest } from '../models/student-request';
import { ICancellationRequest } from '../models/cancellation-request';

export class SchedulerService {
  private slotService: SlotService;
  private therapistSubmissionService: TherapistSubmissionService;
  private studentRequestService: StudentRequestService;
  private cancellationService: CancellationService;

  constructor() {
    this.slotService = new SlotService();
    this.therapistSubmissionService = new TherapistSubmissionService();
    this.studentRequestService = new StudentRequestService();
    this.cancellationService = new CancellationService();
  }

  // Process a therapist availability submission
  async processTherapistAvailability(submissionData: Partial<ITherapistSubmission>): Promise<{
    submission: ITherapistSubmission;
    slots: ISlot[];
  }> {
    try {
      // Create the submission
      const submission = await this.therapistSubmissionService.createSubmission(submissionData);
      
      // Process the submission (create slots)
      const slots = await this.therapistSubmissionService.processSubmission(submission._id.toString());
      
      return { submission, slots };
    } catch (error) {
      throw new Error(`Error processing therapist availability: ${error.message}`);
    }
  }

  // Process a student appointment request
  async processStudentRequest(requestData: Partial<IStudentRequest>): Promise<{
    request: IStudentRequest;
    slot?: ISlot;
  }> {
    try {
      // Create the request
      const request = await this.studentRequestService.createRequest(requestData);
      
      // Process the request (assign slot)
      const processedRequest = await this.studentRequestService.processRequest(request._id.toString());
      
      // Get the assigned slot if available
      let assignedSlot: ISlot | undefined = undefined;
      if (processedRequest.assigned_slot_id) {
        assignedSlot = await this.slotService.getSlotById(processedRequest.assigned_slot_id);
      }
      
      return {
        request: processedRequest,
        slot: assignedSlot
      };
    } catch (error) {
      throw new Error(`Error processing student request: ${error.message}`);
    }
  }

  // Process a therapist cancellation request
  async processTherapistCancellation(cancellationData: Partial<ICancellationRequest>): Promise<{
    cancellation: ICancellationRequest;
    newSlot?: ISlot;
  }> {
    try {
      // Create the cancellation request
      const cancellation = await this.cancellationService.createCancellationRequest(cancellationData);
      
      // Get the original slot
      const originalSlot = await this.slotService.getSlotById(cancellation.slot_id);
      let studentId = originalSlot.student_id;
      let studentName = originalSlot.student_name;
      
      // Process the cancellation request
      const processedCancellation = await this.cancellationService.processCancellationRequest(
        cancellation._id.toString()
      );
      
      // If the cancellation was processed and a student was rescheduled,
      // find the new slot
      let newSlot: ISlot | undefined = undefined;
      if (
        processedCancellation.status === 'processed' &&
        studentId && 
        originalSlot.is_booked
      ) {
        // Find all slots for this therapist that have the student assigned
        const therapistSlots = await this.slotService.getBookedSlotsForTherapist(
          cancellation.therapist_id
        );
        
        // Find the slot with the student assigned (excluding the original slot)
        newSlot = therapistSlots.find(
          slot => slot.student_id === studentId && slot._id.toString() !== cancellation.slot_id
        );
      }
      
      return {
        cancellation: processedCancellation,
        newSlot
      };
    } catch (error) {
      throw new Error(`Error processing therapist cancellation: ${error.message}`);
    }
  }

  // Manually assign a student to a specific slot (admin override)
  async manuallyAssignSlot(slotId: string, studentId: string, studentName: string): Promise<ISlot> {
    try {
      // Book the slot
      const slot = await this.slotService.bookSlot(slotId, studentId, studentName);
      return slot;
    } catch (error) {
      throw new Error(`Error manually assigning slot: ${error.message}`);
    }
  }

  // Generate weekly schedule for all therapists
  async generateWeeklySchedule(startDate: Date): Promise<{
    [therapistId: string]: {
      therapistName: string;
      slots: ISlot[];
    };
  }> {
    try {
      // Calculate end date (7 days from start date)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 7);
      
      // Get all slots within the date range
      const allSlots = await this.slotService.getAllSlots();
      const weeklySlots = allSlots.filter(slot => {
        const slotDate = new Date(slot.date);
        return slotDate >= startDate && slotDate < endDate;
      });
      
      // Group slots by therapist
      const scheduleByTherapist: {
        [therapistId: string]: {
          therapistName: string;
          slots: ISlot[];
        };
      } = {};
      
      weeklySlots.forEach(slot => {
        if (slot.therapist_id) {
          if (!scheduleByTherapist[slot.therapist_id]) {
            scheduleByTherapist[slot.therapist_id] = {
              therapistName: slot.therapist_name || 'Unknown Therapist',
              slots: []
            };
          }
          
          scheduleByTherapist[slot.therapist_id].slots.push(slot);
        }
      });
      
      // Sort slots by date and time for each therapist
      Object.keys(scheduleByTherapist).forEach(therapistId => {
        scheduleByTherapist[therapistId].slots.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          
          if (dateA.getTime() !== dateB.getTime()) {
            return dateA.getTime() - dateB.getTime();
          }
          
          return a.start_time.localeCompare(b.start_time);
        });
      });
      
      return scheduleByTherapist;
    } catch (error) {
      throw new Error(`Error generating weekly schedule: ${error.message}`);
    }
  }

  // Process pending student requests (admin batch processing)
  async processPendingStudentRequests(): Promise<{
    processed: number;
    scheduled: number;
    rescheduled: number;
    rejected: number;
  }> {
    try {
      // Get all pending requests
      const pendingRequests = await this.studentRequestService.getRequestsByStatus('pending');
      
      let processed = 0;
      let scheduled = 0;
      let rescheduled = 0;
      let rejected = 0;
      
      // Process each request
      for (const request of pendingRequests) {
        const processedRequest = await this.studentRequestService.processRequest(request._id.toString());
        processed++;
        
        switch (processedRequest.status) {
          case 'scheduled':
            scheduled++;
            break;
          case 'rescheduled':
            rescheduled++;
            break;
          case 'rejected':
            rejected++;
            break;
        }
      }
      
      return {
        processed,
        scheduled,
        rescheduled,
        rejected
      };
    } catch (error) {
      throw new Error(`Error processing pending student requests: ${error.message}`);
    }
  }
}