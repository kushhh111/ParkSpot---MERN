const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect routes by validating the JWT stored in httpOnly cookie or authorization header.
 */
const protect = async (req, res, next) => {
  let token;

  // Read token from cookies or authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Ensure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token is missing',
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database and attach to request
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists',
      });
    }

    next();
  } catch (err) {
    console.error(`JWT Verification Error: ${err.message}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route, token is invalid or expired',
    });
  }
};

module.exports = { protect };
