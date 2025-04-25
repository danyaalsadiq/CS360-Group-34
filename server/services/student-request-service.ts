import { StudentRequestModel, IStudentRequest } from '../models/student-request';
import { SlotService } from './slot-service';
import { ISlot } from '../models/slot';

export class StudentRequestService {
  private slotService: SlotService;

  constructor() {
    this.slotService = new SlotService();
  }

  // Create a new student request
  async createRequest(requestData: Partial<IStudentRequest>): Promise<IStudentRequest> {
    try {
      const request = new StudentRequestModel(requestData);
      return await request.save();
    } catch (error) {
      throw new Error(`Error creating student request: ${error.message}`);
    }
  }

  // Get all student requests
  async getAllRequests(): Promise<IStudentRequest[]> {
    try {
      return await StudentRequestModel.find().sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Error fetching student requests: ${error.message}`);
    }
  }

  // Get request by ID
  async getRequestById(id: string): Promise<IStudentRequest> {
    try {
      const request = await StudentRequestModel.findById(id);
      if (!request) {
        throw new Error(`Student request with ID ${id} not found`);
      }
      return request;
    } catch (error) {
      throw new Error(`Error fetching student request: ${error.message}`);
    }
  }

  // Get requests by student ID
  async getRequestsByStudent(studentId: string): Promise<IStudentRequest[]> {
    try {
      return await StudentRequestModel.find({ student_id: studentId }).sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Error fetching student requests: ${error.message}`);
    }
  }

  // Get requests by status
  async getRequestsByStatus(status: string): Promise<IStudentRequest[]> {
    try {
      return await StudentRequestModel.find({ status }).sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Error fetching student requests: ${error.message}`);
    }
  }

  // Process a student request (assign slot)
  async processRequest(requestId: string): Promise<IStudentRequest> {
    try {
      const request = await this.getRequestById(requestId);
      
      if (request.status !== 'pending') {
        throw new Error(`Request with ID ${requestId} is already processed (status: ${request.status})`);
      }
      
      // Try to find an available slot that matches the preferred criteria
      const preferredDate = new Date(request.preferred_date);
      const preferredStartTime = request.preferred_slot_time;
      
      // Find matching slot (exact match for preferred criteria)
      const matchingSlots = await this.slotService.getAllSlots();
      let matchingSlot = matchingSlots.find(slot => 
        slot.therapist_id === request.preferred_therapist_id &&
        slot.day === request.preferred_day &&
        new Date(slot.date).toDateString() === preferredDate.toDateString() &&
        slot.start_time === preferredStartTime &&
        !slot.is_booked
      );
      
      if (matchingSlot) {
        // Book the slot with the student information
        await this.slotService.bookSlot(
          matchingSlot._id.toString(),
          request.student_id,
          request.student_name
        );
        
        // Update the request status
        request.status = 'scheduled';
        request.assigned_slot_id = matchingSlot._id.toString();
        await request.save();
        
        return request;
      }
      
      // If no exact match found, find the next available slot for the preferred therapist
      const nextAvailableSlot = await this.slotService.findNextAvailableSlot(
        request.preferred_therapist_id,
        preferredDate
      );
      
      if (nextAvailableSlot) {
        // Book the next available slot
        await this.slotService.bookSlot(
          nextAvailableSlot._id.toString(),
          request.student_id,
          request.student_name
        );
        
        // Update the request status
        request.status = 'rescheduled';
        request.assigned_slot_id = nextAvailableSlot._id.toString();
        await request.save();
        
        return request;
      }
      
      // If no slots available, mark as rejected
      request.status = 'rejected';
      await request.save();
      
      return request;
    } catch (error) {
      throw new Error(`Error processing student request: ${error.message}`);
    }
  }

  // Update a request
  async updateRequest(id: string, updates: Partial<IStudentRequest>): Promise<IStudentRequest> {
    try {
      const updatedRequest = await StudentRequestModel.findByIdAndUpdate(
        id,
        { ...updates, updated_at: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!updatedRequest) {
        throw new Error(`Student request with ID ${id} not found`);
      }
      
      return updatedRequest;
    } catch (error) {
      throw new Error(`Error updating student request: ${error.message}`);
    }
  }

  // Delete a request
  async deleteRequest(id: string): Promise<boolean> {
    try {
      const result = await StudentRequestModel.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Error deleting student request: ${error.message}`);
    }
  }
}