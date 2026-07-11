const Razorpay = require('razorpay');
const crypto = require('crypto');
const Booking = require('../models/Booking');
const Spot = require('../models/Spot');
const sendEmail = require('../utils/sendEmail');

// Check if Razorpay keys are valid (not placeholders)
const isRazorpayConfigured =
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_ID !== 'rzp_test_placeholder_key_id' &&
  process.env.RAZORPAY_KEY_SECRET &&
  process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_placeholder_key_secret';

let razorpay;
if (isRazorpayConfigured) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.log('Razorpay keys not configured. Running in Mock Payment Mode.');
}

// Helper function to process refunds
const refundPaymentHelper = async (booking) => {
  if (isRazorpayConfigured) {
    if (!booking.paymentId) {
      throw new Error('No payment transaction ID found to execute refund');
    }
    const refund = await razorpay.payments.refund(booking.paymentId, {
      amount: Math.round(booking.totalPrice * 100), // full refund in paise
      notes: { reason: 'Booking cancelled by customer (>2hrs before start)' },
    });
    return refund;
  } else {
    // Mock refund output
    const mockRefundId = `rfnd_mock_${crypto.randomBytes(8).toString('hex')}`;
    console.log(
      `[MOCK REFUND] Refund generated: ${mockRefundId} for amount ${booking.totalPrice} INR`
    );
    return {
      id: mockRefundId,
      amount: booking.totalPrice * 100,
      status: 'processed',
    };
  }
};

