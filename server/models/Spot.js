const mongoose = require('mongoose');

const spotSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title for the spot'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please add a description'],
    },
    address: {
      type: String,
      required: [true, 'Please add an address'],
    },
    city: {
      type: String,
      required: [true, 'Please add a city'],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, 'Please add a pincode'],
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
        required: true,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    photos: {
      type: [String],
      default: [],
    },
    spotType: {
      type: String,
      enum: ['open', 'covered', 'basement'],
      required: true,
    },
    vehicleType: {
      type: String,
      enum: ['bike', 'car', 'both'],
      required: true,
    },
    pricePerHour: {
      type: Number,
      required: [true, 'Please add price per hour'],
      min: [0, 'Price cannot be negative'],
    },
    availability: {
      days: {
        type: [String], // e.g., ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
        required: true,
      },
      startTime: {
        type: String, // e.g., '08:00'
        required: true,
      },
      endTime: {
        type: String, // e.g., '20:00'
        required: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    totalSlots: {
      type: Number,
      required: [true, 'Please add the total number of slots/capacity'],
      min: [1, 'Capacity must be at least 1 slot'],
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Create a 2dsphere index for location-based search
spotSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Spot', spotSchema);
