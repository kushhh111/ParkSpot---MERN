const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    otp: {
      type: String,
      required: [true, 'OTP is required'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 300 }, // 300 seconds = 5 minutes TTL
    },
  }
);

module.exports = mongoose.model('Otp', otpSchema);
