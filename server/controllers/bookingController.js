const Booking = require('../models/Booking');
const Spot = require('../models/Spot');
const { refundPaymentHelper } = require('./paymentController');
const { isBefore, addDays, isAfter } = require('date-fns');

// @desc    Create a new booking reservation (Pending Payment)
// @route   POST /api/bookings
// @access  Private (Driver only)
const createBooking = async (req, res) => {
  try {
    const { spot: spotId, startTime, endTime } = req.body;

    if (!spotId || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide spot ID, startTime, and endTime',
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Validate that startTime is not in the past (with a 5-minute grace period for latency/clock drift)
    const graceTime = new Date(Date.now() - 5 * 60 * 1000);
    if (isBefore(start, graceTime)) {
      return res.status(400).json({
        success: false,
        message: 'Booking start time must be in the future',
      });
    }

    // Validate dates
    if (end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Booking end time must be after start time',
      });
    }

    // Validate that the endTime is within a 24-hour range of startTime using date-fns
    if (isAfter(end, addDays(start, 1))) {
      return res.status(400).json({
        success: false,
        message: 'Booking duration cannot exceed 24 hours from the start time',
      });
    }

    // Check if spot exists and is active
    const spot = await Spot.findById(spotId);
    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found',
      });
    }

    if (!spot.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This parking spot is currently inactive',
      });
    }

    // Helper to evaluate bounds in Indian Standard Time (IST, UTC+5:30) timezone offset shift
    const getIndiaDateComponents = (dateObj) => {
      const istOffset = 5.5 * 60 * 60 * 1000;
      const indiaDate = new Date(dateObj.getTime() + istOffset);
      
      const pad = (num) => String(num).padStart(2, '0');
      const hh = pad(indiaDate.getUTCHours());
      const mm = pad(indiaDate.getUTCMinutes());
      
      const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = weekdays[indiaDate.getUTCDay()];
      
      return {
        year: indiaDate.getUTCFullYear(),
        month: indiaDate.getUTCMonth(),
        date: indiaDate.getUTCDate(),
        day,
        hhmm: `${hh}:${mm}`
      };
    };

    const startInfo = getIndiaDateComponents(start);
    const endInfo = getIndiaDateComponents(end);

    const limitStart = spot.availability?.startTime || '00:00';
    const limitEnd = spot.availability?.endTime || '23:59';

    const isSameDay = startInfo.year === endInfo.year && startInfo.month === endInfo.month && startInfo.date === endInfo.date;

    if (isSameDay) {
      // 1. Validate Operational Days Availability
      if (!spot.availability?.days?.includes(startInfo.day)) {
        return res.status(400).json({
          success: false,
          message: `This parking spot is not available on ${startInfo.day}s`,
        });
      }

      // 2. Validate Operational Hours Range
      if (startInfo.hhmm < limitStart || endInfo.hhmm > limitEnd) {
        return res.status(400).json({
          success: false,
          message: `Selected times must fall within the spot's operational hours: ${limitStart} - ${limitEnd}`,
        });
      }
    } else {
      // Spans across midnight
      // 1. Validate Operational Days Availability on both start day and end day
      if (!spot.availability?.days?.includes(startInfo.day)) {
        return res.status(400).json({
          success: false,
          message: `This parking spot is not available on ${startInfo.day}s`,
        });
      }
      if (!spot.availability?.days?.includes(endInfo.day)) {
        return res.status(400).json({
          success: false,
          message: `This parking spot is not available on ${endInfo.day}s (end day of booking)`,
        });
      }

      // 2. Validate Operational Hours Range for Day 1 (Must not close before midnight, i.e., limitEnd must be 23:59)
      if (startInfo.hhmm < limitStart || limitEnd < '23:59') {
        return res.status(400).json({
          success: false,
          message: `Selected hours exceed the operational time of the spot. Overnight parking is not allowed because the spot closes at ${limitEnd}.`,
        });
      }

      // 3. Validate Operational Hours Range for Day 2 (Must open at midnight, i.e., limitStart must be 00:00)
      if (limitStart > '00:00' || endInfo.hhmm > limitEnd) {
        return res.status(400).json({
          success: false,
          message: `Selected hours exceed the operational time of the spot. Overnight parking is not allowed because the spot opens at ${limitStart}.`,
        });
      }
    }

    // Check for overlapping bookings (exclude pending bookings older than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const activeOverlappingBookingsCount = await Booking.countDocuments({
      spot: spotId,
      $or: [
        { status: { $in: ['confirmed', 'active'] } },
        { status: 'pending', createdAt: { $gt: tenMinutesAgo } }
      ],
      startTime: { $lt: end },
      endTime: { $gt: start },
    });

    if (activeOverlappingBookingsCount >= (spot.totalSlots || 1)) {
      return res.status(400).json({
        success: false,
        message: 'This parking spot is fully booked during the requested timeframe',
      });
    }

    // Calculate duration in hours (rounded up)
    const diffMs = end - start;
    const durationHours = Math.ceil(diffMs / (1000 * 60 * 60));

    // Calculate total price
    const totalPrice = durationHours * spot.pricePerHour;

    const booking = await Booking.create({
      driver: req.user._id,
      spot: spotId,
      startTime: start,
      endTime: end,
      durationHours,
      totalPrice,
      status: 'pending',
      paymentStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get all bookings for the authenticated Driver
// @route   GET /api/bookings/my-bookings
// @access  Private (Driver only)
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ driver: req.user._id })
      .populate('spot')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
