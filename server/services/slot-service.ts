import { SlotModel, ISlot } from '../models/slot';
import mongoose from 'mongoose';

export class SlotService {
  // Create a new slot
  async createSlot(slotData: Partial<ISlot>): Promise<ISlot> {
    try {
      const slot = new SlotModel(slotData);
      return await slot.save();
    } catch (error) {
      throw new Error(`Error creating slot: ${error.message}`);
    }
  }

  // Get all slots
  async getAllSlots(): Promise<ISlot[]> {
    try {
      return await SlotModel.find().sort({ date: 1, start_time: 1 });
    } catch (error) {
      throw new Error(`Error fetching slots: ${error.message}`);
    }
  }

  // Get slot by ID
  async getSlotById(id: string): Promise<ISlot> {
    try {
      const slot = await SlotModel.findById(id);
      if (!slot) {
        throw new Error(`Slot with ID ${id} not found`);
      }
      return slot;
    } catch (error) {
      throw new Error(`Error fetching slot: ${error.message}`);
    }
  }

  // Get available slots for a therapist
  async getAvailableSlotsForTherapist(therapistId: string): Promise<ISlot[]> {
    try {
      return await SlotModel.find({
        therapist_id: therapistId,
        is_booked: false
      }).sort({ date: 1, start_time: 1 });
    } catch (error) {
      throw new Error(`Error fetching available slots: ${error.message}`);
    }
  }

  // Get booked slots for a therapist
  async getBookedSlotsForTherapist(therapistId: string): Promise<ISlot[]> {
    try {
      return await SlotModel.find({
        therapist_id: therapistId,
        is_booked: true
      }).sort({ date: 1, start_time: 1 });
    } catch (error) {
      throw new Error(`Error fetching booked slots: ${error.message}`);
    }
  }

  // Book a slot with student information
  async bookSlot(slotId: string, studentId: string, studentName: string): Promise<ISlot> {
    try {
      const slot = await SlotModel.findById(slotId);
      if (!slot) {
        throw new Error(`Slot with ID ${slotId} not found`);
      }
      
      if (slot.is_booked) {
        throw new Error(`Slot with ID ${slotId} is already booked`);
      }
      
      slot.is_booked = true;
      slot.student_id = studentId;
      slot.student_name = studentName;
      slot.updated_at = new Date();
      
      return await slot.save();
    } catch (error) {
      throw new Error(`Error booking slot: ${error.message}`);
    }
  }

  // Cancel a booking (mark as available and remove student info)
  async cancelBooking(slotId: string): Promise<ISlot> {
    try {
      const slot = await SlotModel.findById(slotId);
      if (!slot) {
        throw new Error(`Slot with ID ${slotId} not found`);
      }
      
      slot.is_booked = false;
      slot.student_id = undefined;
      slot.student_name = undefined;
      slot.updated_at = new Date();
      
      return await slot.save();
    } catch (error) {
      throw new Error(`Error cancelling booking: ${error.message}`);
    }
  }

  // Find next available slot for a therapist after a specific date
  async findNextAvailableSlot(therapistId: string, afterDate: Date): Promise<ISlot | null> {
    try {
      return await SlotModel.findOne({
        therapist_id: therapistId,
        is_booked: false,
        date: { $gte: afterDate }
      }).sort({ date: 1, start_time: 1 });
    } catch (error) {
      throw new Error(`Error finding next available slot: ${error.message}`);
    }
  }

  // Update a slot
  async updateSlot(id: string, updates: Partial<ISlot>): Promise<ISlot> {
    try {
      const slot = await SlotModel.findById(id);
      if (!slot) {
        throw new Error(`Slot with ID ${id} not found`);
      }
      
      // Apply updates
      Object.keys(updates).forEach((key) => {
        if (key !== '_id' && key !== 'created_at') {
          slot[key] = updates[key];
        }
      });
      
      slot.updated_at = new Date();
      return await slot.save();
    } catch (error) {
      throw new Error(`Error updating slot: ${error.message}`);
    }
  }

  // Delete a slot
  async deleteSlot(id: string): Promise<boolean> {
    try {
      const result = await SlotModel.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      throw new Error(`Error deleting slot: ${error.message}`);
    }
  }

  // Create multiple slots at once (for therapist availability)
  async createMultipleSlots(slotsData: Partial<ISlot>[]): Promise<ISlot[]> {
    try {
      const slots = await SlotModel.insertMany(slotsData);
      return slots;
    } catch (error) {
      throw new Error(`Error creating multiple slots: ${error.message}`);
    }
  }

  // Get all slots for a specific day
  async getSlotsByDay(day: string): Promise<ISlot[]> {
    try {
      return await SlotModel.find({ day }).sort({ start_time: 1 });
    } catch (error) {
      throw new Error(`Error fetching slots by day: ${error.message}`);
    }
  }

  // Get all slots for a specific date
  async getSlotsByDate(date: Date): Promise<ISlot[]> {
    try {
      // Create date range for the given date (start of day to end of day)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      return await SlotModel.find({
        date: { $gte: startDate, $lte: endDate }
      }).sort({ start_time: 1 });
    } catch (error) {
      throw new Error(`Error fetching slots by date: ${error.message}`);
    }
  }
}