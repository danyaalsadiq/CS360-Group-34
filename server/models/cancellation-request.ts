import mongoose, { Document, Schema } from 'mongoose';

export interface ICancellationRequest extends Document {
  slot_id: string;
  therapist_id: string;
  therapist_name: string;
  student_id?: string;
  student_name?: string;
  cancellation_reason: string;
  status: string; // pending, processed, rejected
  created_at: Date;
  updated_at: Date;
}

const cancellationRequestSchema = new Schema<ICancellationRequest>({
  slot_id: { type: String, required: true },
  therapist_id: { type: String, required: true },
  therapist_name: { type: String, required: true },
  student_id: { type: String },
  student_name: { type: String },
  cancellation_reason: { type: String, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'processed', 'rejected'],
    default: 'pending'
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const CancellationRequestModel = mongoose.model<ICancellationRequest>('CancellationRequest', cancellationRequestSchema);