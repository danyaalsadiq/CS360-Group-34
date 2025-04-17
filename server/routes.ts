import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAppointmentSchema, insertFeedbackSchema, insertForumPostSchema, insertForumCommentSchema, insertChatMessageSchema, insertResourceSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateAIResponse } from "./ai-service";
import { 
  SlotController, 
  TherapistSubmissionController, 
  StudentRequestController,
  CancellationController,
  SchedulerController
} from "./controllers";

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

  // User routes
  app.get("/api/users", isAuthenticated, async (req, res) => {
    const role = req.query.role as string | undefined;
    const users = await storage.listUsers(role);
    
    // Don't send password field to client
    const sanitizedUsers = users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
    
    res.json(sanitizedUsers);
  });

  // Appointment routes
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    let appointments;
    const userId = req.user!.id;
    
    switch (req.user!.role) {
      case "student":
        appointments = await storage.listAppointmentsByStudent(userId);
        break;
      case "therapist":
        appointments = await storage.listAppointmentsByTherapist(userId);
        break;
      case "admin":
        appointments = await storage.listAllAppointments();
        break;
      default:
        return res.status(403).json({ message: "Forbidden" });
    }
    
    // Fetch user details for each appointment
    const appointmentsWithDetails = await Promise.all(appointments.map(async appointment => {
      const therapist = await storage.getUser(appointment.therapistId);
      const student = await storage.getUser(appointment.studentId);
      const feedback = await storage.listFeedbackByAppointment(appointment.id.toString());
      
      return {
        ...appointment,
        therapist: therapist ? { 
          id: therapist.id, 
          name: therapist.name, 
          specialization: therapist.specialization,
          profileImage: therapist.profileImage,
        } : null,
        student: student ? { 
          id: student.id, 
          name: student.name,
          profileImage: student.profileImage,
        } : null,
        hasFeedback: !!feedback,
      };
    }));
    
    res.json(appointmentsWithDetails);
  });

  app.post("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      
      // Additional validation based on role
      if (req.user!.role === "student") {
        // Students can only create appointments for themselves
        if (appointmentData.studentId !== req.user!.id.toString()) {
          return res.status(403).json({ message: "You can only book appointments for yourself" });
        }
      } else if (req.user!.role === "therapist") {
        // Therapists can only create appointments with themselves as the therapist
        if (appointmentData.therapistId !== req.user!.id.toString()) {
          return res.status(403).json({ message: "You can only create appointments where you are the therapist" });
        }
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  app.patch("/api/appointments/:id", isAuthenticated, async (req, res) => {
    // Don't parse to int for MongoDB
    const appointmentId = req.params.id;
    const appointment = await storage.getAppointment(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    
    // Check permissions based on role
    if (req.user!.role === "student" && appointment.studentId !== req.user!.id.toString()) {
      return res.status(403).json({ message: "You can only modify your own appointments" });
    }
    
    if (req.user!.role === "therapist" && appointment.therapistId !== req.user!.id.toString()) {
      return res.status(403).json({ message: "You can only modify appointments where you are the therapist" });
    }
    
    const updatedAppointment = await storage.updateAppointment(appointmentId, req.body);
    res.json(updatedAppointment);
  });

  // Feedback routes
  app.get("/api/feedback", isAuthenticated, hasRole(["therapist", "admin"]), async (req, res) => {
    const therapistId = req.query.therapistId as string;
    
    if (!therapistId) {
      return res.status(400).json({ message: "Therapist ID is required" });
    }
    
    if (req.user!.role === "therapist" && therapistId !== req.user!.id.toString()) {
      return res.status(403).json({ message: "You can only view your own feedback" });
    }
    
    const feedbackList = await storage.listFeedbackByTherapist(therapistId);
    
    // Fetch appointment details for each feedback
    const feedbackWithDetails = await Promise.all(feedbackList.map(async feedback => {
      const appointment = await storage.getAppointment(feedback.appointmentId);
      const student = appointment ? await storage.getUser(appointment.studentId) : null;
      
      return {
        ...feedback,
        appointment: appointment ? {
          id: appointment.id,
          date: appointment.date,
          status: appointment.status,
        } : null,
        student: student ? {
          id: student.id,
          name: student.name,
          profileImage: student.profileImage,
        } : null,
      };
    }));
    
    res.json(feedbackWithDetails);
  });

  app.post("/api/feedback", isAuthenticated, hasRole(["student"]), async (req, res) => {
    try {
      const feedbackData = insertFeedbackSchema.parse(req.body);
      
      // Verify student is the one who had the appointment
      const appointment = await storage.getAppointment(feedbackData.appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      if (appointment.studentId !== req.user!.id.toString()) {
        return res.status(403).json({ message: "You can only provide feedback for your own appointments" });
      }
      
      // Check if feedback already exists
      const existingFeedback = await storage.listFeedbackByAppointment(appointment.id.toString());
      if (existingFeedback) {
        return res.status(400).json({ message: "Feedback already provided for this appointment" });
      }
      
      // Add student and therapist IDs from appointment
      const completeData = {
        ...feedbackData,
        studentId: appointment.studentId,
        therapistId: appointment.therapistId
      };
      
      const feedback = await storage.createFeedback(completeData);
      
      // Update appointment status if it's not already completed
      if (appointment.status !== "completed") {
        await storage.updateAppointment(appointment.id, { status: "completed" });
      }
      
      res.status(201).json(feedback);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Forum routes
  app.get("/api/forum/posts", isAuthenticated, async (req, res) => {
    const posts = await storage.listForumPosts();
    
    // Fetch user details and comment counts for each post
    const postsWithDetails = await Promise.all(posts.map(async post => {
      const user = await storage.getUser(post.userId);
      const comments = await storage.listCommentsByPost(post.id);
      
      return {
        ...post,
        user: post.isAnonymous ? null : (user ? { 
          id: user.id, 
          name: user.name,
          role: user.role,
          profileImage: user.profileImage,
        } : null),
        commentCount: comments.length,
      };
    }));
    
    res.json(postsWithDetails);
  });

  app.post("/api/forum/posts", isAuthenticated, async (req, res) => {
    try {
      // Convert userId to string if needed (for MongoDB)
      const userId = req.user!.id;
      
      // Instead of using the zod schema that enforces number,
      // create the post data directly
      const postData = {
        ...req.body,
        userId
      };
      
      const post = await storage.createForumPost(postData);
      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating forum post:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  app.get("/api/forum/posts/:id/comments", isAuthenticated, async (req, res) => {
    // Use the ID as is for MongoDB
    const postId = req.params.id;
    const post = await storage.getForumPost(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    const comments = await storage.listCommentsByPost(postId);
    
    // Fetch user details for each comment
    const commentsWithDetails = await Promise.all(comments.map(async comment => {
      const user = await storage.getUser(comment.userId);
      
      return {
        ...comment,
        user: comment.isAnonymous ? null : (user ? { 
          id: user.id, 
          name: user.name,
          role: user.role,
          profileImage: user.profileImage,
        } : null),
      };
    }));
    
    res.json(commentsWithDetails);
  });

  app.post("/api/forum/posts/:id/comments", isAuthenticated, async (req, res) => {
    // Get the post ID from the params - but don't parse it to int if using MongoDB
    const postId = req.params.id;
    const post = await storage.getForumPost(postId);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    
    try {
      // Get the user ID
      const userId = req.user!.id;
      
      // Create comment data directly
      const commentData = {
        ...req.body,
        postId,
        userId
      };
      
      const comment = await storage.createForumComment(commentData);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating forum comment:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Chat routes
  app.get("/api/chat/messages", isAuthenticated, async (req, res) => {
    // Convert userId to string for MongoDB compatibility
    const userId = String(req.user!.id);
    console.log(`GET /api/chat/messages: Fetching messages for user ${userId}`);
    
    const messages = await storage.listChatMessagesByUser(userId);
    console.log(`Returning ${messages.length} messages`);
    
    res.json(messages);
  });

  app.post("/api/chat/messages", isAuthenticated, async (req, res) => {
    try {
      // Convert userId to string for MongoDB compatibility
      const userId = String(req.user!.id);
      console.log(`POST /api/chat/messages: Creating message for user ${userId}`);
      
      // Create user message
      const messageData = insertChatMessageSchema.parse({
        ...req.body,
        userId: userId,
        isFromUser: true,
      });
      
      console.log('Creating user message:', messageData);
      const message = await storage.createChatMessage(messageData);
      console.log('User message created successfully:', message);
      
      // Generate AI response using Groq
      console.log('Generating AI response to:', req.body.content);
      const responseContent = await generateAIResponse({
        userMessage: req.body.content
      });
      console.log('AI response generated:', responseContent.substring(0, 50) + '...');
      
      // Create AI response message
      const aiResponse = {
        userId: userId,
        isFromUser: false,
        content: responseContent,
      };
      
      console.log('Creating AI message');
      const aiMessage = await storage.createChatMessage(aiResponse);
      console.log('AI message created successfully:', aiMessage);
      
      // Return both messages
      console.log('Returning both messages to client');
      res.status(201).json([message, aiMessage]);
    } catch (error) {
      console.error("Error in chat message API:", error);
      handleZodError(error, res);
    }
  });

  // Resources routes
  app.get("/api/resources", isAuthenticated, async (req, res) => {
    let resources;
    const therapistId = req.query.therapistId as string | undefined;
    
    if (therapistId) {
      resources = await storage.listResourcesByTherapist(therapistId);
    } else {
      resources = await storage.listResources();
    }
    
    // Fetch therapist details for each resource
    const resourcesWithDetails = await Promise.all(resources.map(async resource => {
      const therapist = await storage.getUser(resource.therapistId);
      
      return {
        ...resource,
        therapist: therapist ? { 
          id: therapist.id, 
          name: therapist.name,
          specialization: therapist.specialization,
        } : null,
      };
    }));
    
    res.json(resourcesWithDetails);
  });

  app.post("/api/resources", isAuthenticated, hasRole(["therapist", "admin"]), async (req, res) => {
    try {
      const resourceData = insertResourceSchema.parse({
        ...req.body,
        therapistId: req.user!.role === "therapist" ? req.user!.id : req.body.therapistId,
      });
      
      const resource = await storage.createResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      handleZodError(error, res);
    }
  });

  // Scheduling System - Slot API routes
  
  // Get all slots (admin-only)
  app.get('/api/scheduling/slots', isAuthenticated, hasRole(['admin']), 
    (req, res) => slotController.getAllSlots(req, res));
  
  // Get a specific slot by ID
  app.get('/api/scheduling/slots/:id', isAuthenticated, 
    (req, res) => slotController.getSlotById(req, res));
  
  // Get slots by day (e.g., Monday, Tuesday)
  app.get('/api/scheduling/slots/day/:day', isAuthenticated, 
    (req, res) => slotController.getSlotsByDay(req, res));
  
  // Get slots by specific date (e.g., 2023-09-15)
  app.get('/api/scheduling/slots/date/:date', isAuthenticated, 
    (req, res) => slotController.getSlotsByDate(req, res));
  
  // Get available slots for a specific therapist
  app.get('/api/scheduling/slots/therapist/:therapistId/available', isAuthenticated, 
    (req, res) => slotController.getAvailableSlotsForTherapist(req, res));
  
  // Create a new slot (admin-only)
  app.post('/api/scheduling/slots', isAuthenticated, hasRole(['admin']), 
    (req, res) => slotController.createSlot(req, res));
  
  // Update a slot (admin-only)
  app.put('/api/scheduling/slots/:id', isAuthenticated, hasRole(['admin']), 
    (req, res) => slotController.updateSlot(req, res));
  
  // Delete a slot (admin-only)
  app.delete('/api/scheduling/slots/:id', isAuthenticated, hasRole(['admin']), 
    (req, res) => slotController.deleteSlot(req, res));
  
  // Book a slot (students and admin)
  app.post('/api/scheduling/slots/:id/book', isAuthenticated, hasRole(['student', 'admin']), 
    (req, res) => slotController.bookSlot(req, res));
  
  // Cancel a booking (students, therapists, and admin)
  app.post('/api/scheduling/slots/:id/cancel', isAuthenticated, 
    (req, res) => slotController.cancelBooking(req, res));
  
  // Scheduling System - Therapist Submission API routes
  
  // Get all therapist submissions (admin-only)
  app.get('/api/scheduling/therapist-submissions', isAuthenticated, hasRole(['admin']), 
    (req, res) => therapistSubmissionController.getAllSubmissions(req, res));
  
  // Get a therapist submission by ID
  app.get('/api/scheduling/therapist-submissions/:id', isAuthenticated, 
    (req, res) => therapistSubmissionController.getSubmissionById(req, res));
  
  // Get submissions by a specific therapist
  app.get('/api/scheduling/therapist-submissions/therapist/:therapistId', isAuthenticated, 
    (req, res) => therapistSubmissionController.getSubmissionsByTherapist(req, res));
  
  // Create a therapist submission (therapists and admin)
  app.post('/api/scheduling/therapist-submissions', isAuthenticated, hasRole(['therapist', 'admin']), 
    (req, res) => therapistSubmissionController.createSubmission(req, res));
  
  // Process a therapist submission (admin-only)
  app.post('/api/scheduling/therapist-submissions/:id/process', isAuthenticated, hasRole(['admin']), 
    (req, res) => therapistSubmissionController.processSubmission(req, res));
  
  // Update a therapist submission (therapists and admin)
  app.put('/api/scheduling/therapist-submissions/:id', isAuthenticated, hasRole(['therapist', 'admin']), 
    (req, res) => therapistSubmissionController.updateSubmission(req, res));
  
  // Delete a therapist submission (admin-only)
  app.delete('/api/scheduling/therapist-submissions/:id', isAuthenticated, hasRole(['admin']), 
    (req, res) => therapistSubmissionController.deleteSubmission(req, res));
  
  // Scheduling System - Student Request API routes
  
  // Get all student requests (admin-only)
  app.get('/api/scheduling/student-requests', isAuthenticated, hasRole(['admin']), 
    (req, res) => studentRequestController.getAllRequests(req, res));
  
  // Get a student request by ID
  app.get('/api/scheduling/student-requests/:id', isAuthenticated, 
    (req, res) => studentRequestController.getRequestById(req, res));
  
  // Get requests by a specific student
  app.get('/api/scheduling/student-requests/student/:studentId', isAuthenticated, 
    (req, res) => studentRequestController.getRequestsByStudent(req, res));
  
  // Get requests by status
  app.get('/api/scheduling/student-requests/status/:status', isAuthenticated, hasRole(['admin']), 
    (req, res) => studentRequestController.getRequestsByStatus(req, res));
  
  // Create a student request (students and admin)
  app.post('/api/scheduling/student-requests', isAuthenticated, hasRole(['student', 'admin']), 
    (req, res) => studentRequestController.createRequest(req, res));
  
  // Process a student request (admin-only)
  app.post('/api/scheduling/student-requests/:id/process', isAuthenticated, hasRole(['admin']), 
    (req, res) => studentRequestController.processRequest(req, res));
  
  // Update a student request (admin-only)
  app.put('/api/scheduling/student-requests/:id', isAuthenticated, hasRole(['admin']), 
    (req, res) => studentRequestController.updateRequest(req, res));
  
  // Delete a student request (admin-only)
  app.delete('/api/scheduling/student-requests/:id', isAuthenticated, hasRole(['admin']), 
    (req, res) => studentRequestController.deleteRequest(req, res));
  
  // Scheduling System - Cancellation API routes
  
  // Get all cancellation requests (admin-only)
  app.get('/api/scheduling/cancellations', isAuthenticated, hasRole(['admin']), 
    (req, res) => cancellationController.getAllCancellationRequests(req, res));
  
  // Get a cancellation request by ID
  app.get('/api/scheduling/cancellations/:id', isAuthenticated, 
    (req, res) => cancellationController.getCancellationRequestById(req, res));
  
  // Get cancellation requests by a specific therapist
  app.get('/api/scheduling/cancellations/therapist/:therapistId', isAuthenticated, 
    (req, res) => cancellationController.getCancellationRequestsByTherapist(req, res));
  
  // Create a cancellation request (therapists and admin)
  app.post('/api/scheduling/cancellations', isAuthenticated, hasRole(['therapist', 'admin']), 
    (req, res) => cancellationController.createCancellationRequest(req, res));
  
  // Process a cancellation request (admin-only)
  app.post('/api/scheduling/cancellations/:id/process', isAuthenticated, hasRole(['admin']), 
    (req, res) => cancellationController.processCancellationRequest(req, res));
  
  // Update a cancellation request (admin-only)
  app.put('/api/scheduling/cancellations/:id', isAuthenticated, hasRole(['admin']), 
    (req, res) => cancellationController.updateCancellationRequest(req, res));
  
  // Delete a cancellation request (admin-only)
  app.delete('/api/scheduling/cancellations/:id', isAuthenticated, hasRole(['admin']), 
    (req, res) => cancellationController.deleteCancellationRequest(req, res));
  
  // Scheduling System - Scheduler API routes
  
  // Process therapist availability submission (admin-only)
  app.post('/api/scheduling/process-therapist-availability', isAuthenticated, hasRole(['admin']), 
    (req, res) => schedulerController.processTherapistAvailability(req, res));
  
  // Process student request (admin-only)
  app.post('/api/scheduling/process-student-request', isAuthenticated, hasRole(['admin']), 
    (req, res) => schedulerController.processStudentRequest(req, res));
  
  // Process therapist cancellation (admin-only)
  app.post('/api/scheduling/process-therapist-cancellation', isAuthenticated, hasRole(['admin']), 
    (req, res) => schedulerController.processTherapistCancellation(req, res));
  
  // Manually assign a student to a slot (admin-only)
  app.post('/api/scheduling/manually-assign-slot/:slotId', isAuthenticated, hasRole(['admin']), 
    (req, res) => schedulerController.manuallyAssignSlot(req, res));
  
  // Generate weekly schedule (admin-only)
  app.get('/api/scheduling/weekly-schedule/:startDate', isAuthenticated, hasRole(['admin']), 
    (req, res) => schedulerController.generateWeeklySchedule(req, res));
  
  // Process all pending student requests (admin-only)
  app.post('/api/scheduling/process-pending-requests', isAuthenticated, hasRole(['admin']), 
    (req, res) => schedulerController.processPendingStudentRequests(req, res));

  const httpServer = createServer(app);
  return httpServer;
}

// Using Groq AI service instead of simulation function
