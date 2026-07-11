const express = require('express');
const {
  submitReview,
  getSpotReviews,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// Public route to view spot reviews
router.get('/spot/:spotId', getSpotReviews);

// Protected routes to submit reviews (Driver and Admin only)
router.post('/', protect, authorize('driver', 'admin'), submitReview);

module.exports = router;
