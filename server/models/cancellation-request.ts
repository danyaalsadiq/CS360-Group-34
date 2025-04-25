import { Schema, model, Document } from 'mongoose';

export interface ICancellationRequest extends Document {
  slot_id: string;
  date: string;
  start_time: string;
  end_time: string;
  therapist_id: string;
  therapist_name: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: Date;
  updated_at: Date;
}

const cancellationRequestSchema = new Schema<ICancellationRequest>(
  {
    slot_id: { type: String, required: true },
    date: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    therapist_id: { type: String, required: true },
    therapist_name: { type: String, required: true },
    reason: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending'
    }
  }, 
  { 
    timestamps: { 
      createdAt: 'created_at', 
      updatedAt: 'updated_at' 
    } 
  }
);

export const CancellationRequestModel = model<ICancellationRequest>('CancellationRequest', cancellationRequestSchema);