import { Schema, model, Document } from 'mongoose';

export interface ISlot extends Document {
  date: string;
  day: string;
  start_time: string;
  end_time: string;
  therapist_id: string;
  therapist_name: string;
  student_id?: string;
  student_name?: string;
  status: 'available' | 'booked' | 'cancelled' | 'completed';
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

const slotSchema = new Schema<ISlot>(
  {
    date: { type: String, required: true },
    day: { type: String, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    therapist_id: { type: String, required: true },
    therapist_name: { type: String, required: true },
    student_id: { type: String },
    student_name: { type: String },
    status: { 
      type: String, 
      enum: ['available', 'booked', 'cancelled', 'completed'], 
      default: 'available'
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

export const SlotModel = model<ISlot>('Slot', slotSchema);