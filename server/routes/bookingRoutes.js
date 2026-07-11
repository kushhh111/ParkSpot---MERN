const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  getOwnerBookings,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

// All booking routes require authentication
router.use(protect);

router.post('/', authorize('driver', 'admin'), createBooking);
router.get('/my-bookings', authorize('driver', 'admin'), getMyBookings);
router.get('/owner-bookings', authorize('owner', 'admin'), getOwnerBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);

module.exports = router;
