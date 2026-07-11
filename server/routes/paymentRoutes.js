const express = require('express');
const {
  createOrder,
  verifyPayment,
  refundPayment,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Require login for all payment endpoints
router.use(protect);

router.post('/create-order', createOrder);
router.post('/verify', verifyPayment);
router.post('/refund/:bookingId', refundPayment);

module.exports = router;
