const ErrorHandler = require('../utils/ErrorHandler');

const errorMiddleware = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || 'Internal Server Error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error:', err);
  }

  // MongoDB CastError (Invalid ObjectId)
  if (err.name === 'CastError') {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 404);
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    err = new ErrorHandler(message, 400);
  }

  // JWT Error
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please login again.';
    err = new ErrorHandler(message, 401);
  }

  // JWT Expired Error
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired. Please login again.';
    err = new ErrorHandler(message, 401);
  }

  // MongoDB Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map((value) => value.message).join(', ');
    err = new ErrorHandler(message, 400);
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File size too large. Maximum size is 5MB.';
    err = new ErrorHandler(message, 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Too many files uploaded.';
    err = new ErrorHandler(message, 400);
  }

  // Rate limiting error
  if (err.statusCode === 429) {
    const message = 'Too many requests. Please try again later.';
    err = new ErrorHandler(message, 429);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err,
      stack: err.stack 
    })
  });
};

module.exports = errorMiddleware;