// @access  Private
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'spot',
        populate: { path: 'owner', select: 'name email phone' },
      })
      .populate('driver', 'name email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Auth validation: requester must be driver, owner, or admin
    const isDriver = booking.driver._id.toString() === req.user._id.toString();
    const isOwner = booking.spot.owner._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDriver && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorised to view this booking reservation',
      });
    }

    res.status(200).json({
      success: true,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('spot');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Auth validation: requester must be driver, owner, or admin
    const isDriver = booking.driver.toString() === req.user._id.toString();
    const isOwner = booking.spot.owner.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isDriver && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorised to cancel this booking',
      });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This booking is already cancelled',
      });
    }

    if (booking.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed bookings cannot be cancelled',
      });
    }

    // Cancellation policy: refund check if cancelled >2 hours before start
    const hoursToStart = (new Date(booking.startTime) - Date.now()) / (1000 * 60 * 60);
    let refundTriggered = false;

    if (booking.paymentStatus === 'paid') {
      if (hoursToStart >= 2) {
        try {
          await refundPaymentHelper(booking);
          booking.paymentStatus = 'refunded';
          refundTriggered = true;
        } catch (refundErr) {
          console.error(`Refund failed on cancellation: ${refundErr.message}`);
          return res.status(500).json({
            success: false,
            message: `Cancellation failed: refund could not be processed. ${refundErr.message}`,
          });
        }
      } else {
        // No refund (cancelled within 2 hours of start time)
        console.log(`Booking cancelled within 2 hours. No refund generated.`);
      }
    }

    booking.status = 'cancelled';
    await booking.save();

    // Emit real-time WebSocket events
    const io = req.app.get('socketio');
    if (io) {
      io.to(booking.driver.toString()).emit('booking:cancelled', { bookingId: booking._id });
      io.to(booking.spot.owner.toString()).emit('booking:cancelled', { bookingId: booking._id });
      io.emit('spot:available', { spotId: booking.spot._id });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      refundTriggered,
      data: booking,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get all bookings for spots listed by authenticated Owner
// @route   GET /api/bookings/owner-bookings
// @access  Private (Owner only)
const getOwnerBookings = async (req, res) => {
  try {
    // Find all spots listed by the owner
    const spots = await Spot.find({ owner: req.user._id }).select('_id');
    const spotIds = spots.map((s) => s._id);

    // Find bookings on those spots
    const bookings = await Booking.find({ spot: { $in: spotIds } })
      .populate('spot')
      .populate('driver', 'name email phone')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getOwnerBookings,
};
