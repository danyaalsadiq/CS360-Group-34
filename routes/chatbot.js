const express = require('express');
const axios = require('axios'); // Import Axios for API calls
const authenticate = require('../middleware/authenticate'); // Import authentication middleware
const router = express.Router();

// Route to handle chatbot interactions
router.post('/', authenticate, async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Make a request to the Groq Cloud API (Llama 3.2)
    const response = await axios.post(
      'https://api.groq.com/v1/chat', // Replace with the actual Groq Cloud API endpoint
      {
        prompt: message,
        max_tokens: 150, // Adjust token limit as needed
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`, // Use your API key from .env
          'Content-Type': 'application/json',
        },
      }
    );

    // Respond with the chatbot's reply
    res.status(200).json({ reply: response.data.reply });
  } catch (error) {
    console.error('Error communicating with chatbot API:', error.message);
    res.status(500).json({ error: 'Error communicating with chatbot API' });
  }
});

module.exports = router;
