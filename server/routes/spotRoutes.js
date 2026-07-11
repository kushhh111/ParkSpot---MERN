const express = require('express');
const {
  getSpots,
  getNearbySpots,
  getSpotById,
  createSpot,
  updateSpot,
  deleteSpot,
  getMySpots,
} = require('../controllers/spotController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

// Public routes
router.get('/', getSpots);
router.get('/nearby', getNearbySpots);
router.get('/my-spots', protect, authorize('owner', 'admin'), getMySpots);
router.get('/:id', getSpotById);


router.post(
  '/',
  protect,
  authorize('owner', 'admin'),
  upload.array('photos', 5),
  createSpot
);
router.put(
  '/:id',
  protect,
  authorize('owner', 'admin'),
  upload.array('photos', 5),
  updateSpot
);
router.delete('/:id', protect, authorize('owner', 'admin'), deleteSpot);

module.exports = router;
