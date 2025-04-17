import { CancellationRequestModel, ICancellationRequest } from '../models/cancellation-request';
import { SlotService } from './slot-service';
import { StudentRequestService } from './student-request-service';
import { ISlot } from '../models/slot';

export class CancellationService {
  private slotService: SlotService;
  private studentRequestService: StudentRequestService;

  constructor() {
    this.slotService = new SlotService();
    this.studentRequestService = new StudentRequestService();
  }

  // Create a new cancellation request
  async createCancellationRequest(requestData: Partial<ICancellationRequest>): Promise<ICancellationRequest> {
    try {
      const request = new CancellationRequestModel(requestData);
      return await request.save();
    } catch (error) {
      throw new Error(`Error creating cancellation request: ${error.message}`);
    }
  }

  // Get all cancellation requests
  async getAllCancellationRequests(): Promise<ICancellationRequest[]> {
    try {
      return await CancellationRequestModel.find().sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Error fetching cancellation requests: ${error.message}`);
    }
  }

  // Get cancellation request by ID
  async getCancellationRequestById(id: string): Promise<ICancellationRequest> {
    try {
      const request = await CancellationRequestModel.findById(id);
      if (!request) {
        throw new Error(`Cancellation request with ID ${id} not found`);
      }
      return request;
    } catch (error) {
      throw new Error(`Error fetching cancellation request: ${error.message}`);
    }
  }

  // Get cancellation requests by therapist ID
  async getCancellationRequestsByTherapist(therapistId: string): Promise<ICancellationRequest[]> {
    try {
      return await CancellationRequestModel.find({ therapist_id: therapistId }).sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Error fetching cancellation requests: ${error.message}`);
    }
  }

  // Process a cancellation request
  async processCancellationRequest(requestId: string): Promise<ICancellationRequest> {
    try {
      const request = await this.getCancellationRequestById(requestId);
      
      if (request.status !== 'pending') {
        throw new Error(`Cancellation request with ID ${requestId} is already processed (status: ${request.status})`);
      }
      
      // Get the slot
      const slot = await this.slotService.getSlotById(request.slot_id);
      
      // If the slot has a student assigned, we need to reschedule them
      if (slot.is_booked && slot.student_id) {
        // Find the next available slot for the same therapist
        const nextAvailableSlot = await this.slotService.findNextAvailableSlot(
          slot.therapist_id,
          new Date()
        );
        
        if (nextAvailableSlot) {
          // Book the next available slot with the student
          await this.slotService.bookSlot(
            nextAvailableSlot._id.toString(),
            slot.student_id,
            slot.student_name
          );
          
          // Cancel the original booking
          await this.slotService.cancelBooking(slot._id.toString());
          
          // Update the request status
          request.status = 'processed';
          await request.save();
        } else {
          // If no available slots, reject the cancellation request
          request.status = 'rejected';
          await request.save();
          throw new Error('No available slots for rescheduling the student. Cancellation rejected.');
        }
      } else {
        // If no student assigned, just cancel the slot
        await this.slotService.cancelBooking(slot._id.toString());
        
        // Update the request status
        request.status = 'processed';
        await request.save();
      }
      
      return request;
    } catch (error) {
      throw new Error(`Error processing cancellation request: ${error.message}`);
    }
  }

  // Update a cancellation request
  async updateCancellationRequest(id: string, updates: Partial<ICancellationRequest>): Promise<ICancellationRequest> {
    try {
      const updatedRequest = await CancellationRequestModel.findByIdAndUpdate(
        id,
        { ...updates, updated_at: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!updatedRequest) {
        throw new Error(`Cancellation request with ID ${id} not found`);
      }
      
      return updatedRequest;
    } catch (error) {
      throw new Error(`Error updating cancellation request: ${error.message}`);
    }
  }

  // Delete a cancellation request
  async deleteCancellationRequest(id: string): Promise<boolean> {
    try {
      const result = await CancellationRequestModel.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Error deleting cancellation request: ${error.message}`);
    }
  }
}