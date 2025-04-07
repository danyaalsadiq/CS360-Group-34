const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

// Sign Up Route
router.post('/signup', async (req, res) => {
  const { username, password, email, role } = req.body;

  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      role,
    });

    // Save the new user to the database
    const user = await newUser.save();
    res.status(201).json({ message: 'User created successfully', user });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Find the user by username
      const user = await User.findOne({ username });
      if (!user) {
        console.log('User not found'); // Debugging log
        return res.status(400).json({ error: 'Invalid username or password' });
      }
  
      // Compare the password with the hashed password in the database
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log('Password mismatch'); // Debugging log
        return res.status(400).json({ error: 'Invalid username or password' });
      }
  
      // Generate a JWT token
      const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token will expire in 1 hour
      });
  
      console.log('Login successful'); // Debugging log
      res.json({ message: 'Login successful', token });
  
    } catch (err) {
      console.error(err); // Log any errors
      res.status(500).json({ error: 'Error logging in' });
    }
  });  

module.exports = router;
