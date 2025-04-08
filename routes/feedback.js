const express = require('express');
const Feedback = require('../models/feedback');
const Appointment = require('../models/appointment');
const authenticate = require('../middleware/authenticate'); // Import authentication middleware
const router = express.Router();

// Route to submit feedback for a therapy session (protected route)
router.post('/', authenticate, async (req, res) => {
  const { appointmentId, feedback, rating } = req.body;

  // Ensure that the logged-in user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can submit feedback' });
  }

  try {
    // Find the appointment by ID
    const appointment = await Appointment.findById(appointmentId).populate('studentId therapistId');

    // Ensure the appointment exists and the student is the one who booked the appointment
    if (!appointment || appointment.studentId._id.toString() !== req.user.userId) {
      return res.status(404).json({ error: 'Appointment not found or you did not book this appointment' });
    }

    // Ensure the appointment is marked as completed before feedback can be provided
    if (appointment.status !== 'completed') {
      return res.status(400).json({ error: 'Feedback can only be submitted for completed sessions' });
    }

    // Create new feedback entry
    const newFeedback = new Feedback({
      appointmentId,
      studentId: req.user.userId,
      therapistId: appointment.therapistId._id,
      feedback,
      rating,
    });

    // Save feedback to the database
    const savedFeedback = await newFeedback.save();

    res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: savedFeedback,
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Error submitting feedback' });
  }
});

// Route to get feedback for a specific appointment (admin and student can view)
router.get('/:appointmentId', authenticate, async (req, res) => {
  const { appointmentId } = req.params;

  // Ensure the logged-in user is either an admin or the student who booked the appointment
  if (req.user.role !== 'admin') {
    const appointment = await Appointment.findById(appointmentId).populate('studentId');
    if (appointment.studentId._id.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only view feedback for your own appointments' });
    }
  }

  try {
    // Find the feedback by appointment ID
    const feedback = await Feedback.findOne({ appointmentId })
      .populate('studentId therapistId')
      .exec();

    if (!feedback) {
      return res.status(404).json({ error: 'Feedback not found for this appointment' });
    }

    res.status(200).json({
      feedback,
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Error fetching feedback' });
  }
});

module.exports = router;
