const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config(); // Load environment variables from .env

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json()); // Parse incoming JSON requests

// Import auth routes before starting the server
const authRoutes = require('./routes/auth'); // Import auth routes
const Appointment = require('./models/appointment'); // Import the appointment model
const Availability = require('./models/availability'); // Import the availability model

app.use('/api/auth', authRoutes); // Use authentication routes

// Test Route
app.get('/', (req, res) => {
  res.send('Welcome to the CAPS Management System!');
});

// Async function to start the server
async function startServer() {
  try {
    console.log('Connecting to MongoDB:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Start the server after successful DB connection
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

const authenticate = require('./middleware/authenticate'); // Import authentication middleware

// Route for booking an appointment (protected route)
app.post('/api/appointments', authenticate, async (req, res) => {
  const { therapistId, date } = req.body;

  // Ensure that the logged-in user is a student
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can book appointments' });
  }

  try {
    // Create a new appointment
    const newAppointment = new Appointment({
      studentId: req.user.userId,  // Using the studentId from the logged-in user
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

// Route to get all appointments for a student (protected route)
app.put('/api/availability', authenticate, async (req, res) => {
  const { date, slots } = req.body;

  // Ensure the logged-in user is a therapist
  if (req.user.role !== 'therapist') {
    return res.status(403).json({ error: 'Only therapists can update availability' });
  }

  try {
    // Check if availability already exists for this therapist on the given date
    let availability = await Availability.findOne({ therapistId: req.user._id, date });

    // If availability does not exist, create a new entry
    if (!availability) {
      availability = new Availability({
        therapistId: req.user._id,  // Assign the therapistId to the logged-in user's _id
        date,
        slots,
      });
    } else {
      // If availability exists, update the slots
      availability.slots = slots;
    }

    // Save or update the availability in the database
    const savedAvailability = await availability.save();
    res.status(200).json({
      message: 'Availability updated successfully',
      availability: savedAvailability,
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ error: 'Error updating availability', details: error.message });
  }
});


startServer();

