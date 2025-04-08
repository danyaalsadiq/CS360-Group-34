const express = require('express');
const Availability = require('../models/availability');
const authenticate = require('../middleware/authenticate'); // Import authentication middleware
const router = express.Router();

// Route to update therapist availability (protected route)
router.put('/', authenticate, async (req, res) => {
  const { date, slots } = req.body;

  // Ensure the logged-in user is a therapist
  if (req.user.role !== 'therapist') {
    return res.status(403).json({ error: 'Only therapists can update availability' });
  }

  // Validate slots format
  if (!Array.isArray(slots) || slots.some(slot => !slot.startTime || !slot.endTime || !slot.status)) {
    return res.status(400).json({ error: 'Invalid slots format' });
  }

  try {
    // Check if availability already exists for this therapist on the given date
    let availability = await Availability.findOne({ therapistId: req.user.userId, date });

    // If availability does not exist, create a new entry
    if (!availability) {
      availability = new Availability({
        therapistId: req.user.userId, // Use the therapist's _id from the authenticated user
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
    console.error('Error updating availability:', error.message, error.stack);
    res.status(500).json({ error: 'Error updating availability', details: error.message });
  }
});

module.exports = router;
