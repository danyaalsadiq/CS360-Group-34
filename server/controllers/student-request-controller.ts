import { Request, Response } from 'express';
import { StudentRequestService } from '../services/student-request-service';

export class StudentRequestController {
  private studentRequestService: StudentRequestService;

  constructor() {
    this.studentRequestService = new StudentRequestService();
  }

  // Get all student requests
  async getAllRequests(req: Request, res: Response): Promise<void> {
    try {
      const requests = await this.studentRequestService.getAllRequests();
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get student request by ID
  async getRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await this.studentRequestService.getRequestById(id);
      res.status(200).json(request);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get requests by student ID
  async getRequestsByStudent(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const requests = await this.studentRequestService.getRequestsByStudent(studentId);
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get requests by status
  async getRequestsByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;
      const requests = await this.studentRequestService.getRequestsByStatus(status);
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new student request
  async createRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      const request = await this.studentRequestService.createRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Process a student request (assign slot)
  async processRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const processedRequest = await this.studentRequestService.processRequest(id);
      
      res.status(200).json({
        message: `Student request processed with status: ${processedRequest.status}`,
        request: processedRequest
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update a student request
  async updateRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedRequest = await this.studentRequestService.updateRequest(id, updates);
      res.status(200).json(updatedRequest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete a student request
  async deleteRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.studentRequestService.deleteRequest(id);
      
      if (result) {
        res.status(200).json({ message: 'Student request deleted successfully' });
      } else {
        res.status(404).json({ error: 'Student request not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}