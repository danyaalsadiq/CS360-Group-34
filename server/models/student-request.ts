import mongoose, { Document, Schema } from 'mongoose';

export interface IStudentRequest extends Document {
  student_id: string;
  student_name: string;
  preferred_therapist_id: string;
  preferred_therapist_name: string;
  preferred_day: string;
  preferred_date: Date;
  preferred_slot_time: string;
  status: string; // pending, scheduled, rescheduled, rejected
  assigned_slot_id?: string;
  created_at: Date;
  updated_at: Date;
}

const studentRequestSchema = new Schema<IStudentRequest>({
  student_id: { type: String, required: true },
  student_name: { type: String, required: true },
  preferred_therapist_id: { type: String, required: true },
  preferred_therapist_name: { type: String, required: true },
  preferred_day: { type: String, required: true },
  preferred_date: { type: Date, required: true },
  preferred_slot_time: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'scheduled', 'rescheduled', 'rejected'],
    default: 'pending'
  },
  assigned_slot_id: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const StudentRequestModel = mongoose.model<IStudentRequest>('StudentRequest', studentRequestSchema);