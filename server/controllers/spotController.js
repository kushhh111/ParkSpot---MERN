const Spot = require('../models/Spot');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

const getActiveBookingsCount = async (spotId) => {
  const Booking = require('../models/Booking');
  const now = new Date();
  return await Booking.countDocuments({
    spot: spotId,
    status: { $in: ['confirmed', 'active'] },
    startTime: { $lte: now },
    endTime: { $gte: now }
  });
};

// Configure Cloudinary if credentials are provided in .env
const isCloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'cloudinary_cloud_placeholder' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_KEY !== 'cloudinary_key_placeholder';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/**
 * Helper function to upload photos to Cloudinary or fallback to local files.
 * @param {Array} files - Files array from Multer
 * @returns {Promise<Array<string>>} List of file URLs
 */
const uploadImages = async (files) => {
  const photoUrls = [];
  if (!files || files.length === 0) return photoUrls;

  for (const file of files) {
    if (isCloudinaryConfigured) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'parkspot',
        });
        photoUrls.push(result.secure_url);
        // Clean up local temp file
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      } catch (err) {
        console.error(`Cloudinary upload failed: ${err.message}. Using local path.`);
        photoUrls.push(`/uploads/${file.filename}`);
      }
    } else {
      // Use local static server path as fallback
      photoUrls.push(`/uploads/${file.filename}`);
    }
  }
  return photoUrls;
};

// @desc    Get all spots with query filters
// @route   GET /api/spots
// @access  Public
const getSpots = async (req, res) => {
  try {
    const { city, vehicleType, maxPrice, minRating } = req.query;

    const query = { isActive: true };

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    if (vehicleType && vehicleType !== 'both') {
      query.vehicleType = { $in: [vehicleType, 'both'] };
    }

    if (maxPrice) {
      query.pricePerHour = { $lte: parseFloat(maxPrice) };
    }

    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    const spots = await Spot.find(query).populate('owner', 'name email phone');

    const spotsWithCount = await Promise.all(
      spots.map(async (spot) => {
        const spotObj = spot.toObject();
        spotObj.activeBookingsCount = await getActiveBookingsCount(spot._id);
        return spotObj;
      })
    );

    res.status(200).json({
      success: true,
      count: spotsWithCount.length,
      data: spotsWithCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get spots nearby using geospatial query
// @route   GET /api/spots/nearby
// @access  Public
const getNearbySpots = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide longitude and latitude query parameters',
      });
    }

    // Default max distance is 5km (5000 meters)
    const distanceLimit = parseFloat(maxDistance) || 5000;

    const spots = await Spot.find({
      isActive: true,
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: distanceLimit,
        },
      },
    }).populate('owner', 'name email phone');

    const spotsWithCount = await Promise.all(
      spots.map(async (spot) => {
        const spotObj = spot.toObject();
        spotObj.activeBookingsCount = await getActiveBookingsCount(spot._id);
        return spotObj;
      })
    );

    res.status(200).json({
      success: true,
      count: spotsWithCount.length,
      data: spotsWithCount,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get single spot detail
// @route   GET /api/spots/:id
// @access  Public
const getSpotById = async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id).populate(
      'owner',
      'name email phone profilePhoto'
    );

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found',
      });
    }

    const Booking = require('../models/Booking');
    const now = new Date();
    const activeBookingsCount = await Booking.countDocuments({
      spot: spot._id,
      status: { $in: ['confirmed', 'active'] },
      startTime: { $lte: now },
      endTime: { $gte: now }
    });

    const spotData = spot.toObject();
    spotData.activeBookingsCount = activeBookingsCount;

    res.status(200).json({
      success: true,
      data: spotData,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Create a new parking spot Listing
// @route   POST /api/spots
// @access  Private (Owner only)
const createSpot = async (req, res) => {
  try {
    const {
      title,
      description,
      address,
      city,
      pincode,
      longitude,
      latitude,
      spotType,
      vehicleType,
      pricePerHour,
      days,
      startTime,
      endTime,
    } = req.body;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Please provide coordinates (longitude and latitude) for the spot',
      });
    }

    // Handle photo uploads
    const photos = await uploadImages(req.files);

    // Parse days array
    let parsedDays = days;
    if (typeof days === 'string') {
      try {
        parsedDays = JSON.parse(days);
      } catch (e) {
        parsedDays = days.split(',').map((d) => d.trim());
      }
    }

    const spot = await Spot.create({
      owner: req.user._id,
      title,
      description,
      address,
      city,
      pincode,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      photos,
      spotType,
      vehicleType,
      pricePerHour: parseFloat(pricePerHour),
      totalSlots: req.body.totalSlots ? parseInt(req.body.totalSlots, 10) : 1,
      availability: {
        days: parsedDays || [],
        startTime,
        endTime,
      },
    });

    res.status(201).json({
      success: true,
      data: spot,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Update a parking spot listing
// @route   PUT /api/spots/:id
// @access  Private (Owner only)
const updateSpot = async (req, res) => {
  try {
    let spot = await Spot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found',
      });
    }

    // Check if requester is owner or admin
    if (
      spot.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorised to modify this parking spot',
      });
    }

    const updates = { ...req.body };

    // Upload new photos if present
    if (req.files && req.files.length > 0) {
      const newPhotos = await uploadImages(req.files);
      updates.photos = [...(spot.photos || []), ...newPhotos];
    }

    if (req.body.totalSlots) {
      updates.totalSlots = parseInt(req.body.totalSlots, 10);
    }

    // If location coords are updated
    if (req.body.longitude && req.body.latitude) {
      updates.location = {
        type: 'Point',
        coordinates: [
          parseFloat(req.body.longitude),
          parseFloat(req.body.latitude),
        ],
      };
    }

    // Handle availability updates
    if (req.body.days || req.body.startTime || req.body.endTime) {
      let parsedDays = req.body.days;
      if (typeof parsedDays === 'string') {
        try {
          parsedDays = JSON.parse(parsedDays);
        } catch (e) {
          parsedDays = parsedDays.split(',').map((d) => d.trim());
        }
      }
      updates.availability = {
        days: parsedDays || spot.availability.days,
        startTime: req.body.startTime || spot.availability.startTime,
        endTime: req.body.endTime || spot.availability.endTime,
      };
    }

    spot = await Spot.findByIdAndUpdate(req.params.id, updates, {
      returnDocument: 'after',
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: spot,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Delete a parking spot listing
// @route   DELETE /api/spots/:id
// @access  Private (Owner only)
const deleteSpot = async (req, res) => {
  try {
    const spot = await Spot.findById(req.params.id);

    if (!spot) {
      return res.status(404).json({
        success: false,
        message: 'Parking spot not found',
      });
    }

    // Check if requester is owner or admin
    if (
      spot.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorised to delete this parking spot',
      });
    }

    // Delete spot listing (triggers pre/post middlewares)
    await spot.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Parking spot listed has been removed successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// @desc    Get spots listed by authenticated Owner
// @route   GET /api/spots/my-spots
// @access  Private (Owner only)
const getMySpots = async (req, res) => {
  try {
    const spots = await Spot.find({ owner: req.user._id });

    res.status(200).json({
      success: true,
      count: spots.length,
      data: spots,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getSpots,
  getNearbySpots,
  getSpotById,
  createSpot,
  updateSpot,
  deleteSpot,
  getMySpots,
};
