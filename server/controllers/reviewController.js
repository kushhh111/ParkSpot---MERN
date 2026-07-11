const Review = require('../models/Review');
const Booking = require('../models/Booking');

// @desc    Submit a review for a parking spot
// @route   POST /api/reviews
// @access  Private (Driver only)
const submitReview = async (req, res) => {
  try {
    const { bookingId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'Please provide bookingId, rating (1-5), and comment',
      });
    }

    // Check if booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify booking belongs to the authenticated driver
    if (booking.driver.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorised to review this booking',
      });
    }

    // Check if review already exists for this booking (one review per booking constraint)
    const reviewExists = await Review.findOne({ booking: bookingId });
    if (reviewExists) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this booking',
      });
    }

    // Create review (triggers post-save aggregate rating recalculation hook)
    const review = await Review.create({
      booking: bookingId,
      driver: req.user._id,
      spot: booking.spot,
      rating: parseInt(rating),
      comment,
    });

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get all reviews for a spot
// @route   GET /api/reviews/spot/:spotId
// @access  Public
const getSpotReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ spot: req.params.spotId })
      .populate('driver', 'name profilePhoto')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  submitReview,
  getSpotReviews,
};
