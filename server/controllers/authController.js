const User = require('../models/User');
const Otp = require('../models/Otp');
const generateToken = require('../utils/generateToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

// Simulated SMS sender function
const sendSMS = async (phone, message) => {
  console.log(`\n==================================================`);
  console.log(`[SMS SENDER] Sending to ${phone}: "${message}"`);
  console.log(`==================================================\n`);
  return true;
};

// @desc    Register a new user (driver or owner)
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Type and structure validation
    if (
      typeof name !== 'string' ||
      typeof email !== 'string' ||
      typeof password !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data types provided',
      });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Server-side validation
    if (!trimmedName || !trimmedEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters',
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    if (password.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 5 characters long',
      });
    }

    // Role whitelisting (prevent administrative privilege escalation)
    let finalRole = 'driver';
    if (role === 'owner') {
      finalRole = 'owner';
    }

    // Check if email already registered
    const userExists = await User.findOne({ email: trimmedEmail });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Create user
    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password,
      role: finalRole,
    });

    // Sign JWT and set httpOnly cookie
    generateToken(res, user._id);

    // Send Welcome Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to ParkSpot!',
        message: `Hi ${user.name},\n\nWelcome to ParkSpot! Your account has been registered successfully as a ${user.role}.\n\nYou can now find & reserve parking spots or list your empty space to start earning.\n\nBest regards,\nThe ParkSpot Team`,
        html: `<h3>Hi ${user.name},</h3>
               <p>Welcome to <strong>ParkSpot</strong>!</p>
               <p>Your account has been registered successfully as a <strong>${user.role}</strong>.</p>
               <p>You can now find & reserve parking spots or list your empty space to start earning.</p>
               <br/>
               <p>Best regards,</p>
               <p><em>The ParkSpot Team</em></p>`,
      });
    } catch (emailErr) {
      console.error(`Welcome email failed to send: ${emailErr.message}`);
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

// @desc    Authenticate user and log in
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body types to prevent NoSQL injection via objects
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password format',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: trimmedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Sign JWT and set httpOnly cookie
    generateToken(res, user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

// @desc    Log out user & clear JWT cookie
// @route   POST /api/auth/logout
// @access  Public
const logout = async (req, res) => {
  try {
    // Clear cookie with exact same options as it was set
    res.cookie('token', 'none', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

// @desc    Generate password reset token & email it
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Constant message to prevent user enumeration
    const successResponse = {
      success: true,
      message: 'If that email address exists in our database, we will send you a password reset link shortly.',
    };

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(200).json(successResponse);
    }

    // Get reset token bytes (plain text)
    const resetToken = user.getResetPasswordToken();

    // Save user with token attributes (bypass schema pre-save validation)
    await user.save({ validateBeforeSave: false });

    // Generate reset URL pointing to the frontend reset page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You are receiving this email because you (or someone else) requested a password reset. 
Please click the link below to choose a new password: \n\n ${resetUrl} \n\n If you did not request this, please ignore this email.`;

    const html = `<p>You are receiving this email because you (or someone else) requested a password reset.</p>
                  <p>Please click the link below to choose a new password:</p>
                  <p><a href="${resetUrl}" target="_blank">${resetUrl}</a></p>
                  <p>The link is valid for 10 minutes.</p>
                  <p>If you did not request this, please ignore this email.</p>`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'ParkSpot Password Reset Request',
        message,
        html,
      });

      return res.status(200).json(successResponse);
    } catch (emailErr) {
      console.error(emailErr);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

// @desc    Reset password using reset token
// @route   POST /api/auth/reset-password/:resettoken OR POST /api/auth/reset-password (body: token)
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const rawToken = req.params.resettoken || req.body.token;
    const newPassword = req.body.password;

    if (!rawToken || typeof rawToken !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required to reset password',
      });
    }

    if (!newPassword || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid new password',
      });
    }

    if (newPassword.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 5 characters long',
      });
    }

    // Hash the token to compare with database
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token',
      });
    }

    // Set new password (this will trigger pre-save save-hook password hashing)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log the user in automatically by setting the cookie
    generateToken(res, user._id);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

// @desc    Pre-register driver and send SMS OTP
// @route   POST /api/auth/register/driver
// @access  Public
const registerDriver = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required',
      });
    }

    if (name.length < 2 || name.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Name must be between 2 and 50 characters',
      });
    }

    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    if (password.length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 5 characters long',
      });
    }

    // Check if email already registered
    const userExists = await User.findOne({ email: email.trim().toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Check if phone number already registered
    const phoneExists = await User.findOne({ phone: phone.trim() });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number already exists',
      });
    }

    // Generate secure 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Clean up any existing OTP for this phone first
    await Otp.deleteMany({ phone: phone.trim() });

    // Store OTP temporarily
    await Otp.create({
      phone: phone.trim(),
      otp: otpCode,
    });

    // Send SMS
    await sendSMS(
      phone.trim(),
      `Your ParkSpot verification OTP is ${otpCode}. It is valid for 5 minutes.`
    );

    res.status(200).json({
      success: true,
      message: 'OTP sent successfully to your phone number.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

// @desc    Verify SMS OTP and complete driver registration
// @route   POST /api/auth/register/driver/verify
// @access  Public
const verifyDriverOtp = async (req, res) => {
  try {
    const { name, email, phone, password, otp } = req.body;

    if (!name || !email || !phone || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, password, and OTP are required',
      });
    }

    // Validate the OTP code (allows '123456' as master/bypass OTP in development environment)
    const isDev = process.env.NODE_ENV === 'development';
    const isMasterOtp = isDev && otp.trim() === '123456';

    let otpRecord = null;
    if (!isMasterOtp) {
      otpRecord = await Otp.findOne({
        phone: phone.trim(),
        otp: otp.trim(),
      });

      if (!otpRecord) {
        return res.status(400).json({
          success: false,
          message: 'Invalid or expired OTP verification code',
        });
      }
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Final uniqueness check before creating to prevent race condition
    const emailExists = await User.findOne({ email: trimmedEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    const phoneExists = await User.findOne({ phone: phone.trim() });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number already exists',
      });
    }

    // Create Driver User
    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      password,
      phone: phone.trim(),
      role: 'driver',
      isVerified: true,
    });

    // Delete the verified OTP record
    if (otpRecord) {
      await Otp.deleteOne({ _id: otpRecord._id });
    }

    // Sign JWT and set httpOnly cookie
    generateToken(res, user._id);

    // Send Welcome Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to ParkSpot!',
        message: `Hi ${user.name},\n\nWelcome to ParkSpot! Your account has been registered successfully as a Driver.\n\nYou can now find & reserve parking spots in seconds.\n\nBest regards,\nThe ParkSpot Team`,
        html: `<h3>Hi ${user.name},</h3>
               <p>Welcome to <strong>ParkSpot</strong>!</p>
               <p>Your account has been registered successfully as a <strong>Driver</strong>.</p>
               <p>You can now find & reserve parking spots in seconds.</p>
               <br/>
               <p>Best regards,</p>
               <p><em>The ParkSpot Team</em></p>`,
      });
    } catch (emailErr) {
      console.error(`Welcome email failed to send: ${emailErr.message}`);
    }

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

const registerDriverDirect = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, phone, and password are required',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    // Check if email already registered
    const emailExists = await User.findOne({ email: trimmedEmail });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists',
      });
    }

    // Check if phone number already registered
    const phoneExists = await User.findOne({ phone: trimmedPhone });
    if (phoneExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this phone number already exists',
      });
    }

    // Securely hash the password using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save the document using User.create
    const user = await User.create({
      name: name.trim(),
      email: trimmedEmail,
      phone: trimmedPhone,
      password: hashedPassword,
      role: 'driver',
      isVerified: true,
    });

    // Generate JWT and store in HttpOnly cookie
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // development localhost HTTP
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      message: 'Driver registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error('Error in registerDriverDirect:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'Registration failed',
    });
  }
};

const loginDriverDirect = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Invalid email or password format',
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await User.findOne({ email: trimmedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if role is driver
    if (user.role !== 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. This login is reserved for drivers only.',
      });
    }

    // Verify password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT and store in HttpOnly cookie
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false, // development localhost HTTP
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: 'Driver logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (err) {
    console.error('Error in loginDriverDirect:', err);
    return res.status(500).json({
      success: false,
      message: 'An internal server error occurred',
    });
  }
};

module.exports = {
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
};
