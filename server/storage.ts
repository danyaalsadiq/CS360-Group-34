import {
  users, User, InsertUser,
  appointments, Appointment, InsertAppointment,
  feedback, Feedback, InsertFeedback,
  goals, Goal, InsertGoal,
  forumPosts, ForumPost, InsertForumPost,
  forumComments, ForumComment, InsertForumComment,
  chatMessages, ChatMessage, InsertChatMessage,
  resources, Resource, InsertResource
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  listUsers(role?: string): Promise<User[]>;

  // Appointment operations
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined>;
  listAppointmentsByStudent(studentId: number): Promise<Appointment[]>;
  listAppointmentsByTherapist(therapistId: number): Promise<Appointment[]>;
  listAllAppointments(): Promise<Appointment[]>;

  // Feedback operations
  getFeedback(id: number): Promise<Feedback | undefined>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  listFeedbackByTherapist(therapistId: string): Promise<Feedback[]>;
  listFeedbackByAppointment(appointmentId: string): Promise<Feedback | undefined>;

  // Goal operations
  getGoal(id: number): Promise<Goal | undefined>;
  createGoal(goal: InsertGoal): Promise<Goal>;
  updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined>;
  listGoalsByStudent(studentId: string | number): Promise<Goal[]>;
  
  // Forum operations
  getForumPost(id: string | number): Promise<ForumPost | undefined>;
  createForumPost(post: InsertForumPost): Promise<ForumPost>;
  listForumPosts(): Promise<ForumPost[]>;
  createForumComment(comment: InsertForumComment): Promise<ForumComment>;
  listCommentsByPost(postId: string | number): Promise<ForumComment[]>;

  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  listChatMessagesByUser(userId: number): Promise<ChatMessage[]>;

  // Resource operations
  createResource(resource: InsertResource): Promise<Resource>;
  listResources(): Promise<Resource[]>;
  listResourcesByTherapist(therapistId: string): Promise<Resource[]>;

  // Session store
  sessionStore: any; // Changed from session.SessionStore to fix error
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private appointments: Map<number, Appointment>;
  private feedbacks: Map<number, Feedback>;
  private goals: Map<number, Goal>;
  private forumPosts: Map<number, ForumPost>;
  private forumComments: Map<number, ForumComment>;
  private chatMessages: Map<number, ChatMessage>;
  private resources: Map<number, Resource>;
  
  sessionStore: session.SessionStore;
  private currentIds: {
    user: number;
    appointment: number;
    feedback: number;
    goal: number;
    forumPost: number;
    forumComment: number;
    chatMessage: number;
    resource: number;
  };

  constructor() {
    this.users = new Map();
    this.appointments = new Map();
    this.feedbacks = new Map();
    this.goals = new Map();
    this.forumPosts = new Map();
    this.forumComments = new Map();
    this.chatMessages = new Map();
    this.resources = new Map();
    this.currentIds = {
      user: 1,
      appointment: 1,
      feedback: 1,
      goal: 1,
      forumPost: 1,
      forumComment: 1,
      chatMessage: 1,
      resource: 1
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });
    
    // Add some default users for testing
    this.createUser({
      username: "student", 
      password: "password",
      name: "Emily Johnson",
      email: "emily@example.com",
      role: "student"
    });
    
    this.createUser({
      username: "therapist", 
      password: "password",
      name: "Dr. Sarah Johnson",
      email: "sarah@example.com",
      role: "therapist",
      specialization: "Cognitive Behavioral Therapy"
    });
    
    this.createUser({
      username: "admin", 
      password: "password",
      name: "Admin User",
      email: "admin@example.com",
      role: "admin"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentIds.user++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async listUsers(role?: string): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    if (role) {
      return allUsers.filter(user => user.role === role);
    }
    return allUsers;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    if (!this.users.has(id)) return false;
    return this.users.delete(id);
  }

  // Appointment operations
  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.currentIds.appointment++;
    const now = new Date();
    const appointment: Appointment = { ...insertAppointment, id, createdAt: now };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointmentData: Partial<Appointment>): Promise<Appointment | undefined> {
    const appointment = await this.getAppointment(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...appointmentData };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async listAppointmentsByStudent(studentId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.studentId === studentId
    );
  }

  async listAppointmentsByTherapist(therapistId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.therapistId === therapistId
    );
  }

  async listAllAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  // Feedback operations
  async getFeedback(id: number): Promise<Feedback | undefined> {
    return this.feedbacks.get(id);
  }

  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentIds.feedback++;
    const now = new Date();
    const feedback: Feedback = { ...insertFeedback, id, createdAt: now };
    this.feedbacks.set(id, feedback);
    return feedback;
  }

  async listFeedbackByTherapist(therapistId: string): Promise<Feedback[]> {
    // Convert to number for in-memory storage
    const therapistIdNum = parseInt(therapistId);
    
    // Get all appointments for the therapist
    const therapistAppointments = await this.listAppointmentsByTherapist(therapistIdNum);
    const appointmentIds = therapistAppointments.map(appointment => appointment.id);
    
    // Get all feedback for those appointments
    return Array.from(this.feedbacks.values()).filter(
      (feedback) => appointmentIds.includes(feedback.appointmentId)
    );
  }

  async listFeedbackByAppointment(appointmentId: string): Promise<Feedback | undefined> {
    // Convert to number for in-memory storage
    const appointmentIdNum = parseInt(appointmentId);
    
    return Array.from(this.feedbacks.values()).find(
      (feedback) => feedback.appointmentId === appointmentIdNum
    );
  }

  // Goal operations
  async getGoal(id: number): Promise<Goal | undefined> {
    return this.goals.get(id);
  }

  async createGoal(insertGoal: InsertGoal): Promise<Goal> {
    const id = this.currentIds.goal++;
    const now = new Date();
    const goal: Goal = { ...insertGoal, id, createdAt: now };
    this.goals.set(id, goal);
    return goal;
  }

  async updateGoal(id: number, goalData: Partial<Goal>): Promise<Goal | undefined> {
    const goal = await this.getGoal(id);
    if (!goal) return undefined;
    
    const updatedGoal = { ...goal, ...goalData };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  async listGoalsByStudent(studentId: string | number): Promise<Goal[]> {
    // Convert to number for in-memory storage if it's a string
    if (typeof studentId === 'string') {
      studentId = parseInt(studentId);
      if (isNaN(studentId)) return [];
    }
    
    return Array.from(this.goals.values()).filter(
      (goal) => goal.studentId === studentId
    );
  }

  // Forum operations
  async getForumPost(id: string | number): Promise<ForumPost | undefined> {
    // If id is a string but needs to be a number for in-memory storage
    if (typeof id === 'string') {
      id = parseInt(id);
      if (isNaN(id)) return undefined;
    }
    return this.forumPosts.get(id);
  }

  async createForumPost(insertPost: InsertForumPost): Promise<ForumPost> {
    const id = this.currentIds.forumPost++;
    const now = new Date();
    const post: ForumPost = { ...insertPost, id, createdAt: now };
    this.forumPosts.set(id, post);
    return post;
  }

  async listForumPosts(): Promise<ForumPost[]> {
    return Array.from(this.forumPosts.values());
  }

  async createForumComment(insertComment: InsertForumComment): Promise<ForumComment> {
    const id = this.currentIds.forumComment++;
    const now = new Date();
    const comment: ForumComment = { ...insertComment, id, createdAt: now };
    this.forumComments.set(id, comment);
    return comment;
  }

  async listCommentsByPost(postId: string | number): Promise<ForumComment[]> {
    // Convert to number for in-memory storage if it's a string
    if (typeof postId === 'string') {
      postId = parseInt(postId);
      if (isNaN(postId)) return [];
    }
    
    return Array.from(this.forumComments.values()).filter(
      (comment) => comment.postId === postId
    );
  }

  // Chat operations
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentIds.chatMessage++;
    const now = new Date();
    const message: ChatMessage = { ...insertMessage, id, createdAt: now };
    this.chatMessages.set(id, message);
    return message;
  }

  async listChatMessagesByUser(userId: number): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values()).filter(
      (message) => message.userId === userId
    );
  }

  // Resource operations
  async createResource(insertResource: InsertResource): Promise<Resource> {
    const id = this.currentIds.resource++;
    const now = new Date();
    const resource: Resource = { ...insertResource, id, createdAt: now };
    this.resources.set(id, resource);
    return resource;
  }

  async listResources(): Promise<Resource[]> {
    return Array.from(this.resources.values());
  }

  async listResourcesByTherapist(therapistId: string): Promise<Resource[]> {
    // Convert to number for in-memory storage
    const therapistIdNum = parseInt(therapistId);
    
    return Array.from(this.resources.values()).filter(
      (resource) => resource.therapistId === therapistIdNum
    );
  }
}

// Import the MongoDB storage implementation
import { MongoDBStorage } from './mongodb-storage';

// Use MongoDB storage instead of in-memory storage
export const storage = new MongoDBStorage();
