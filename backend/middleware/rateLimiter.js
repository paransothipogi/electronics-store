const rateLimit = require('express-rate-limit');
const ErrorHandler = require('../utils/ErrorHandler');

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new ErrorHandler('Too many requests from this IP, please try again later.', 429));
  }
});

// Strict rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  skipSuccessfulRequests: true,
  handler: (req, res, next) => {
    next(new ErrorHandler('Too many authentication attempts, please try again after 15 minutes.', 429));
  }
});

// Password reset rate limiting
const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again after 1 hour.'
  },
  handler: (req, res, next) => {
    next(new ErrorHandler('Too many password reset attempts, please try again after 1 hour.', 429));
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  passwordResetLimiter
};
