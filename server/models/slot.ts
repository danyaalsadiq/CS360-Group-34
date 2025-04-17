import mongoose, { Document, Schema } from 'mongoose';

export interface ISlot extends Document {
  day: string;
  date: Date;
  start_time: string;
  end_time: string;
  is_booked: boolean;
  therapist_id?: string;
  therapist_name?: string;
  student_id?: string;
  student_name?: string;
  created_at: Date;
  updated_at: Date;
}

const slotSchema = new Schema<ISlot>({
  day: { type: String, required: true },
  date: { type: Date, required: true },
  start_time: { type: String, required: true },
  end_time: { type: String, required: true },
  is_booked: { type: Boolean, default: false },
  therapist_id: { type: String },
  therapist_name: { type: String },
  student_id: { type: String },
  student_name: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

export const SlotModel = mongoose.model<ISlot>('Slot', slotSchema);