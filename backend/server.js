const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');

// Import utilities
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/error');
const ErrorHandler = require('./utils/ErrorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

// Load environment variables
dotenv.config();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`❌ Uncaught Exception: ${err.message}`);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});

// Connect to MongoDB
connectDB();

const app = express();

// Trust proxy for accurate IP addresses (important for rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      process.env.CLIENT_URL
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
app.use('/api/', apiLimiter);

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ElectroStore API is running successfully!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ElectroStore API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      orders: '/api/orders',
      categories: '/api/categories',
      admin: '/api/admin',
      health: '/api/health'
    },
    documentation: `${req.protocol}://${req.get('host')}/api/docs`
  });
});

// 404 handler for undefined routes
app.all('*', (req, res, next) => {
  next(new ErrorHandler(`Route ${req.originalUrl} not found`, 404));
});

// Global error handling middleware
app.use(errorMiddleware);

// Server configuration
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 API docs: http://localhost:${PORT}/api`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`❌ Unhandled Rejection: ${err.message}`);
  console.log('Shutting down the server due to unhandled promise rejection');
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down gracefully');
  server.close(() => {
    console.log('💀 Process terminated');
  });
});

module.exports = app;
