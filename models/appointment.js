const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  status: { 
    type: String, 
    enum: ['scheduled', 'completed', 'cancelled'], 
    default: 'scheduled' 
  }
});

module.exports = mongoose.model('Appointment', appointmentSchema);
