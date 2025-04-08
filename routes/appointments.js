const express = require('express');
const Appointment = require('../models/appointment');
const authenticate = require('../middleware/authenticate'); // Import authentication middleware
const router = express.Router();

// Route for booking an appointment (protected route)
router.post('/', authenticate, async (req, res) => {
  const { therapistId, date } = req.body;

  // Ensure that the logged-in user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can book appointments' });
  }

  try {
    // Create a new appointment
    const newAppointment = new Appointment({
      studentId: req.user.userId,
      therapistId,
      date,
      status: 'scheduled', // By default, status is 'scheduled'
    });

    // Save the appointment to the database
    const savedAppointment = await newAppointment.save();

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Error booking appointment' });
  }
});

module.exports = router;
