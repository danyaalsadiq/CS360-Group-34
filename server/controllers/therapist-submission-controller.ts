import { Request, Response } from 'express';
import { TherapistSubmissionService } from '../services/therapist-submission-service';

export class TherapistSubmissionController {
  private therapistSubmissionService: TherapistSubmissionService;

  constructor() {
    this.therapistSubmissionService = new TherapistSubmissionService();
  }

  // Get all therapist submissions
  async getAllSubmissions(req: Request, res: Response): Promise<void> {
    try {
      const submissions = await this.therapistSubmissionService.getAllSubmissions();
      res.status(200).json(submissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get therapist submission by ID
  async getSubmissionById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const submission = await this.therapistSubmissionService.getSubmissionById(id);
      res.status(200).json(submission);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get submissions by therapist ID
  async getSubmissionsByTherapist(req: Request, res: Response): Promise<void> {
    try {
      const { therapistId } = req.params;
      const submissions = await this.therapistSubmissionService.getSubmissionsByTherapist(therapistId);
      res.status(200).json(submissions);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new therapist submission
  async createSubmission(req: Request, res: Response): Promise<void> {
    try {
      const submissionData = req.body;
      const submission = await this.therapistSubmissionService.createSubmission(submissionData);
      res.status(201).json(submission);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Process a therapist submission (create slots)
  async processSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const slots = await this.therapistSubmissionService.processSubmission(id);
      res.status(200).json({
        message: 'Therapist submission processed successfully',
        slots
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update a therapist submission
  async updateSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedSubmission = await this.therapistSubmissionService.updateSubmission(id, updates);
      res.status(200).json(updatedSubmission);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete a therapist submission
  async deleteSubmission(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.therapistSubmissionService.deleteSubmission(id);
      
      if (result) {
        res.status(200).json({ message: 'Therapist submission deleted successfully' });
      } else {
        res.status(404).json({ error: 'Therapist submission not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}