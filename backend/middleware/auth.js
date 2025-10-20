const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');

// Check if user is authenticated
const isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  let token;

  // Get token from header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next(new ErrorHandler('Please login to access this resource', 401));
  }

  try {
    const decodedData = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decodedData.id).select('+password');
    
    if (!req.user) {
      return next(new ErrorHandler('User not found', 401));
    }

    if (!req.user.isActive) {
      return next(new ErrorHandler('Your account has been deactivated', 401));
    }

    next();
  } catch (error) {
    return next(new ErrorHandler('Invalid token', 401));
  }
});

// Check user roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role (${req.user.role}) is not allowed to access this resource`,
          403
        )
      );
    }
    next();
  };
};

// Optional authentication (for features like guest checkout)
const optionalAuth = catchAsyncError(async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.token) {
    token = req.cookies.token;
  }

  if (token) {
    try {
      const decodedData = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decodedData.id);
    } catch (error) {
      // Invalid token, continue as guest
      req.user = null;
    }
  }

  next();
});

module.exports = {
  isAuthenticatedUser,
  authorizeRoles,
  optionalAuth
};
