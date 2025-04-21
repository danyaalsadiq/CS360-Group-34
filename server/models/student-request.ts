import { Schema, model, Document } from 'mongoose';

export interface IStudentRequest extends Document {
  student_id: string;
  student_name: string;
  preferred_days: string[];
  preferred_times: string[];
  preferred_therapist_id?: string;
  status: 'pending' | 'waiting' | 'approved' | 'assigned' | 'rejected';
  assigned_slot_id?: string;
  requested_date?: string;  // For specific date requests
  requested_time?: string;  // For specific time requests
  waiting_for_therapist?: boolean; // For students waiting for therapist to mark a slot
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const studentRequestSchema = new Schema<IStudentRequest>(
  {
    student_id: { type: String, required: true },
    student_name: { type: String, required: true },
    preferred_days: [{ type: String, required: true }],
    preferred_times: [{ type: String, required: true }],
    preferred_therapist_id: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'waiting', 'approved', 'assigned', 'rejected'], 
      default: 'pending'
    },
    assigned_slot_id: { type: String },
    requested_date: { type: String }, // Specific date for waiting list
    requested_time: { type: String }, // Specific time for waiting list
    waiting_for_therapist: { type: Boolean, default: false },
    notes: { type: String }
  }, 
  { 
    timestamps: { 
      createdAt: 'created_at', 
      updatedAt: 'updated_at' 
    } 
  }
);

export const StudentRequestModel = model<IStudentRequest>('StudentRequest', studentRequestSchema);