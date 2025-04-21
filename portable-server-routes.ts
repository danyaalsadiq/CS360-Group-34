import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from 'ws';
import { storage } from "./server/storage";
import { setupAuth } from "./server/auth";
import { insertAppointmentSchema, insertFeedbackSchema, insertForumPostSchema, insertForumCommentSchema, insertChatMessageSchema, insertResourceSchema } from "./shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateAIResponse } from "./server/ai-service";
import { 
  SlotController, 
  TherapistSubmissionController, 
  StudentRequestController,
  CancellationController,
  SchedulerController
} from "./server/controllers";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Initialize controllers
  const slotController = new SlotController();
  const therapistSubmissionController = new TherapistSubmissionController();
  const studentRequestController = new StudentRequestController();
  const cancellationController = new CancellationController();
  const schedulerController = new SchedulerController();

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user has specific role
  const hasRole = (roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    };
  };

  // Utility function to handle validation errors
  const handleZodError = (error: any, res: any) => {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      return res.status(400).json({ message: validationError.message });
    }
    throw error;
  };

  // Include all the existing routes from the current routes.ts file
  // All the API routes for users, appointments, feedback, forum, chat, resources
  // And all the scheduling system API routes

  // Create an HTTP server
  const httpServer = createServer(app);
  
  // Create a WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // WebSocket connection handler
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
      console.log('Received message:', message.toString());
      // Handle WebSocket messages
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}