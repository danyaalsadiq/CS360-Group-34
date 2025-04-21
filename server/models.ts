import { mongoose } from './db';
import { Schema, Document, model } from 'mongoose';

// User Schema
interface IUser extends Document {
  username: string;
  password: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  specialization?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true, enum: ['student', 'therapist', 'admin'] },
  profileImage: { type: String },
  specialization: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Appointment Schema
interface IAppointment extends Document {
  studentId: string;
  therapistId: string;
  date: string;
  time: string;
  duration: number;
  notes?: string;
  status: string;
  createdAt: Date;
}

const appointmentSchema = new Schema<IAppointment>({
  studentId: { type: String, required: true },
  therapistId: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  duration: { type: Number, required: true },
  notes: { type: String },
  status: { type: String, required: true, enum: ['scheduled', 'completed', 'cancelled'] },
  createdAt: { type: Date, default: Date.now }
});

// Feedback Schema
interface IFeedback extends Document {
  appointmentId: string;
  studentId: string;
  therapistId: string;
  rating: number;
  comments?: string;
  createdAt: Date;
}

const feedbackSchema = new Schema<IFeedback>({
  appointmentId: { type: String, required: true },
  studentId: { type: String, required: true },
  therapistId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comments: { type: String },
  createdAt: { type: Date, default: Date.now }
});

// Goal Schema
interface IGoal extends Document {
  studentId: string;
  therapistId?: string;
  title: string;
  description: string;
  targetDate?: string;
  status: string;
  progress: number;
  createdAt: Date;
}

const goalSchema = new Schema<IGoal>({
  studentId: { type: String, required: true },
  therapistId: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  targetDate: { type: String },
  status: { type: String, required: true, enum: ['not-started', 'in-progress', 'completed'] },
  progress: { type: Number, required: true, min: 0, max: 100 },
  createdAt: { type: Date, default: Date.now }
});

// Forum Post Schema
interface IForumPost extends Document {
  title: string;
  content: string;
  userId: string; // Changed to string for MongoDB compatibility
  userName?: string; // Added to store the username for display purposes
  category: string;
  likes: string[]; // Array of user IDs who liked the post
  isReported: boolean;
  reportReason?: string;
  reportedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
}

const forumPostSchema = new Schema<IForumPost>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String },
  category: { type: String, required: true },
  likes: [{ type: String }], // Array of user IDs
  isReported: { type: Boolean, default: false },
  reportReason: { type: String },
  reportedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false }
});

// Forum Comment Schema
interface IForumComment extends Document {
  postId: string; // Changed to string for MongoDB compatibility
  content: string;
  userId: string; // Changed to string for MongoDB compatibility
  userName?: string; // Added to store the username for display purposes
  likes: string[]; // Array of user IDs who liked the comment
  isReported: boolean;
  reportReason?: string;
  reportedBy?: string;
  createdAt: Date;
  updatedAt?: Date;
  isDeleted: boolean;
}

const forumCommentSchema = new Schema<IForumComment>({
  postId: { type: String, required: true },
  content: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String },
  likes: [{ type: String }], // Array of user IDs
  isReported: { type: Boolean, default: false },
  reportReason: { type: String },
  reportedBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  isDeleted: { type: Boolean, default: false }
});

// Chat Message Schema
interface IChatMessage extends Document {
  userId: string;  // Changed from number to string for MongoDB compatibility
  content: string;
  isFromUser: boolean;  // Changed from isAI to isFromUser to match schema
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  userId: { type: String, required: true },  // Changed from Number to String
  content: { type: String, required: true },
  isFromUser: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Resource Schema
interface IResource extends Document {
  title: string;
  description: string;
  url: string;
  therapistId?: number;
  category: string;
  createdAt: Date;
}

const resourceSchema = new Schema<IResource>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  therapistId: { type: Number },
  category: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Create and export models
export const UserModel = model<IUser>('User', userSchema);
export const AppointmentModel = model<IAppointment>('Appointment', appointmentSchema);
export const FeedbackModel = model<IFeedback>('Feedback', feedbackSchema);
export const GoalModel = model<IGoal>('Goal', goalSchema);
export const ForumPostModel = model<IForumPost>('ForumPost', forumPostSchema);
export const ForumCommentModel = model<IForumComment>('ForumComment', forumCommentSchema);
export const ChatMessageModel = model<IChatMessage>('ChatMessage', chatMessageSchema);
export const ResourceModel = model<IResource>('Resource', resourceSchema);

// Export interfaces
export type {
  IUser,
  IAppointment,
  IFeedback,
  IGoal,
  IForumPost,
  IForumComment,
  IChatMessage,
  IResource
};