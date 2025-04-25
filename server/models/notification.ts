import { mongoose } from '../db';
import { Schema, Document, model } from 'mongoose';

export interface INotification extends Document {
  userId: string;  // The user who receives the notification
  title: string;   // Short notification title
  message: string; // Detailed notification message
  type: string;    // Type of notification (appointment, cancellation, etc.)
  relatedId: string; // ID of related entity (appointment, slot, etc.)
  isRead: boolean; // Whether the notification has been read
  createdAt: Date; // When the notification was created
}

const notificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { 
      type: String, 
      required: true, 
      enum: [
        'appointment_assigned', 
        'appointment_cancelled', 
        'appointment_completed', 
        'system', 
        'appointment_reminder', 
        'waitlist_matched',
        'slot_unavailable',
        'slot_reassignment_pending',
        'availability_cancelled'
      ] 
    },
    relatedId: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  },
  { 
    timestamps: { 
      createdAt: 'createdAt', 
      updatedAt: 'updatedAt' 
    } 
  }
);

export const NotificationModel = model<INotification>('Notification', notificationSchema);