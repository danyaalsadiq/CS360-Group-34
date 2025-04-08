const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true }, // The date the therapist is available
  slots: [
    {
      startTime: { type: String, required: true }, // Format: HH:MM
      endTime: { type: String, required: true },  // Format: HH:MM
      status: { type: String, enum: ['available', 'booked'], default: 'available' }, // Availability status
    }
  ],
});

// Indexing therapistId and date for faster queries
// availabilitySchema.index({ therapistId: 1, date: 1 });

module.exports = mongoose.model('Availability', availabilitySchema);
