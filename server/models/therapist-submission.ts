import { Schema, model, Document } from 'mongoose';

export interface ITherapistSubmission extends Document {
  therapist_id: string;
  therapist_name: string;
  date: string;
  day: string;
  start_time: string;
  end_time: string;
  is_recurring: boolean;
  recurring_days?: string[];
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const therapistSubmissionSchema = new Schema<ITherapistSubmission>(
  {
    therapist_id: { type: String, required: true },
    therapist_name: { type: String, required: true },
    date: { type: String, required: true },
    day: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    is_recurring: { type: Boolean, default: false },
    recurring_days: [{ type: String }],
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending'
    },
    notes: { type: String }
  }, 
  { 
    timestamps: { 
      createdAt: 'created_at', 
      updatedAt: 'updated_at' 
    } 
  }
);

export const TherapistSubmissionModel = model<ITherapistSubmission>('TherapistSubmission', therapistSubmissionSchema);