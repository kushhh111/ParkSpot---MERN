const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const connectDB = require('./config/db');

// Load environment variables from the parent directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Register models
require('./models/User');
require('./models/Spot');
require('./models/Booking');
require('./models/Review');

// Connect to database
connectDB();

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  },
});

// Share Socket.io server instance globally via Express settings
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  // User joins a targeted private channel named after their Mongoose User ID
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined private channel room: ${userId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Body parser middleware
app.use(express.json());

// Cookie parser middleware
app.use(cookieParser());

// Enable CORS with support for credentials and specific origins
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Prevent NoSQL Injection attacks by sanitizing request data
// Redefine req.query descriptor for Express 5 support before mongoSanitize is applied
app.use((req, res, next) => {
  if (req.query) {
    Object.defineProperty(req, 'query', {
      value: req.query,
      writable: true,
      configurable: true,
      enumerable: true
    });
  }
  next();
});

const mongoSanitize = require('express-mongo-sanitize');
app.use(mongoSanitize());

// Global Rate Limiter
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
}));

// Strict Rate Limiter for Authentication endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 15, // relaxed limit for local development testing
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply strict rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(cors({
  origin: [
    'http://localhost:5173', 'http://127.0.0.1:5173',
    'http://localhost:5174', 'http://127.0.0.1:5174'
  ],
  credentials: true,
}));

// Serve static uploads folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount routers
const authRoutes = require('./routes/authRoutes');
const spotRoutes = require('./routes/spotRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/spots', spotRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ParkSpot Backend API is running correctly',
    timestamp: new Date(),
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error caught in middleware:', err.message);
  res.status(err.status || 400).json({
    success: false,
    message: err.message || 'An internal server error occurred',
  });
});

const PORT = process.env.PORT || 5000;

const startReminderScheduler = require('./utils/scheduler');

const expressServer = httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Start the 10-minute warning cron scheduler
  startReminderScheduler(io);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  expressServer.close(() => process.exit(1));
});
// Nodemon trigger change comment
