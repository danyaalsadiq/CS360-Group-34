import { TherapistSubmissionModel, ITherapistSubmission } from '../models/therapist-submission';
import { SlotService } from './slot-service';
import { ISlot } from '../models/slot';

export class TherapistSubmissionService {
  private slotService: SlotService;

  constructor() {
    this.slotService = new SlotService();
  }

  // Create a new therapist submission
  async createSubmission(submissionData: Partial<ITherapistSubmission>): Promise<ITherapistSubmission> {
    try {
      const submission = new TherapistSubmissionModel(submissionData);
      return await submission.save();
    } catch (error) {
      throw new Error(`Error creating therapist submission: ${error.message}`);
    }
  }

  // Get all therapist submissions
  async getAllSubmissions(): Promise<ITherapistSubmission[]> {
    try {
      return await TherapistSubmissionModel.find().sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Error fetching therapist submissions: ${error.message}`);
    }
  }

  // Get submission by ID
  async getSubmissionById(id: string): Promise<ITherapistSubmission> {
    try {
      const submission = await TherapistSubmissionModel.findById(id);
      if (!submission) {
        throw new Error(`Therapist submission with ID ${id} not found`);
      }
      return submission;
    } catch (error) {
      throw new Error(`Error fetching therapist submission: ${error.message}`);
    }
  }

  // Get submissions by therapist ID
  async getSubmissionsByTherapist(therapistId: string): Promise<ITherapistSubmission[]> {
    try {
      return await TherapistSubmissionModel.find({ therapist_id: therapistId }).sort({ created_at: -1 });
    } catch (error) {
      throw new Error(`Error fetching therapist submissions: ${error.message}`);
    }
  }

  // Process therapist submission (create slots)
  async processSubmission(submissionId: string): Promise<ISlot[]> {
    try {
      const submission = await this.getSubmissionById(submissionId);
      
      // Create slots for each available slot in the submission
      const slotsToCreate = submission.available_slots.map(slot => ({
        day: slot.day,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_booked: false,
        therapist_id: submission.therapist_id,
        therapist_name: submission.therapist_name
      }));
      
      // Create the slots
      const createdSlots = await this.slotService.createMultipleSlots(slotsToCreate);
      
      return createdSlots;
    } catch (error) {
      throw new Error(`Error processing therapist submission: ${error.message}`);
    }
  }

  // Update a submission
  async updateSubmission(id: string, updates: Partial<ITherapistSubmission>): Promise<ITherapistSubmission> {
    try {
      const updatedSubmission = await TherapistSubmissionModel.findByIdAndUpdate(
        id,
        { ...updates, updated_at: new Date() },
        { new: true, runValidators: true }
      );
      
      if (!updatedSubmission) {
        throw new Error(`Therapist submission with ID ${id} not found`);
      }
      
      return updatedSubmission;
    } catch (error) {
      throw new Error(`Error updating therapist submission: ${error.message}`);
    }
  }

  // Delete a submission
  async deleteSubmission(id: string): Promise<boolean> {
    try {
      const result = await TherapistSubmissionModel.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Error deleting therapist submission: ${error.message}`);
    }
  }
}