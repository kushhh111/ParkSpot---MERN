const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  registerDriver,
  verifyDriverOtp,
  registerDriverDirect,
  loginDriverDirect,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/register/driver', registerDriver);
router.post('/register/driver/verify', verifyDriverOtp);
router.post('/register-driver', registerDriverDirect);
router.post('/login-driver', loginDriverDirect);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/reset-password/:resettoken', resetPassword);

module.exports = router;
