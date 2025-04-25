import session from "express-session";
import createMemoryStore from "memorystore";
import {
  User, InsertUser,
  Appointment, InsertAppointment,
  Feedback, InsertFeedback,
  Goal, InsertGoal,
  ForumPost, InsertForumPost,
  ForumComment, InsertForumComment,
  ChatMessage, InsertChatMessage,
  Resource, InsertResource
} from "@shared/schema";
import {
  UserModel, AppointmentModel, FeedbackModel, GoalModel,
  ForumPostModel, ForumCommentModel, ChatMessageModel, ResourceModel,
  IUser, IAppointment, IFeedback, IGoal, IForumPost, IForumComment, IChatMessage, IResource
} from "./models";
import { IStorage } from "./storage";

const MemoryStore = createMemoryStore(session);

// Helper functions to convert between MongoDB documents and our schema types
function toUser(doc: IUser & { _id: any }): User {
  return {
    id: doc._id.toString(),
    username: doc.username,
    password: doc.password,
    name: doc.name,
    email: doc.email,
    role: doc.role,
    profileImage: doc.profileImage,
    specialization: doc.specialization,
    createdAt: doc.createdAt
  };
}

function toAppointment(doc: IAppointment & { _id: any }): Appointment {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId,
    therapistId: doc.therapistId,
    date: doc.date,
    time: doc.time,
    duration: doc.duration,
    notes: doc.notes,
    status: doc.status,
    createdAt: doc.createdAt
  };
}

function toFeedback(doc: IFeedback & { _id: any }): Feedback {
  return {
    id: doc._id.toString(),
    appointmentId: doc.appointmentId,
    studentId: doc.studentId,
    therapistId: doc.therapistId,
    rating: doc.rating,
    comments: doc.comments,
    createdAt: doc.createdAt
  };
}

function toGoal(doc: IGoal & { _id: any }): Goal {
  return {
    id: doc._id.toString(),
    studentId: doc.studentId,
    therapistId: doc.therapistId,
    title: doc.title,
    description: doc.description,
    targetDate: doc.targetDate,
    status: doc.status,
    progress: doc.progress,
    createdAt: doc.createdAt
  };
}

function toForumPost(doc: IForumPost & { _id: any }): ForumPost {
  return {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    userId: doc.userId,
    userName: doc.userName,
    category: doc.category,
    likes: doc.likes || [],
    isReported: doc.isReported || false,
    reportReason: doc.reportReason,
    reportedBy: doc.reportedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    isDeleted: doc.isDeleted || false
  };
}

function toForumComment(doc: IForumComment & { _id: any }): ForumComment {
  return {
    id: doc._id.toString(),
    postId: doc.postId,
    content: doc.content,
    userId: doc.userId,
    userName: doc.userName,
    likes: doc.likes || [],
    isReported: doc.isReported || false,
    reportReason: doc.reportReason,
    reportedBy: doc.reportedBy,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    isDeleted: doc.isDeleted || false
  };
}

function toChatMessage(doc: IChatMessage & { _id: any }): ChatMessage {
  return {
    id: doc._id.toString(),
    userId: doc.userId,
    content: doc.content,
    isFromUser: doc.isFromUser,
    createdAt: doc.createdAt
  };
}

function toResource(doc: IResource & { _id: any }): Resource {
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    url: doc.url,
    therapistId: doc.therapistId,
    category: doc.category,
    createdAt: doc.createdAt
  };
}

