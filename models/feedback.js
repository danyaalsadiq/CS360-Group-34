const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  therapistId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feedback: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Feedback', feedbackSchema);
