import { pgTable, text, serial, integer, timestamp, boolean, real, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role", { enum: ["student", "therapist", "admin"] }).notNull().default("student"),
  profileImage: text("profile_image"),
  specialization: text("specialization"), // For therapists
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  profileImage: true,
  specialization: true,
});

// Appointment Table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  therapistId: integer("therapist_id").notNull(),
  studentId: integer("student_id").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  status: text("status", { enum: ["scheduled", "completed", "cancelled"] }).notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Original schema from Drizzle
const originalAppointmentSchema = createInsertSchema(appointments).pick({
  therapistId: true,
  studentId: true,
  date: true,
  duration: true,
  status: true,
  notes: true,
});

// Modified schema for MongoDB compatibility
export const insertAppointmentSchema = originalAppointmentSchema
  .extend({
    // For MongoDB, IDs are strings
    therapistId: z.string(),
    studentId: z.string(),
    // For easier date handling, we accept a string date
    date: z.string(),
    // Add time field for appointment time
    time: z.string(),
  });

// Feedback Table
export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  appointmentId: integer("appointment_id").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
<<<<<<< HEAD
  comments: text("comments"), // Updated from comment to comments for consistency
=======
  comment: text("comment"),
>>>>>>> 5f0bc715104c70e1c11ea30a3cff716a771bcf18
  createdAt: timestamp("created_at").defaultNow(),
});

// Original schema from Drizzle
const originalFeedbackSchema = createInsertSchema(feedback).pick({
  appointmentId: true,
  rating: true,
<<<<<<< HEAD
  comments: true, // Updated from comment to comments for consistency
=======
  comment: true,
>>>>>>> 5f0bc715104c70e1c11ea30a3cff716a771bcf18
});

// Modified schema for MongoDB compatibility
export const insertFeedbackSchema = originalFeedbackSchema
  .extend({
    // For MongoDB, IDs are strings
    appointmentId: z.string(),
    studentId: z.string().optional(),
    therapistId: z.string().optional(),
<<<<<<< HEAD
    // Using comments consistently throughout the application
    comments: z.string().optional(),
=======
    // Rename comment to comments to match the interface
    comments: z.string().optional(),
    comment: z.string().optional().transform(val => val), // Keep for backward compatibility
>>>>>>> 5f0bc715104c70e1c11ea30a3cff716a771bcf18
  });

// Mental Health Goals Table
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  therapistId: integer("therapist_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  dueDate: timestamp("due_date").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGoalSchema = createInsertSchema(goals).pick({
  studentId: true,
  therapistId: true,
  title: true,
  description: true,
  dueDate: true,
  completed: true,
});

// Forum Posts Table
export const forumPosts = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForumPostSchema = createInsertSchema(forumPosts).pick({
  userId: true,
  title: true,
  content: true,
  isAnonymous: true,
});

// Forum Comments Table
export const forumComments = pgTable("forum_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  isAnonymous: boolean("is_anonymous").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertForumCommentSchema = createInsertSchema(forumComments).pick({
  postId: true,
  userId: true,
  content: true,
  isAnonymous: true,
});

// AI Chat Messages Table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // Changed to text for MongoDB compatibility
  isFromUser: boolean("is_from_user").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  isFromUser: true,
  content: true,
});

// Resources Table
export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  therapistId: integer("therapist_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  type: text("type", { enum: ["article", "video", "pdf", "other"] }).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertResourceSchema = createInsertSchema(resources).pick({
  therapistId: true,
  title: true,
  description: true,
  type: true,
  url: true,
});

// Types for frontend usage
// Original Postgres types
// export type User = typeof users.$inferSelect;
// export type InsertUser = z.infer<typeof insertUserSchema>;

// MongoDB compatible types
export type User = {
  id: string;
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  specialization?: string;
  createdAt: Date;
};
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Appointment = {
  id: string;
  therapistId: string;
  studentId: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
  status: string;
  createdAt: Date;
};
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type Feedback = {
  id: string;
  appointmentId: string;
  studentId: string;
  therapistId: string;
  rating: number;
  comments?: string;
  createdAt: Date;
};
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export type Goal = {
  id: string;
  studentId: string;
  therapistId?: string;
  title: string;
  description: string;
  targetDate?: string;
  status: string;
  progress: number;
  createdAt: Date;
};
export type InsertGoal = z.infer<typeof insertGoalSchema>;

export type ForumPost = {
  id: string;
  title: string;
  content: string;
  userId: string;
  userName?: string;
  category: string;
  likes: string[];
  isReported: boolean;
  reportReason?: string;
  reportedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
};
export type InsertForumPost = z.infer<typeof insertForumPostSchema>;

export type ForumComment = {
  id: string;
  postId: string;
  content: string;
  userId: string;
  userName?: string;
  likes: string[];
  isReported: boolean;
  reportReason?: string;
  reportedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
};
export type InsertForumComment = z.infer<typeof insertForumCommentSchema>;

export type ChatMessage = {
  id: string;
  userId: string;
  content: string;
  isFromUser: boolean;
  createdAt: Date;
};
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type Resource = {
  id: string;
  title: string;
  description: string;
  url: string;
  therapistId?: string;
  category: string;
  createdAt: Date;
};
export type InsertResource = z.infer<typeof insertResourceSchema>;