// @desc    Create a Razorpay order
// @route   POST /api/payments/create-order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a bookingId',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking reservation not found',
      });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This booking is not in a pending payment state',
      });
    }

    const amountInPaise = Math.round(booking.totalPrice * 100);

    if (isRazorpayConfigured) {
      // Actual Razorpay Order Creation
      const options = {
        amount: amountInPaise,
        currency: 'INR',
        receipt: booking._id.toString(),
      };

      const order = await razorpay.orders.create(options);
      booking.razorpayOrderId = order.id;
      await booking.save();

      return res.status(200).json({
        success: true,
        keyId: process.env.RAZORPAY_KEY_ID,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        booking,
      });
    } else {
      // Mock Order Creation
      const mockOrderId = `order_mock_${crypto.randomBytes(8).toString('hex')}`;
      booking.razorpayOrderId = mockOrderId;
      await booking.save();

      return res.status(200).json({
        success: true,
        orderId: mockOrderId,
        amount: amountInPaise,
        currency: 'INR',
        booking,
        mockMode: true,
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Verify Razorpay payment signature and confirm booking
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!bookingId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters',
      });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (isRazorpayConfigured) {
      // Verify signature integrity
      const text = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({
          success: false,
          message: 'Payment verification failed: cryptographic signature mismatch',
        });
      }
    } else {
      console.log('[MOCK PAYMENT] Signature verification bypassed.');
    }

    const spot = await Spot.findById(booking.spot);
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Associated parking spot not found',
      });
    }

    // Check if confirming this booking would exceed the spot's total capacity/slots
    // We check for active overlapping bookings (excluding this booking itself)
    const overlappingBookingsCount = await Booking.countDocuments({
      _id: { $ne: booking._id },
      spot: booking.spot,
      status: { $in: ['confirmed', 'active'] },
      startTime: { $lt: booking.endTime },
      endTime: { $gt: booking.startTime },
    });

    if (overlappingBookingsCount >= (spot.totalSlots || 1)) {
      // The slot is already fully booked by other confirmed bookings!
      // We must mark this booking as cancelled, refund the payment, and report back.
      booking.status = 'cancelled';
      booking.paymentStatus = 'failed';
      booking.paymentId = razorpay_payment_id;
      await booking.save();

      // Trigger automatic refund
      try {
        await refundPaymentHelper(booking);
        booking.paymentStatus = 'refunded';
        await booking.save();
      } catch (refundErr) {
        console.error(`Auto-refund failed for booking ${booking._id}: ${refundErr.message}`);
      }

      return res.status(400).json({
        success: false,
        message: 'This parking slot has already been booked by another driver during the checkout process. Your booking has been cancelled and a full refund was automatically initiated.',
      });
    }

    // Update booking database states
    booking.status = 'confirmed';
    booking.paymentStatus = 'paid';
    booking.paymentId = razorpay_payment_id;
    await booking.save();

    // Fetch details to send detailed email notifications
    const populatedBooking = await Booking.findById(booking._id)
      .populate({
        path: 'spot',
        populate: { path: 'owner', select: 'name email phone' },
      })
      .populate('driver', 'name email phone');

    // Email to driver
    if (populatedBooking.driver && populatedBooking.driver.email) {
      try {
        await sendEmail({
          email: populatedBooking.driver.email,
          subject: 'Booking Confirmed - ParkSpot',
          message: `Hi ${populatedBooking.driver.name},\n\nYour payment of ₹${populatedBooking.totalPrice} is verified and your booking for parking spot "${populatedBooking.spot.title}" is confirmed!\n\nDetails:\nAddress: ${populatedBooking.spot.address}, ${populatedBooking.spot.city}\nTime: ${new Date(populatedBooking.startTime).toLocaleString()} to ${new Date(populatedBooking.endTime).toLocaleString()}\n\nHappy parking!\nThe ParkSpot Team`,
          html: `<h3>Hi ${populatedBooking.driver.name},</h3>
                <p>Your payment of <strong>₹${populatedBooking.totalPrice}</strong> is verified and your booking for parking spot <strong>"${populatedBooking.spot.title}"</strong> is confirmed!</p>
                <p><strong>Reservation Details:</strong></p>
                <ul>
                  <li><strong>Address:</strong> ${populatedBooking.spot.address}, ${populatedBooking.spot.city}</li>
                  <li><strong>Start Time:</strong> ${new Date(populatedBooking.startTime).toLocaleString()}</li>
                  <li><strong>End Time:</strong> ${new Date(populatedBooking.endTime).toLocaleString()}</li>
                  <li><strong>Duration:</strong> ${populatedBooking.durationHours} hours</li>
                </ul>
                <br/>
                <p>Happy parking!</p>
                <p><em>The ParkSpot Team</em></p>`
        });
      } catch (emailErr) {
        console.error(`Driver booking email failed: ${emailErr.message}`);
      }
    } else {
      console.warn('Driver email missing, skipping driver notification email');
    }

    // Email to owner
    if (populatedBooking.spot && populatedBooking.spot.owner && populatedBooking.spot.owner.email) {
      try {
        await sendEmail({
          email: populatedBooking.spot.owner.email,
          subject: 'Your spot has been Booked! - ParkSpot',
          message: `Hi ${populatedBooking.spot.owner.name},\n\nYour listed parking spot "${populatedBooking.spot.title}" has been successfully booked by ${populatedBooking.driver.name}.\n\nReservation Schedule:\nFrom: ${new Date(populatedBooking.startTime).toLocaleString()}\nTo: ${new Date(populatedBooking.endTime).toLocaleString()}\nYour earnings: ₹${populatedBooking.totalPrice}\n\nBest regards,\nThe ParkSpot Team`,
          html: `<h3>Hi ${populatedBooking.spot.owner.name},</h3>
                <p>Your listed parking spot <strong>"${populatedBooking.spot.title}"</strong> has been successfully booked by <strong>${populatedBooking.driver.name}</strong>.</p>
                <p><strong>Reservation Schedule:</strong></p>
                <ul>
                  <li><strong>Start:</strong> ${new Date(populatedBooking.startTime).toLocaleString()}</li>
                  <li><strong>End:</strong> ${new Date(populatedBooking.endTime).toLocaleString()}</li>
                  <li><strong>Your Earnings:</strong> ₹${populatedBooking.totalPrice}</li>
                </ul>
                <br/>
                <p>Best regards,</p>
                <p><em>The ParkSpot Team</em></p>`
        });
      } catch (emailErr) {
        console.error(`Owner booking email failed: ${emailErr.message}`);
      }
    } else {
      console.warn('Owner email missing, skipping owner notification email');
    }

    // Emit real-time WebSocket events
    const io = req.app.get('socketio');
    if (io) {
      io.to(populatedBooking.driver._id.toString()).emit('booking:confirmed', populatedBooking);
      io.to(populatedBooking.spot.owner._id.toString()).emit('booking:confirmed', populatedBooking);
      io.emit('spot:booked', { spotId: populatedBooking.spot._id });
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Refund a payment on cancellation
// @route   POST /api/payments/refund/:bookingId
// @access  Private
const refundPayment = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    if (booking.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has not been paid, cannot execute refund',
      });
    }

    const refund = await refundPaymentHelper(booking);

    booking.paymentStatus = 'refunded';
    booking.status = 'cancelled';
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      refund,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  refundPayment,
  refundPaymentHelper,
};
