import { Request, Response } from 'express';
import { SlotService } from '../services/slot-service';

export class SlotController {
  private slotService: SlotService;

  constructor() {
    this.slotService = new SlotService();
  }

  // Get all slots
  async getAllSlots(req: Request, res: Response): Promise<void> {
    try {
      const slots = await this.slotService.getAllSlots();
      res.status(200).json(slots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get slot by ID
  async getSlotById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const slot = await this.slotService.getSlotById(id);
      res.status(200).json(slot);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get slots by day
  async getSlotsByDay(req: Request, res: Response): Promise<void> {
    try {
      const { day } = req.params;
      const slots = await this.slotService.getSlotsByDay(day);
      res.status(200).json(slots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get slots by date
  async getSlotsByDate(req: Request, res: Response): Promise<void> {
    try {
      const { date } = req.params;
      const parsedDate = new Date(date);
      
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      const slots = await this.slotService.getSlotsByDate(parsedDate);
      res.status(200).json(slots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get available slots for a therapist
  async getAvailableSlotsForTherapist(req: Request, res: Response): Promise<void> {
    try {
      const { therapistId } = req.params;
      const slots = await this.slotService.getAvailableSlotsForTherapist(therapistId);
      res.status(200).json(slots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new slot
  async createSlot(req: Request, res: Response): Promise<void> {
    try {
      const slotData = req.body;
      const slot = await this.slotService.createSlot(slotData);
      res.status(201).json(slot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update a slot
  async updateSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedSlot = await this.slotService.updateSlot(id, updates);
      res.status(200).json(updatedSlot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete a slot
  async deleteSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.slotService.deleteSlot(id);
      
      if (result) {
        res.status(200).json({ message: 'Slot deleted successfully' });
      } else {
        res.status(404).json({ error: 'Slot not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Book a slot
  async bookSlot(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { studentId, studentName } = req.body;
      
      if (!studentId || !studentName) {
        throw new Error('Student ID and name are required');
      }
      
      const slot = await this.slotService.bookSlot(id, studentId, studentName);
      res.status(200).json(slot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Cancel a booking
  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const slot = await this.slotService.cancelBooking(id);
      res.status(200).json(slot);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}