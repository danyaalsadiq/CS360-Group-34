import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertAppointmentSchema, insertFeedbackSchema, insertForumPostSchema, insertForumCommentSchema, insertChatMessageSchema, insertResourceSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { generateAIResponse } from "./ai-service";
import { format } from "date-fns";
import {
  getSlots,
  getSlotById,
  markAvailability,
  cancelSlot,
  requestAppointment,
  assignStudentToSlot,
  markSlotCompleted
} from './controllers/slot-functions';
import { adminAssignStudent } from './controllers/admin-slot-controller';
import { SlotModel } from './models/slot';
import { StudentRequestModel } from './models/student-request';
import { setupWebSocketServer, sendNotificationToUser } from './websocket';
import { NotificationService } from './services/notification-service';
import { NotificationModel } from './models/notification';
import { ForumCommentModel, UserModel, FeedbackModel } from './models';

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Initialize services
  const notificationService = new NotificationService();

  // No controller initialization needed - using imported functions directly

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
  // User management endpoints
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
  
  app.get("/api/users/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password field to client
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.post("/api/users", hasRole(["admin"]), async (req, res) => {
    try {
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(req.body);
      
      // Don't send password back in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.patch("/api/users/:id", hasRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user" });
      }
      
      // Don't send password back in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  app.delete("/api/users/:id", hasRole(["admin"]), async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Prevent deletion of the current user or the default admin
      if (req.user.id === userId) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }
      
      if (user.username === "admin") {
        return res.status(400).json({ message: "Cannot delete the default admin account" });
      }
      
      const result = await storage.deleteUser(userId);
      
      if (!result) {
        return res.status(500).json({ message: "Failed to delete user" });
      }
      
      res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
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
    try {
      // If no therapistId provided and user is a therapist, use their ID
      let therapistId = req.query.therapistId as string;
      
      if (!therapistId && req.user?.role === "therapist") {
        therapistId = req.user.id.toString();
        console.log("No therapistId provided, using current user ID:", therapistId);
      } else if (!therapistId && req.user?.role === "admin") {
        // For admins with no specific therapist ID, return empty array
        console.log("Admin requesting feedback with no therapistId parameter");
        return res.json([]);
      } else if (!therapistId) {
        return res.status(400).json({ message: "Therapist ID is required" });
      }
      
      if (req.user!.role === "therapist" && therapistId !== req.user!.id.toString()) {
        return res.status(403).json({ message: "You can only view your own feedback" });
      }
      
      console.log("Fetching feedback for therapist ID:", therapistId);
      
      // Get feedback for this therapist from MongoDB
      const feedbackList = await storage.listFeedbackByTherapist(therapistId);
      console.log(`Found ${feedbackList.length} feedback entries for therapistId ${therapistId}`);
      
      // Fetch appointment and student details for each feedback
      const feedbackWithDetails = await Promise.all(feedbackList.map(async feedback => {
        console.log("Processing feedback ID:", feedback.id, "AppointmentId:", feedback.appointmentId);
        
        let appointment = null;
        let student = null;
        
        try {
          // First try to get the appointment
          appointment = await storage.getAppointment(parseInt(feedback.appointmentId));
          console.log("Appointment found:", !!appointment);
          
          // If appointment exists, get the student
          if (appointment) {
            student = await storage.getUser(parseInt(appointment.studentId));
            console.log("Student found:", !!student);
          }
        } catch (error) {
          console.error("Error fetching appointment or student details:", error);
        }
        
        return {
          ...feedback,
          appointment: appointment ? {
            id: appointment.id,
            date: appointment.date,
            status: appointment.status,
          } : { 
            id: parseInt(feedback.appointmentId),
            date: "Unknown date",
            status: "unknown"
          },
          student: student ? {
            id: student.id,
            name: student.name,
            profileImage: student.profileImage,
          } : {
            id: parseInt(feedback.studentId || "0"),
            name: "Unknown student",
            profileImage: undefined
          },
        };
      }));
      
      res.json(feedbackWithDetails);
    } catch (error) {
      console.error("Error in feedback API:", error);
      res.status(500).json({ message: "Error fetching feedback", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // This route was removed to fix the feedback submission process
  // The new implementation below handles slot-based feedback instead of requiring appointment records

  // Feedback routes
  app.post('/api/feedback', isAuthenticated, async (req, res) => {
    try {
      // Only students can submit feedback
      if (req.user?.role !== 'student' && req.user?.role !== 'admin') {
        console.log('User role check failed:', req.user?.role);
        return res.status(403).json({ error: 'Only students can submit feedback' });
      }
      
      console.log('Receiving feedback submission with body:', req.body);
      console.log('User submitting feedback:', {
        id: req.user?.id,
        role: req.user?.role,
        username: req.user?.username
      });
      
      const appointmentId = req.body.appointmentId;
      const therapistId = req.body.therapistId;
      const studentId = req.user?.role === 'student' ? req.user?.id.toString() : req.body.studentId;
      
      if (!appointmentId) {
        return res.status(400).json({ error: 'Appointment ID is required' });
      }
      
      if (!therapistId) {
        return res.status(400).json({ error: 'Therapist ID is required' });
      }
      
      // Check if the student has already submitted feedback for this appointment
      const existingFeedback = await storage.listFeedbackByAppointment(appointmentId);
      if (existingFeedback) {
        return res.status(400).json({ 
          error: 'You have already submitted feedback for this appointment',
          existingFeedback
        });
      }
      
      // Instead of requiring an appointment record, we'll directly use the provided IDs
      // This handles slots that don't have traditional appointment records
      const feedbackData = {
        appointmentId,
        studentId,
        therapistId,
        rating: parseInt(req.body.rating, 10), 
        comments: req.body.comments || '' // Using comments consistently throughout the application
      };
      
      console.log('Prepared feedback data:', feedbackData);
      
      // Save the feedback in the database
      const feedback = await storage.createFeedback(feedbackData);
      console.log('Feedback saved successfully:', feedback);
      
      // Mark the slot as "completed" based on appointment ID
      try {
        // Attempt to find the slot by ID and update its status
        const slot = await SlotModel.findById(appointmentId);
        if (slot) {
          slot.status = 'completed';
          await slot.save();
          console.log('Slot status updated to "completed"');
        } else {
          console.log('No slot found with ID:', appointmentId);
        }
      } catch (slotError) {
        console.error('Error updating slot status:', slotError);
        // We'll still return success, even if the slot status update fails
      }
      
      // Notify the therapist about the new feedback
      try {
        await notificationService.createNotification({
          userId: therapistId,
          type: 'system', // Using system as the notification type for feedback
          title: 'New Feedback Received',
          message: `A student has left you a ${feedback.rating}-star rating with feedback`,
          relatedId: appointmentId, // Using the appointment/slot ID as the related ID
          isRead: false,
        });
      } catch (notifyError) {
        console.error('Failed to send feedback notification:', notifyError);
      }
      
      res.status(201).json(feedback);
    } catch (error) {
      console.error('Error creating feedback:', error);
      res.status(500).json({ message: 'Failed to create feedback', error: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.get('/api/feedback/therapist/:therapistId', isAuthenticated, async (req, res) => {
    try {
      const { therapistId } = req.params;
      
      // Admins and the specific therapist can view their feedback
      if (req.user?.role !== 'admin' && 
          (req.user?.role !== 'therapist' || req.user?.id.toString() !== therapistId)) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Get all feedback for this therapist directly using the model for simplicity
      const feedbacks = await FeedbackModel.find({ therapistId }).sort({ createdAt: -1 });
      console.log(`Found ${feedbacks.length} feedback items for therapist ${therapistId}`);
      
      // Use a simplified approach without complex error-prone lookups
      const simplifiedFeedback = feedbacks.map(feedback => {
        return {
          id: feedback._id.toString(),
          appointmentId: feedback.appointmentId,
          studentId: feedback.studentId,
          therapistId: feedback.therapistId,
          rating: feedback.rating,
          comments: feedback.comments || "",
          createdAt: feedback.createdAt,
          // Include basic fields needed for display
          studentName: "Student",
          appointmentDate: new Date().toISOString().split('T')[0], // Just use today's date
          appointmentStatus: "completed"
        };
      });
      
      res.json(simplifiedFeedback);
    } catch (error) {
      console.error('Error listing therapist feedback:', error);
      res.status(500).json({ error: 'Failed to list feedback' });
    }
  });
  
  // Get feedback provided by a student
  app.get('/api/feedback/student', isAuthenticated, async (req, res) => {
    try {
      // Only allow students to view their own feedback
      if (req.user?.role !== 'student' && req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      const studentId = req.user?.id.toString();
      console.log('Fetching feedback for student ID:', studentId);
      
      // Find all feedback submitted by this student
      const feedbacks = await FeedbackModel.find({ studentId }).sort({ createdAt: -1 });
      console.log('Found feedback count:', feedbacks.length);
      
      // Simpler processing to avoid potential issues
      const feedbackWithDetails = await Promise.all(feedbacks.map(async feedback => {
        // Safely get the feedback ID
        const feedbackId = feedback._id ? feedback._id.toString() : '';
        
        let therapistName = "Unknown therapist";
        let appointmentDate = "Unknown date";
        
        try {
          // Simple therapist lookup
          if (feedback.therapistId) {
            const therapist = await UserModel.findById(feedback.therapistId);
            if (therapist) {
              therapistName = therapist.name || "Unknown therapist";
            }
          }
          
          // Get appointment date (from slot or appointment)
          if (feedback.appointmentId) {
            try {
              const slot = await SlotModel.findById(feedback.appointmentId);
              if (slot) {
                appointmentDate = slot.date || "Unknown date";
              }
            } catch (err) {
              console.log('Error finding slot');
            }
          }
        } catch (err) {
          console.error('Error enhancing feedback:', err);
        }
        
        // Return simplified object
        return {
          id: feedbackId,
          rating: feedback.rating,
          comments: feedback.comments || "",
          createdAt: feedback.createdAt,
          appointment: {
            date: appointmentDate
          },
          therapist: {
            name: therapistName
          }
        };
      }));
      
      res.json(feedbackWithDetails);
    } catch (error) {
      console.error('Error listing student feedback:', error);
      res.status(500).json({ error: 'Failed to list feedback' });
    }
  });
  
  app.get('/api/feedback/appointment/:appointmentId', isAuthenticated, async (req, res) => {
    try {
      const { appointmentId } = req.params;
      console.log('Fetching feedback for appointment:', appointmentId);
      
      // Find feedback for this appointment
      const feedback = await storage.listFeedbackByAppointment(appointmentId);
      
      if (!feedback) {
        return res.status(404).json({ error: 'No feedback found for this appointment' });
      }
      
      console.log('Found feedback:', { 
        id: feedback.id, 
        studentId: feedback.studentId, 
        therapistId: feedback.therapistId 
      });
      
      // Ensure only admin, the student who gave feedback, or the therapist who received it can view it
      if (req.user?.role !== 'admin' && 
          req.user?.id.toString() !== feedback.studentId &&
          req.user?.id.toString() !== feedback.therapistId) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      // Get related entities
      let appointment = null;
      let student = null;
      let therapist = null;
      
      try {
        if (feedback.appointmentId) {
          appointment = await storage.getAppointment(parseInt(feedback.appointmentId));
        }
        
        if (feedback.studentId) {
          student = await storage.getUser(parseInt(feedback.studentId));
        }
        
        if (feedback.therapistId) {
          therapist = await storage.getUser(parseInt(feedback.therapistId));
        }
      } catch (err) {
        console.error('Error fetching related entities:', err);
      }
      
      // Return enriched feedback
      const enrichedFeedback = {
        ...feedback,
        appointment: appointment ? {
          id: appointment.id,
          date: appointment.date,
          status: appointment.status,
        } : { 
          id: parseInt(feedback.appointmentId),
          date: "Unknown date",
          status: "unknown"
        },
        student: student ? {
          id: student.id,
          name: student.name,
          profileImage: student.profileImage,
        } : {
          id: parseInt(feedback.studentId || "0"),
          name: "Unknown student",
          profileImage: undefined
        },
        therapist: therapist ? {
          id: therapist.id,
          name: therapist.name,
          profileImage: therapist.profileImage,
        } : {
          id: parseInt(feedback.therapistId || "0"),
          name: "Unknown therapist",
          profileImage: undefined
        },
      };
      
      res.json(enrichedFeedback);
    } catch (error) {
      console.error('Error getting appointment feedback:', error);
      res.status(500).json({ error: 'Failed to get feedback', details: error instanceof Error ? error.message : String(error) });
    }
  });

  // Forum routes
  app.get("/api/forum/posts", isAuthenticated, async (req, res) => {
    try {
      let posts;
      // If category is provided, filter by category
      if (req.query.category) {
        posts = await storage.listForumPostsByCategory(req.query.category as string);
      } else {
        posts = await storage.listForumPosts();
      }
      
      // Fetch user details and comment counts for each post
      const postsWithDetails = await Promise.all(posts.map(async post => {
        const user = await storage.getUser(parseInt(post.userId));
        const comments = await storage.listCommentsByPost(post.id);
        
        // Check if current user has liked this post
        const hasLiked = post.likes.includes(req.user!.id.toString());
        
        return {
          ...post,
          user: post.userName ? { 
            id: user?.id || parseInt(post.userId), 
            name: user?.name || post.userName,
            role: user?.role || "unknown",
            profileImage: user?.profileImage,
          } : null,
          commentCount: comments.length,
          hasLiked
        };
      }));
      
      res.json(postsWithDetails);
    } catch (error) {
      console.error("Error fetching forum posts:", error);
      res.status(500).json({ message: "Failed to fetch forum posts" });
    }
  });

  app.get("/api/forum/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getForumPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const user = await storage.getUser(parseInt(post.userId));
      const comments = await storage.listCommentsByPost(post.id);
      const hasLiked = post.likes.includes(req.user!.id.toString());
      
      const postWithDetails = {
        ...post,
        user: post.userName ? { 
          id: user?.id || parseInt(post.userId), 
          name: user?.name || post.userName,
          role: user?.role || "unknown",
          profileImage: user?.profileImage,
        } : null,
        commentCount: comments.length,
        hasLiked
      };
      
      res.json(postWithDetails);
    } catch (error) {
      console.error("Error fetching forum post:", error);
      res.status(500).json({ message: "Failed to fetch forum post" });
    }
  });

  app.post("/api/forum/posts", isAuthenticated, async (req, res) => {
    try {
      // Get the current user
      const userId = req.user!.id.toString();
      const user = await storage.getUser(req.user!.id);
      
      // Create post data with user information
      const postData = {
        ...req.body,
        userId,
        userName: req.body.isAnonymous ? undefined : user?.name,
        category: req.body.category || "General",
        likes: [],
        isReported: false,
        isDeleted: false
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

  app.delete("/api/forum/posts/:id", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getForumPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Only allow admins or the post creator to delete
      if (req.user!.role !== "admin" && post.userId !== req.user!.id.toString()) {
        return res.status(403).json({ message: "Unauthorized to delete this post" });
      }
      
      const success = await storage.deleteForumPost(postId);
      if (success) {
        res.status(200).json({ message: "Post deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete post" });
      }
    } catch (error) {
      console.error("Error deleting forum post:", error);
      res.status(500).json({ message: "Failed to delete post" });
    }
  });

  app.post("/api/forum/posts/:id/like", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user!.id.toString();
      
      const updatedPost = await storage.likeForumPost(postId, userId);
      
      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.status(200).json(updatedPost);
    } catch (error) {
      console.error("Error liking forum post:", error);
      res.status(500).json({ message: "Failed to like post" });
    }
  });

  app.post("/api/forum/posts/:id/report", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.id;
      const userId = req.user!.id.toString();
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({ message: "Report reason is required" });
      }
      
      const updatedPost = await storage.reportForumPost(postId, userId, reason);
      
      if (!updatedPost) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      res.status(200).json(updatedPost);
    } catch (error) {
      console.error("Error reporting forum post:", error);
      res.status(500).json({ message: "Failed to report post" });
    }
  });

  app.get("/api/forum/posts/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getForumPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comments = await storage.listCommentsByPost(postId);
      
      // Fetch user details for each comment
      const commentsWithDetails = await Promise.all(comments.map(async comment => {
        const user = await storage.getUser(parseInt(comment.userId));
        // Check if current user has liked this comment
        const hasLiked = comment.likes.includes(req.user!.id.toString());
        
        return {
          ...comment,
          user: comment.userName ? { 
            id: user?.id || parseInt(comment.userId), 
            name: user?.name || comment.userName,
            role: user?.role || "unknown",
            profileImage: user?.profileImage,
          } : null,
          hasLiked
        };
      }));
      
      res.json(commentsWithDetails);
    } catch (error) {
      console.error("Error fetching forum comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  // Report a forum comment
  app.post("/api/forum/comments/:id/report", isAuthenticated, async (req, res) => {
    try {
      const commentId = req.params.id;
      const { reason } = req.body;
      const userId = String(req.user!.id);
      
      if (!reason) {
        return res.status(400).json({ message: "Report reason is required" });
      }
      
      // Find the comment
      const comment = await ForumCommentModel.findById(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Update the comment to mark it as reported
      comment.isReported = true;
      comment.reportReason = reason;
      comment.reportedBy = userId;
      comment.updatedAt = new Date();
      
      await comment.save();
      
      // Convert the Mongoose document to a plain object
      const updatedComment = {
        id: comment._id.toString(),
        postId: comment.postId,
        content: comment.content,
        userId: comment.userId,
        userName: comment.userName,
        likes: comment.likes,
        isReported: comment.isReported,
        reportReason: comment.reportReason,
        reportedBy: comment.reportedBy,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isDeleted: comment.isDeleted
      };
      
      res.status(200).json(updatedComment);
    } catch (error) {
      console.error("Error reporting forum comment:", error);
      res.status(500).json({ message: "Failed to report comment" });
    }
  });
  
  // Like a comment
  app.post("/api/forum/comments/:id/like", isAuthenticated, async (req, res) => {
    try {
      const commentId = req.params.id;
      const userId = req.user!.id.toString();
      
      // Find the comment
      const comment = await ForumCommentModel.findById(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Check if user already liked the comment
      const userLikedIndex = comment.likes.indexOf(userId);
      
      if (userLikedIndex === -1) {
        // User hasn't liked the comment, add like
        comment.likes.push(userId);
      } else {
        // User already liked the comment, remove like
        comment.likes.splice(userLikedIndex, 1);
      }
      
      comment.updatedAt = new Date();
      await comment.save();
      
      // Convert the Mongoose document to a plain object and add hasLiked flag
      const updatedComment = {
        id: comment._id.toString(),
        postId: comment.postId,
        content: comment.content,
        userId: comment.userId,
        userName: comment.userName,
        likes: comment.likes,
        isReported: comment.isReported,
        reportReason: comment.reportReason,
        reportedBy: comment.reportedBy,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isDeleted: comment.isDeleted,
        hasLiked: comment.likes.includes(userId)
      };
      
      // Get user details to include in response
      const user = await storage.getUser(parseInt(comment.userId));
      
      const commentWithUser = {
        ...updatedComment,
        user: comment.userName ? { 
          id: user?.id || parseInt(comment.userId), 
          name: user?.name || comment.userName,
          role: user?.role || "unknown",
          profileImage: user?.profileImage,
        } : null
      };
      
      res.status(200).json(commentWithUser);
    } catch (error) {
      console.error("Error liking forum comment:", error);
      res.status(500).json({ message: "Failed to like comment" });
    }
  });
  
  // Delete a comment (by owner or admin)
  app.delete("/api/forum/comments/:id", isAuthenticated, async (req, res) => {
    try {
      const commentId = req.params.id;
      const deleteReason = req.query.reason?.toString() || "";
      
      // Find the comment
      const comment = await ForumCommentModel.findById(commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Only allow admins or the comment creator to delete
      if (req.user!.role !== "admin" && comment.userId !== req.user!.id.toString()) {
        return res.status(403).json({ message: "Unauthorized to delete this comment" });
      }
      
      // Mark the comment as deleted rather than actually deleting it
      comment.isDeleted = true;
      comment.isReported = false; // Remove from reported items when deleted
      comment.reportReason = ""; // Clear the report reason
      comment.content = "[deleted]" + (deleteReason ? ` - ${deleteReason}` : "");
      comment.updatedAt = new Date();
      
      // Save the updated comment
      await comment.save();
      
      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting forum comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });
  
  app.post("/api/forum/posts/:id/comments", isAuthenticated, async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getForumPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Get the current user
      const userId = req.user!.id.toString();
      const user = await storage.getUser(req.user!.id);
      
      // Create comment data with user information
      const commentData = {
        ...req.body,
        postId,
        userId,
        userName: req.body.isAnonymous ? undefined : user?.name,
        likes: [],
        isReported: false,
        isDeleted: false
      };
      
      const comment = await storage.createForumComment(commentData);
      
      // Return the comment with user details and hasLiked flag
      const commentWithDetails = {
        ...comment,
        user: comment.userName ? { 
          id: user?.id || parseInt(comment.userId), 
          name: user?.name || comment.userName,
          role: user?.role || "unknown",
          profileImage: user?.profileImage,
        } : null,
        hasLiked: false
      };
      
      res.status(201).json(commentWithDetails);
    } catch (error) {
      console.error("Error creating forum comment:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    }
  });

  // Admin forum moderation routes
  app.get("/api/admin/forum/reported", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const posts = await storage.listForumPosts();
      const reportedPosts = posts.filter(post => post.isReported);
      
      // Fetch user details for each post
      const postsWithDetails = await Promise.all(reportedPosts.map(async post => {
        const user = await storage.getUser(parseInt(post.userId));
        const comments = await storage.listCommentsByPost(post.id);
        
        return {
          ...post,
          user: post.userName ? { 
            id: user?.id || parseInt(post.userId), 
            name: user?.name || post.userName,
            role: user?.role || "unknown",
            profileImage: user?.profileImage,
          } : null,
          commentCount: comments.length
        };
      }));
      
      res.json(postsWithDetails);
    } catch (error) {
      console.error("Error fetching reported posts:", error);
      res.status(500).json({ message: "Failed to fetch reported posts" });
    }
  });
  
  // Get reported comments (admin only)
  app.get("/api/admin/forum/reported-comments", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const posts = await storage.listForumPosts();
      
      let reportedComments = [];
      
      // For each post, get comments and filter for reported ones
      for (const post of posts) {
        const comments = await storage.listCommentsByPost(post.id);
        const postReportedComments = comments.filter(comment => comment.isReported);
        
        // For each reported comment, add post info and user info
        for (const comment of postReportedComments) {
          const user = await storage.getUser(parseInt(comment.userId));
          
          reportedComments.push({
            ...comment,
            user: comment.userName ? { 
              id: user?.id || parseInt(comment.userId), 
              name: user?.name || comment.userName,
              role: user?.role || "unknown",
              profileImage: user?.profileImage,
            } : null,
            post: {
              id: post.id,
              title: post.title,
              content: post.content
            }
          });
        }
      }
      
      res.json(reportedComments);
    } catch (error) {
      console.error("Error fetching reported comments:", error);
      res.status(500).json({ message: "Failed to fetch reported comments" });
    }
  });
  
  // Approve a reported post (admin only)
  app.post("/api/admin/forum/posts/:id/approve", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const postId = req.params.id;
      const post = await storage.getForumPost(postId);
      
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Update post to remove the reported status
      const updatedPost = await storage.updateForumPost(postId, {
        isReported: false,
        reportReason: undefined,
        reportedBy: undefined
      });
      
      if (!updatedPost) {
        return res.status(500).json({ message: "Failed to approve post" });
      }
      
      res.status(200).json(updatedPost);
    } catch (error) {
      console.error("Error approving forum post:", error);
      res.status(500).json({ message: "Failed to approve post" });
    }
  });
  
  // Approve a reported comment (admin only)
  app.post("/api/admin/forum/comments/:id/approve", isAuthenticated, hasRole(["admin"]), async (req, res) => {
    try {
      const commentId = req.params.id;
      
      // First get all posts to find the post with this comment
      const posts = await storage.listForumPosts();
      let foundComment = null;
      let commentPost = null;
      
      // Search for the comment in each post's comments
      for (const post of posts) {
        const comments = await storage.listCommentsByPost(post.id);
        const comment = comments.find(c => c.id === commentId);
        
        if (comment) {
          foundComment = comment;
          commentPost = post;
          break;
        }
      }
      
      if (!foundComment || !commentPost) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Update comment to remove the reported status
      // Since we don't have a direct updateComment function, we'll need to use MongoDB's model functions
      const result = await ForumCommentModel.findByIdAndUpdate(
        commentId,
        { $set: { isReported: false, reportReason: null, reportedBy: null } },
        { new: true }
      );
      
      if (!result) {
        return res.status(500).json({ message: "Failed to approve comment" });
      }
      
      const updatedComment = {
        id: result._id.toString(),
        postId: result.postId,
        content: result.content,
        userId: result.userId,
        userName: result.userName,
        likes: result.likes,
        isReported: result.isReported,
        reportReason: result.reportReason,
        reportedBy: result.reportedBy,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
        isDeleted: result.isDeleted
      };
      
      res.status(200).json(updatedComment);
    } catch (error) {
      console.error("Error approving forum comment:", error);
      res.status(500).json({ message: "Failed to approve comment" });
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
  
  // Get slots for a date range
  app.get('/api/slots', isAuthenticated, getSlots);
  
  // Get single slot by ID
  app.get('/api/slots/:id', isAuthenticated, getSlotById);
  
  // Therapist marks availability (admins can also use this endpoint)
  app.post('/api/slots/therapist/availability', isAuthenticated, hasRole(['therapist', 'admin']), markAvailability);
  
  // Cancel a slot
  app.post('/api/slots/:id/cancel', isAuthenticated, cancelSlot);
  
  // Student requests an appointment (admins can also use this endpoint)
  app.post('/api/slots/student/request', isAuthenticated, hasRole(['student', 'admin']), requestAppointment);
  
  // Student requests alternative slot (when a slot is already booked) - admin can also use
  app.post('/api/slots/student/request-alternative', isAuthenticated, hasRole(['student', 'admin']), async (req, res) => {
    try {
      const { preferred_therapist_id, option, student_id } = req.body;
      
      // Get student info - either from request body (admin) or authenticated user (student)
      let studentId = req.user!.id.toString();
      let studentName = req.user!.name;
      
      // If admin is requesting on behalf of a student
      if (req.user!.role === 'admin' && student_id) {
        // Try to get the student's info
        try {
          const student = await UserModel.findById(student_id);
          if (student) {
            studentId = student_id;
            studentName = student.name;
          }
        } catch (error) {
          console.error('Error fetching student info:', error);
        }
      }
      
      // If user chose to pick another slot manually, just acknowledge
      if (option === 'other') {
        return res.status(200).json({
          match_status: 'pending',
          message: 'You can select another slot from the calendar.'
        });
      }
      
      // Otherwise find an alternative slot
      if (option === 'auto') {
        // First, check for slots from the preferred therapist
        let matchingSlot = null;
        
        if (preferred_therapist_id) {
          matchingSlot = await SlotModel.findOne({
            therapist_id: preferred_therapist_id,
            status: 'available',
            student_id: { $exists: false }
          }).sort({ date: 1, start_time: 1 });
        }
        
        if (matchingSlot) {
          // Book the slot with student information
          matchingSlot.student_id = studentId;
          matchingSlot.student_name = studentName;
          matchingSlot.status = 'booked';
          await matchingSlot.save();
          
          // Also create a student request to record the preference
          await StudentRequestModel.create({
            student_id: studentId,
            student_name: studentName,
            preferred_days: [matchingSlot.day],
            preferred_times: [matchingSlot.start_time],
            preferred_therapist_id,
            status: 'assigned',
            assigned_slot_id: matchingSlot._id.toString(),
            notes: 'Auto-matched through alternative slot request'
          });
          
          return res.status(200).json({
            match_status: 'matched',
            message: `You've been matched with ${matchingSlot.therapist_name} on ${format(new Date(matchingSlot.date), 'EEEE, MMMM d')} at ${matchingSlot.start_time}.`,
            therapist_name: matchingSlot.therapist_name,
            therapist_id: matchingSlot.therapist_id,
            date: matchingSlot.date,
            start_time: matchingSlot.start_time,
            end_time: matchingSlot.end_time,
            slot_id: matchingSlot._id
          });
        } else {
          // If no slots available with the preferred therapist, look for any available slot
          const alternateSlot = await SlotModel.findOne({
            status: 'available',
            student_id: { $exists: false }
          }).sort({ date: 1, start_time: 1 });
          
          if (alternateSlot) {
            // Book the alternative slot
            alternateSlot.student_id = studentId;
            alternateSlot.student_name = studentName;
            alternateSlot.status = 'booked';
            await alternateSlot.save();
            
            // Also create a student request to record the preference
            await StudentRequestModel.create({
              student_id: studentId,
              student_name: studentName,
              preferred_days: [alternateSlot.day],
              preferred_times: [alternateSlot.start_time],
              preferred_therapist_id: alternateSlot.therapist_id,
              status: 'assigned',
              assigned_slot_id: alternateSlot._id.toString(),
              notes: 'Auto-matched through alternative slot request (any therapist)'
            });
            
            return res.status(200).json({
              match_status: 'matched',
              message: `You've been matched with ${alternateSlot.therapist_name} on ${format(new Date(alternateSlot.date), 'EEEE, MMMM d')} at ${alternateSlot.start_time}.`,
              therapist_name: alternateSlot.therapist_name,
              therapist_id: alternateSlot.therapist_id,
              date: alternateSlot.date,
              start_time: alternateSlot.start_time,
              end_time: alternateSlot.end_time,
              slot_id: alternateSlot._id
            });
          } else {
            // No slots available at all
            return res.status(200).json({
              match_status: 'no_match',
              message: 'No available slots were found. Please try selecting a different therapist or check back later.'
            });
          }
        }
      }
      
      // Invalid option
      return res.status(400).json({ message: 'Invalid option selected' });
    } catch (error) {
      console.error('Error requesting alternative slot:', error);
      res.status(500).json({ message: 'Failed to find alternative slot' });
    }
  });
  
  // Admin assigns student to slot (admin-only)
  app.post('/api/slots/admin/assign', isAuthenticated, hasRole(['admin']), adminAssignStudent);
  
  // Mark a slot as completed (for past slots)
  app.post('/api/slots/:id/complete', isAuthenticated, markSlotCompleted);
  
  // Get student requests by slot ID (for waitlist display)
  app.get('/api/student-requests', isAuthenticated, async (req, res) => {
    try {
      const { slot_id, student_id } = req.query;
      
      let query: any = {};
      
      // If slot_id is provided, find requests with that slot ID
      if (slot_id) {
        query.assigned_slot_id = slot_id;
      }
      
      // If student_id is provided, find requests for that student
      if (student_id) {
        query.student_id = student_id;
      }
      
      // Students can only see their own requests
      if (req.user?.role === 'student') {
        query.student_id = req.user.id.toString();
      }
      
      const requests = await StudentRequestModel.find(query);
      return res.status(200).json(requests);
    } catch (error) {
      console.error('Error fetching student requests:', error);
      res.status(500).json({ message: 'Failed to fetch student requests' });
    }
  });

  // Delete a waitlisted slot directly
  app.delete('/api/slots/waitlist/:slotId', isAuthenticated, async (req, res) => {
    try {
      const slotId = req.params.slotId;
      
      // Only students can cancel their own waitlisted slots
      if (req.user?.role !== 'student') {
        return res.status(403).json({ message: 'Only students can cancel waitlisted slots' });
      }
      
      const studentId = req.user.id.toString();
      
      // Find the waitlisted slot
      const slot = await SlotModel.findOne({
        _id: slotId,
        status: 'waitlisted',
        student_id: studentId
      });
      
      if (!slot) {
        return res.status(404).json({ message: 'Waitlisted slot not found or not owned by you' });
      }
      
      // Delete the slot
      await SlotModel.deleteOne({ _id: slotId });
      
      // Also delete any associated student requests
      await StudentRequestModel.deleteMany({ 
        student_id: studentId,
        slot_id: slotId
      });
      
      return res.status(200).json({ message: 'Successfully removed from waitlist' });
      
    } catch (error) {
      console.error('Error cancelling waitlisted slot:', error);
      res.status(500).json({ message: 'Failed to cancel waitlisted slot' });
    }
  });

  // Delete/drop a student request (used for waitlist dropouts)
  app.delete('/api/student-requests/:id', isAuthenticated, async (req, res) => {
    try {
      const requestId = req.params.id;
      
      // Only students can drop themselves from the waitlist
      if (req.user?.role !== 'student') {
        return res.status(403).json({ message: 'Only students can drop from waitlist' });
      }
      
      // Verify this is the student's own request
      const studentId = req.user.id.toString();
      const studentRequest = await StudentRequestModel.findById(requestId);
      
      if (!studentRequest) {
        return res.status(404).json({ message: 'Request not found' });
      }
      
      if (studentRequest.student_id !== studentId) {
        return res.status(403).json({ message: 'You can only drop your own requests' });
      }
      
      // Delete the request
      await StudentRequestModel.findByIdAndDelete(requestId);
      
      return res.status(200).json({ 
        message: 'Successfully dropped from waitlist',
        success: true
      });
    } catch (error) {
      console.error('Error dropping from waitlist:', error);
      res.status(500).json({ message: 'Failed to drop from waitlist' });
    }
  });
  
  // Alternative endpoint for canceling waitlisted slots
  app.delete('/api/slots/waitlist/:id', isAuthenticated, async (req, res) => {
    try {
      const slotId = req.params.id;
      
      // Only students can cancel their waitlisted slots
      if (req.user?.role !== 'student') {
        return res.status(403).json({ message: 'Only students can cancel waitlisted slots' });
      }
      
      const studentId = req.user.id.toString();
      
      // First try to find it as a student request
      const studentRequest = await StudentRequestModel.findById(slotId);
      
      if (studentRequest) {
        // Check if this is the student's own request
        if (studentRequest.student_id !== studentId) {
          return res.status(403).json({ message: 'You can only cancel your own waitlisted slots' });
        }
        
        // Delete the request
        await StudentRequestModel.findByIdAndDelete(slotId);
        
        return res.status(200).json({ 
          message: 'Successfully cancelled waitlisted slot',
          success: true
        });
      }
      
      // If not found as a student request, try to find as a virtual waitlisted slot
      // by querying student requests with matching criteria
      const waitingRequest = await StudentRequestModel.findOne({
        student_id: studentId,
        waiting_for_therapist: true,
        status: 'waiting'
      });
      
      if (waitingRequest) {
        // Delete the request
        await StudentRequestModel.findByIdAndDelete(waitingRequest._id);
        
        return res.status(200).json({ 
          message: 'Successfully cancelled waitlisted slot',
          success: true
        });
      }
      
      return res.status(404).json({ message: 'Waitlisted slot not found' });
    } catch (error) {
      console.error('Error cancelling waitlisted slot:', error);
      res.status(500).json({ message: 'Failed to cancel waitlisted slot' });
    }
  });

  // Notification API Routes
  // Get all notifications for the current user
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id.toString();
      const notifications = await notificationService.getNotificationsByUserId(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Get unread notification count for the current user
  app.get('/api/notifications/unread-count', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id.toString();
      const count = await notificationService.getUnreadNotificationsCount(userId);
      res.json({ count });
    } catch (error: any) {
      console.error('Error counting unread notifications:', error);
      res.status(500).json({ message: 'Failed to count unread notifications' });
    }
  });

  // Mark a notification as read
  app.patch('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const notificationId = req.params.id;
      const notification = await NotificationModel.findById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Verify user is marking their own notification as read
      if (notification.userId !== req.user!.id.toString()) {
        return res.status(403).json({ message: 'You can only mark your own notifications as read' });
      }
      
      const updatedNotification = await notificationService.markNotificationAsRead(notificationId);
      res.json(updatedNotification);
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ message: 'Failed to mark notification as read' });
    }
  });

  // Mark all notifications as read for current user
  app.patch('/api/notifications/mark-all-read', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id.toString();
      await notificationService.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ message: 'Failed to mark all notifications as read' });
    }
  });

  // Delete a notification
  app.delete('/api/notifications/:id', isAuthenticated, async (req, res) => {
    try {
      const notificationId = req.params.id;
      const notification = await NotificationModel.findById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      // Verify user is deleting their own notification
      if (notification.userId !== req.user!.id.toString()) {
        return res.status(403).json({ message: 'You can only delete your own notifications' });
      }
      
      const result = await notificationService.deleteNotification(notificationId);
      res.json({ success: result });
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ message: 'Failed to delete notification' });
    }
  });
  
  // Test route for creating notifications - Admin only
  app.post('/api/notifications/test', hasRole(['admin']), async (req, res) => {
    try {
      const { title, message, type, userId } = req.body;
      
      // Create notification
      const notification = await notificationService.createNotification({
        userId: userId,
        title,
        message,
        type,
        relatedId: 'test',
        isRead: false,
        createdAt: new Date()
      });
      
      // Also send notification via WebSocket if available
      sendNotificationToUser(userId, notification);
      
      res.status(201).json(notification);
    } catch (error: any) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ message: 'Failed to create test notification' });
    }
  });

  const httpServer = createServer(app);
  
  // Setup WebSocket server for real-time notifications
  const wss = setupWebSocketServer(httpServer);
  
  // Log when server is initialized
  console.log('WebSocket server setup for notifications completed');
  
  return httpServer;
}

// Using Groq AI service instead of simulation function
