import { Request, Response } from 'express';
import { CancellationService } from '../services/cancellation-service';

export class CancellationController {
  private cancellationService: CancellationService;

  constructor() {
    this.cancellationService = new CancellationService();
  }

  // Get all cancellation requests
  async getAllCancellationRequests(req: Request, res: Response): Promise<void> {
    try {
      const requests = await this.cancellationService.getAllCancellationRequests();
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Get cancellation request by ID
  async getCancellationRequestById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const request = await this.cancellationService.getCancellationRequestById(id);
      res.status(200).json(request);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  // Get cancellation requests by therapist ID
  async getCancellationRequestsByTherapist(req: Request, res: Response): Promise<void> {
    try {
      const { therapistId } = req.params;
      const requests = await this.cancellationService.getCancellationRequestsByTherapist(therapistId);
      res.status(200).json(requests);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // Create a new cancellation request
  async createCancellationRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestData = req.body;
      const request = await this.cancellationService.createCancellationRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Process a cancellation request
  async processCancellationRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const processedRequest = await this.cancellationService.processCancellationRequest(id);
      
      res.status(200).json({
        message: `Cancellation request processed with status: ${processedRequest.status}`,
        request: processedRequest
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Update a cancellation request
  async updateCancellationRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedRequest = await this.cancellationService.updateCancellationRequest(id, updates);
      res.status(200).json(updatedRequest);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // Delete a cancellation request
  async deleteCancellationRequest(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await this.cancellationService.deleteCancellationRequest(id);
      
      if (result) {
        res.status(200).json({ message: 'Cancellation request deleted successfully' });
      } else {
        res.status(404).json({ error: 'Cancellation request not found' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}