export class MongoDBStorage implements IStorage {
  sessionStore: session.SessionStore;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Create default users if they don't exist
    this.initializeDefaultUsers();
  }
  
  private async initializeDefaultUsers() {
    // Check if any users exist
    const existingUsers = await UserModel.countDocuments();
    if (existingUsers === 0) {
      // Add default users for testing
      await this.createUser({
        username: "student",
        password: "password",
        name: "Emily Johnson",
        email: "emily@example.com",
        role: "student"
      });
      
      await this.createUser({
        username: "therapist",
        password: "password",
        name: "Dr. Sarah Johnson",
        email: "sarah@example.com",
        role: "therapist",
        specialization: "Cognitive Behavioral Therapy"
      });
      
      await this.createUser({
        username: "admin",
        password: "admin1",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin"
      });
      
      console.log("Created default users");
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const user = await UserModel.findById(id);
      return user ? toUser(user) : undefined;
    } catch (error) {
      console.error("Error fetching user:", error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ username });
      return user ? toUser(user) : undefined;
    } catch (error) {
      console.error("Error fetching user by username:", error);
      return undefined;
    }
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const user = await UserModel.findOne({ email });
      return user ? toUser(user) : undefined;
    } catch (error) {
      console.error("Error fetching user by email:", error);
      return undefined;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      const newUser = new UserModel(insertUser);
      const savedUser = await newUser.save();
      return toUser(savedUser);
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const updatedUser = await UserModel.findByIdAndUpdate(id, userData, { new: true });
      return updatedUser ? toUser(updatedUser) : undefined;
    } catch (error) {
      console.error("Error updating user:", error);
      return undefined;
    }
  }

  async listUsers(role?: string): Promise<User[]> {
    try {
      const query = role ? { role } : {};
      const users = await UserModel.find(query);
      return users.map(user => toUser(user));
    } catch (error) {
      console.error("Error listing users:", error);
      return [];
    }
  }
  
  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await UserModel.findByIdAndDelete(id);
      return result !== null;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    try {
      const appointment = await AppointmentModel.findById(id);
      return appointment ? toAppointment(appointment) : undefined;
    } catch (error) {
      console.error("Error fetching appointment:", error);
      return undefined;
    }
  }

  async createAppointment(appointment: InsertAppointment): Promise<Appointment> {
    try {
      const newAppointment = new AppointmentModel(appointment);
      const savedAppointment = await newAppointment.save();
      return toAppointment(savedAppointment);
    } catch (error) {
      console.error("Error creating appointment:", error);
      throw error;
    }
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    try {
      const updatedAppointment = await AppointmentModel.findByIdAndUpdate(id, appointmentData, { new: true });
      return updatedAppointment ? toAppointment(updatedAppointment) : undefined;
    } catch (error) {
      console.error("Error updating appointment:", error);
      return undefined;
    }
  }

  async listAppointmentsByStudent(studentId: number): Promise<Appointment[]> {
    try {
      const appointments = await AppointmentModel.find({ studentId });
      return appointments.map(appointment => toAppointment(appointment));
    } catch (error) {
      console.error("Error listing appointments by student:", error);
      return [];
    }
  }

  async listAppointmentsByTherapist(therapistId: number): Promise<Appointment[]> {
    try {
      const appointments = await AppointmentModel.find({ therapistId });
      return appointments.map(appointment => toAppointment(appointment));
    } catch (error) {
      console.error("Error listing appointments by therapist:", error);
      return [];
    }
  }

  async listAllAppointments(): Promise<Appointment[]> {
    try {
      const appointments = await AppointmentModel.find();
      return appointments.map(appointment => toAppointment(appointment));
    } catch (error) {
      console.error("Error listing all appointments:", error);
      return [];
    }
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    try {
      const feedback = await FeedbackModel.findById(id);
      return feedback ? toFeedback(feedback) : undefined;
    } catch (error) {
      console.error("Error fetching feedback:", error);
      return undefined;
    }
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    try {
      const newFeedback = new FeedbackModel(feedback);
      const savedFeedback = await newFeedback.save();
      return toFeedback(savedFeedback);
    } catch (error) {
      console.error("Error creating feedback:", error);
      throw error;
    }
  }

  async listFeedbackByTherapist(therapistId: string): Promise<Feedback[]> {
    try {
      const feedbacks = await FeedbackModel.find({ therapistId });
      return feedbacks.map(feedback => toFeedback(feedback));
    } catch (error) {
      console.error("Error listing feedback by therapist:", error);
      return [];
    }
  }

  async listFeedbackByAppointment(appointmentId: string): Promise<Feedback | undefined> {
    try {
      const feedback = await FeedbackModel.findOne({ appointmentId });
      return feedback ? toFeedback(feedback) : undefined;
    } catch (error) {
      console.error("Error listing feedback by appointment:", error);
      return undefined;
    }
  }

  // Goal operations
  async getGoal(id: number): Promise<Goal | undefined> {
    try {
      const goal = await GoalModel.findById(id);
      return goal ? toGoal(goal) : undefined;
    } catch (error) {
      console.error("Error fetching goal:", error);
      return undefined;
    }
  }

  async createGoal(goal: InsertGoal): Promise<Goal> {
    try {
      const newGoal = new GoalModel(goal);
      const savedGoal = await newGoal.save();
      return toGoal(savedGoal);
    } catch (error) {
      console.error("Error creating goal:", error);
      throw error;
    }
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    try {
      const updatedGoal = await GoalModel.findByIdAndUpdate(id, goalData, { new: true });
      return updatedGoal ? toGoal(updatedGoal) : undefined;
    } catch (error) {
      console.error("Error updating goal:", error);
      return undefined;
    }
  }

  async listGoalsByStudent(studentId: string | number): Promise<Goal[]> {
    try {
      const goals = await GoalModel.find({ studentId });
      return goals.map(goal => toGoal(goal));
    } catch (error) {
      console.error("Error listing goals by student:", error);
      return [];
    }
  }

  // Forum operations
  async getForumPost(id: string | number): Promise<ForumPost | undefined> {
    try {
      const post = await ForumPostModel.findById(id);
      return post ? toForumPost(post) : undefined;
    } catch (error) {
      console.error("Error fetching forum post:", error);
      return undefined;
    }
  }

  async createForumPost(post: InsertForumPost): Promise<ForumPost> {
    try {
      const newPost = new ForumPostModel(post);
      const savedPost = await newPost.save();
      return toForumPost(savedPost);
    } catch (error) {
      console.error("Error creating forum post:", error);
      throw error;
    }
  }

  async listForumPosts(): Promise<ForumPost[]> {
    try {
      const posts = await ForumPostModel.find({ isDeleted: { $ne: true } }).sort({ createdAt: -1 });
      return posts.map(post => toForumPost(post));
    } catch (error) {
      console.error("Error listing forum posts:", error);
      return [];
    }
  }
  
  async listForumPostsByCategory(category: string): Promise<ForumPost[]> {
    try {
      const posts = await ForumPostModel.find({ 
        category, 
        isDeleted: { $ne: true } 
      }).sort({ createdAt: -1 });
      return posts.map(post => toForumPost(post));
    } catch (error) {
      console.error("Error listing forum posts by category:", error);
      return [];
    }
  }
  
  async updateForumPost(id: string, postData: Partial<ForumPost>): Promise<ForumPost | undefined> {
    try {
      const updatedPost = await ForumPostModel.findByIdAndUpdate(
        id, 
        { ...postData, updatedAt: new Date() }, 
        { new: true }
      );
      return updatedPost ? toForumPost(updatedPost) : undefined;
    } catch (error) {
      console.error("Error updating forum post:", error);
      return undefined;
    }
  }
  
  async deleteForumPost(id: string): Promise<boolean> {
    try {
      // Soft delete by setting isDeleted flag
      await ForumPostModel.findByIdAndUpdate(id, { 
        isDeleted: true, 
        updatedAt: new Date() 
      });
      return true;
    } catch (error) {
      console.error("Error deleting forum post:", error);
      return false;
    }
  }
  
  async likeForumPost(postId: string, userId: string): Promise<ForumPost | undefined> {
    try {
      const post = await ForumPostModel.findById(postId);
      if (!post) return undefined;
      
      // If user already liked, remove like (toggle)
      if (post.likes && post.likes.includes(userId)) {
        post.likes = post.likes.filter(id => id !== userId);
      } else {
        // Add like
        if (!post.likes) post.likes = [];
        post.likes.push(userId);
      }
      
      post.updatedAt = new Date();
      await post.save();
      return toForumPost(post);
    } catch (error) {
      console.error("Error liking forum post:", error);
      return undefined;
    }
  }
  
  async reportForumPost(postId: string, userId: string, reason: string): Promise<ForumPost | undefined> {
    try {
      const post = await ForumPostModel.findById(postId);
      if (!post) return undefined;
      
      post.isReported = true;
      post.reportReason = reason;
      post.reportedBy = userId;
      post.updatedAt = new Date();
      
      await post.save();
      return toForumPost(post);
    } catch (error) {
      console.error("Error reporting forum post:", error);
      return undefined;
    }
  }

  async createForumComment(comment: InsertForumComment): Promise<ForumComment> {
    try {
      const newComment = new ForumCommentModel(comment);
      const savedComment = await newComment.save();
      return toForumComment(savedComment);
    } catch (error) {
      console.error("Error creating forum comment:", error);
      throw error;
    }
  }

  async listCommentsByPost(postId: string | number): Promise<ForumComment[]> {
    try {
      const comments = await ForumCommentModel.find({ postId }).sort({ createdAt: 1 });
      return comments.map(comment => toForumComment(comment));
    } catch (error) {
      console.error("Error listing comments by post:", error);
      return [];
    }
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    try {
      const newMessage = new ChatMessageModel(message);
      const savedMessage = await newMessage.save();
      return toChatMessage(savedMessage);
    } catch (error) {
      console.error("Error creating chat message:", error);
      throw error;
    }
  }

  async listChatMessagesByUser(userId: number | string): Promise<ChatMessage[]> {
    try {
      // Ensure userId is a string for MongoDB
      const userIdStr = String(userId);
      
      console.log(`Fetching chat messages for user ID: ${userIdStr}`);
      const messages = await ChatMessageModel.find({ userId: userIdStr }).sort({ createdAt: 1 });
      console.log(`Found ${messages.length} messages for user ${userIdStr}`);
      
      return messages.map(message => toChatMessage(message));
    } catch (error) {
      console.error("Error listing chat messages by user:", error);
      return [];
    }
  }

  // Resource operations
  async createResource(resource: InsertResource): Promise<Resource> {
    try {
      const newResource = new ResourceModel(resource);
      const savedResource = await newResource.save();
      return toResource(savedResource);
    } catch (error) {
      console.error("Error creating resource:", error);
      throw error;
    }
  }

  async listResources(): Promise<Resource[]> {
    try {
      const resources = await ResourceModel.find();
      return resources.map(resource => toResource(resource));
    } catch (error) {
      console.error("Error listing resources:", error);
      return [];
    }
  }

  async listResourcesByTherapist(therapistId: string): Promise<Resource[]> {
    try {
      const resources = await ResourceModel.find({ therapistId });
      return resources.map(resource => toResource(resource));
    } catch (error) {
      console.error("Error listing resources by therapist:", error);
      return [];
    }
  }
}