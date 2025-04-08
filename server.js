const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());

// Import routes
const authRoutes = require('./routes/auth');
const appointmentRoutes = require('./routes/appointments');
const availabilityRoutes = require('./routes/availability');
const feedbackRoutes = require('./routes/feedback');
const chatbotRoutes = require('./routes/chatbot');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Welcome to the CAPS Management System!');
});

// Start the server
async function startServer() {
  try {
    console.log('Connecting to MongoDB:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

startServer();

// const express = require('express');
// const mongoose = require('mongoose');
// require('dotenv').config(); // Load environment variables from .env

// const app = express();
// const port = process.env.PORT || 5000;

// app.use(express.json()); // Parse incoming JSON requests

// // Import auth routes before starting the server
// const authRoutes = require('./routes/auth'); // Import auth routes
// const Appointment = require('./models/appointment'); // Import the appointment model
// const Availability = require('./models/availability'); // Import the availability model
// const Feedback = require('./models/feedback'); // Import the feedback model

// const nodemailer = require('nodemailer');  // Import nodemailer for sending emails
// const cron = require('node-cron');

// app.use('/api/auth', authRoutes); // Use authentication routes

// // Test Route
// app.get('/', (req, res) => {
//   res.send('Welcome to the CAPS Management System!');
// });

// // Async function to start the server
// async function startServer() {
//   try {
//     console.log('Connecting to MongoDB:', process.env.MONGODB_URI);
//     await mongoose.connect(process.env.MONGODB_URI);
//     console.log('MongoDB connected successfully');

//     // Start the server after successful DB connection
//     app.listen(port, () => {
//       console.log(`Server is running on port ${port}`);
//     });
//   } catch (error) {
//     console.error('Error connecting to MongoDB:', error);
//   }
// }

// const authenticate = require('./middleware/authenticate'); // Import authentication middleware

// app.post('/api/appointments', authenticate, async (req, res) => {
//   const { therapistId, date } = req.body;

//   // Ensure that the logged-in user is a student
//   if (req.user.role !== 'student') {
//     return res.status(403).json({ error: 'Only students can book appointments' });
//   }

//   try {
//     // Create a new appointment
//     const newAppointment = new Appointment({
//       studentId: req.user.userId,  // Using the studentId from the logged-in user
//       therapistId,
//       date,
//       status: 'scheduled', // By default, status is 'scheduled'
//     });

//     // Save the appointment to the database
//     const savedAppointment = await newAppointment.save();

//     // Send reminder email immediately after booking (for testing)
//     sendReminderEmail(savedAppointment, req.user.email);

//     res.status(201).json({
//       message: 'Appointment booked successfully',
//       appointment: savedAppointment,
//     });

//   } catch (error) {
//     console.error('Error booking appointment:', error);
//     res.status(500).json({ error: 'Error booking appointment' });
//   }
// });

// app.put('/api/availability', authenticate, async (req, res) => {
//   const { date, slots } = req.body;

//   // Ensure the logged-in user is a therapist
//   if (req.user.role !== 'therapist') {
//     return res.status(403).json({ error: 'Only therapists can update availability' });
//   }

//   console.log('Therapist ID from req.user:', req.user.userId); // Updated to log userId
//   console.log('Date received:', date);
//   console.log('Slots received:', slots);

//   // Validate slots format
//   if (!Array.isArray(slots) || slots.some(slot => !slot.startTime || !slot.endTime || !slot.status)) {
//     return res.status(400).json({ error: 'Invalid slots format' });
//   }

//   try {
//     // Check if availability already exists for this therapist on the given date
//     let availability = await Availability.findOne({ therapistId: req.user.userId, date });

//     // If availability does not exist, create a new entry
//     if (!availability) {
//       availability = new Availability({
//         therapistId: req.user.userId, // Updated to use userId
//         date,
//         slots,
//       });
//     } else {
//       // If availability exists, update the slots
//       availability.slots = slots;
//     }

//     // Save or update the availability in the database
//     const savedAvailability = await availability.save();
//     res.status(200).json({
//       message: 'Availability updated successfully',
//       availability: savedAvailability,
//     });
//   } catch (error) {
//     console.error('Error updating availability:', error.message, error.stack);
//     res.status(500).json({ error: 'Error updating availability', details: error.message });
//   }
// });

// // Function to send reminder email
// const sendReminderEmail = async (appointment, studentEmail) => {
//   const mailOptions = {
//     from: process.env.EMAIL_USER,
//     to: studentEmail,
//     subject: 'Reminder: Your Upcoming Therapy Appointment',
//     text: `Dear student,

// This is a reminder for your upcoming therapy appointment with therapist ${appointment.therapistId.username}.
// Date: ${appointment.date}
// Status: ${appointment.status}

// Please make sure to attend your appointment.

// Regards,
// CAPS Management System`,
//   };

//   try {
//     await transporter.sendMail(mailOptions);
//     console.log('Reminder email sent successfully');
//   } catch (error) {
//     console.log('Error sending email:', error);
//   }
// };

// // Schedule the cron job to run every day at midnight (adjust timing as needed)
// cron.schedule('0 0 * * *', async () => {
//   const currentTime = new Date();
//   const reminderTime = new Date(currentTime.getTime() + 24 * 60 * 60 * 1000); // 24 hours ahead

//   try {
//     // Find all appointments scheduled for tomorrow (24 hours from now)
//     const appointments = await Appointment.find({
//       date: { $gte: currentTime, $lt: reminderTime },
//       status: 'scheduled',
//     }).populate('studentId'); // Populate studentId to get the student's email

//     // Send reminder emails for each appointment
//     appointments.forEach((appointment) => {
//       sendReminderEmail(appointment, appointment.studentId.email);
//     });
//   } catch (error) {
//     console.error('Error checking appointments:', error);
//   }
// });

// Route to submit feedback for a therapy session (protected route)
// app.post('/api/feedback', authenticate, async (req, res) => {
//   const { appointmentId, feedback, rating } = req.body;

//   // Ensure that the logged-in user is a student
//   if (req.user.role !== 'student') {
//     return res.status(403).json({ error: 'Only students can submit feedback' });
//   }

//   try {
//     // Find the appointment by ID
//     const appointment = await Appointment.findById(appointmentId).populate('studentId therapistId');

//     // Ensure the appointment exists and the student is the one who booked the appointment
//     if (!appointment || appointment.studentId._id.toString() !== req.user.userId) {
//       return res.status(404).json({ error: 'Appointment not found or you did not book this appointment' });
//     }

//     // Ensure the appointment is marked as completed before feedback can be provided
//     if (appointment.status !== 'completed') {
//       return res.status(400).json({ error: 'Feedback can only be submitted for completed sessions' });
//     }

//     // Create new feedback entry
//     const newFeedback = new Feedback({
//       appointmentId,
//       studentId: req.user.userId,
//       therapistId: appointment.therapistId._id,
//       feedback,
//       rating,
//     });

//     // Save feedback to the database
//     const savedFeedback = await newFeedback.save();

//     // Respond with success
//     res.status(201).json({
//       message: 'Feedback submitted successfully',
//       feedback: savedFeedback,
//     });
//   } catch (error) {
//     console.error('Error submitting feedback:', error);
//     res.status(500).json({ error: 'Error submitting feedback' });
//   }
// });

// // Route to get feedback for a specific appointment (admin and student can view)
// app.get('/api/feedback/:appointmentId', authenticate, async (req, res) => {
//   const { appointmentId } = req.params;

//   // Ensure the logged-in user is either an admin or the student who booked the appointment
//   if (req.user.role !== 'admin') {
//     const appointment = await Appointment.findById(appointmentId).populate('studentId');
//     if (appointment.studentId._id.toString() !== req.user.userId) {
//       return res.status(403).json({ error: 'You can only view feedback for your own appointments' });
//     }
//   }

//   try {
//     // Find the feedback by appointment ID
//     const feedback = await Feedback.findOne({ appointmentId })
//       .populate('studentId therapistId')
//       .exec();

//     if (!feedback) {
//       return res.status(404).json({ error: 'Feedback not found for this appointment' });
//     }

//     res.status(200).json({
//       feedback,
//     });
//   } catch (error) {
//     console.error('Error fetching feedback:', error);
//     res.status(500).json({ error: 'Error fetching feedback' });
//   }
// });

// const axios = require('axios'); // Import Axios for API calls

// // Route to handle chatbot interactions
// app.post('/api/chatbot', async (req, res) => {
//   const { message } = req.body;

//   if (!message) {
//     return res.status(400).json({ error: 'Message is required' });
//   }

//   try {
//     // Make a request to the Groq Cloud API (Llama 3.2)
//     const response = await axios.post(
//       'https://api.groq.com/v1/chat', // Replace with the actual Groq Cloud API endpoint
//       {
//         prompt: message,
//         max_tokens: 150, // Adjust token limit as needed
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // Use your API key from .env
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     // Respond with the chatbot's reply
//     res.status(200).json({ reply: response.data.reply });
//   } catch (error) {
//     console.error('Error communicating with chatbot API:', error.message);
//     res.status(500).json({ error: 'Error communicating with chatbot API' });
//   }
// });

// startServer();

