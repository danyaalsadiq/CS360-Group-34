import mongoose, { Document, Schema } from 'mongoose';

interface AvailableSlot {
  day: string;
  date: Date;
  start_time: string;
  end_time: string;
}

export interface ITherapistSubmission extends Document {
  therapist_id: string;
  therapist_name: string;
  available_slots: AvailableSlot[];
  created_at: Date;
  updated_at: Date;
}

const availableSlotSchema = new Schema({
  day: { type: String, required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true }
});

const therapistSubmissionSchema = new Schema<ITherapistSubmission>({
  therapist_id: { type: String, required: true },
  therapist_name: { type: String, required: true },
  available_slots: [availableSlotSchema],
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const TherapistSubmissionModel = mongoose.model<ITherapistSubmission>('TherapistSubmission', therapistSubmissionSchema);