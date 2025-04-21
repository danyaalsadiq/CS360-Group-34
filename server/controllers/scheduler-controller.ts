import { Request, Response } from 'express';
import { SchedulerService } from '../services/scheduler-service';

export class SchedulerController {
  private schedulerService: SchedulerService;

  constructor() {
    this.schedulerService = new SchedulerService();
  }

  // Process therapist availability submission
  async processTherapistAvailability(req: Request, res: Response): Promise<void> {
    try {
      const submissionData = req.body;
      const result = await this.schedulerService.processTherapistAvailability(submissionData);
      
      res.status(201).json({
        message: 'Therapist availability processed successfully',
        submission: result.submission,
        slots: result.slots
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Process student appointment request
  async processStudentRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      const result = await this.schedulerService.processStudentRequest(requestData);
      
      res.status(201).json({
        message: `Student request processed with status: ${result.request.status}`,
        request: result.request,
        slot: result.slot
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Process therapist cancellation request
  async processTherapistCancellation(req: Request, res: Response): Promise<void> {
    try {
      const cancellationData = req.body;
      const result = await this.schedulerService.processTherapistCancellation(cancellationData);
      
      res.status(201).json({
        message: `Therapist cancellation processed with status: ${result.cancellation.status}`,
        cancellation: result.cancellation,
        newSlot: result.newSlot
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Manually assign student to slot (admin override)
  async manuallyAssignSlot(req: Request, res: Response): Promise<void> {
    try {
      const { slotId } = req.params;
      const { studentId, studentName } = req.body;
      
      if (!studentId || !studentName) {
        throw new Error('Student ID and name are required');
      }
      
      const slot = await this.schedulerService.manuallyAssignSlot(slotId, studentId, studentName);
      
      res.status(200).json({
        message: 'Student manually assigned to slot',
        slot
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Generate weekly schedule for all therapists
  async generateWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const { startDate } = req.params;
      const parsedDate = new Date(startDate);
      
      if (isNaN(parsedDate.getTime())) {
        throw new Error('Invalid date format');
      }
      
      const schedule = await this.schedulerService.generateWeeklySchedule(parsedDate);
      
      res.status(200).json(schedule);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Process all pending student requests (batch processing)
  async processPendingStudentRequests(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.schedulerService.processPendingStudentRequests();
      
      res.status(200).json({
        message: 'Processed pending student requests',
        ...result
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}