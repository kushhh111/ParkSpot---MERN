const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Spot = require('../models/Spot');
const Booking = require('../models/Booking');
const Review = require('../models/Review');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parkspot';

const seedData = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    // Clear existing data
    console.log('Clearing old database entries...');
    await User.deleteMany({});
    await Spot.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    console.log('Database cleared.');

    // Create Mock Users
    console.log('Creating mock users...');
    const driver = await User.create({
      name: 'Jane Driver',
      email: 'driver@parkspot.in',
      password: 'password123',
      phone: '9876543210',
      role: 'driver',
      isVerified: true
    });

    const owner = await User.create({
      name: 'John Owner',
      email: 'owner@parkspot.in',
      password: 'password123',
      phone: '9123456789',
      role: 'owner',
      isVerified: true
    });

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@parkspot.in',
      password: 'password123',
      phone: '9999999999',
      role: 'admin',
      isVerified: true
    });

    console.log(`Mock Users Created:`);
    console.log(`- Driver: ${driver.email} (password: password123)`);
    console.log(`- Owner: ${owner.email} (password: password123)`);
    console.log(`- Admin: ${admin.email} (password: password123)`);

    // Create Mock Spots
    console.log('Creating mock spots...');
    const spot1 = await Spot.create({
      owner: owner._id,
      title: 'Sleek Basement Parking Slot - Mumbai Central',
      description: 'Secure, covered basement parking spot equipped with 24/7 CCTV surveillance, fire detectors, and professional security guards.',
      address: 'Plot 42, Sector 5, Mumbai Central',
      city: 'Mumbai',
      pincode: '400008',
      location: {
        type: 'Point',
        coordinates: [72.8205, 18.9696]
      },
      photos: [],
      spotType: 'basement',
      vehicleType: 'car',
      pricePerHour: 80,
      availability: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        startTime: '08:00',
        endTime: '22:00'
      },
      isActive: true,
      rating: 4.8,
      totalReviews: 5,
      totalSlots: 3
    });

    const spot2 = await Spot.create({
      owner: owner._id,
      title: 'Prime Covered Car Spot - Bandra West',
      description: 'Easy-access covered street-level parking spot ideal for SUVs, sedans, and hatchback cars.',
      address: 'Hill Road, Bandra West',
      city: 'Mumbai',
      pincode: '400050',
      location: {
        type: 'Point',
        coordinates: [72.8258, 19.0544]
      },
      photos: [],
      spotType: 'covered',
      vehicleType: 'both',
      pricePerHour: 100,
      availability: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        startTime: '00:00',
        endTime: '23:59'
      },
      isActive: true,
      rating: 4.5,
      totalReviews: 3,
      totalSlots: 5
    });

    const spot3 = await Spot.create({
      owner: owner._id,
      title: 'Budget Open Bike Slot - Thane East',
      description: 'Affordable outdoor parking space for two-wheelers only. Located near the Thane station entrance.',
      address: 'Station Road, Thane East',
      city: 'Thane',
      pincode: '400603',
      location: {
        type: 'Point',
        coordinates: [72.9781, 19.1860]
      },
      photos: [],
      spotType: 'open',
      vehicleType: 'bike',
      pricePerHour: 30,
      availability: {
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        startTime: '09:00',
        endTime: '18:00'
      },
      isActive: true,
      rating: 4.0,
      totalReviews: 2,
      totalSlots: 10
    });

    console.log(`Mock Spots Created successfully.`);

    // Create a mock active booking
    const today = new Date();
    const startBooking = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours() + 1, 0, 0);
    const endBooking = new Date(today.getFullYear(), today.getMonth(), today.getDate(), today.getHours() + 3, 0, 0);

    const booking = await Booking.create({
      driver: driver._id,
      spot: spot1._id,
      startTime: startBooking,
      endTime: endBooking,
      durationHours: 2,
      totalPrice: 160,
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentId: 'pay_mock_12345678',
      razorpayOrderId: 'order_mock_12345678'
    });

    console.log(`Mock booking created for spot: ${spot1.title}`);

    console.log('Database Seeding finished successfully!');
    process.exit(0);
  } catch (err) {
    console.error(`Seeding error: ${err.message}`);
    process.exit(1);
  }
};

seedData();
