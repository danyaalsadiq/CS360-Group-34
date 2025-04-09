const jwt = require('jsonwebtoken');

// Middleware to authenticate JWT token
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from Authorization header
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  try {
    // Verify the token using the JWT_SECRET
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified; // Attach the user’s data (including _id) to the request object

    // Log the user data for debugging
    console.log('Authenticated User:', req.user);

    next(); // Proceed to the next middleware or route
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
};

module.exports = authenticate;
