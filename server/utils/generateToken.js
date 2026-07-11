const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token and sets it as an HTTP-only cookie in the response.
 * @param {Object} res - Express response object
 * @param {string} userId - User's MongoDB ObjectID
 * @returns {string} token
 */
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };

  res.cookie('token', token, cookieOptions);

  return token;
};

module.exports = generateToken;
