const User = require('../models/User');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');
const sendToken = require('../utils/jwtToken');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const { uploadToCloudinary, deleteImage } = require('../config/cloudinary');
const crypto = require('crypto');

// Register a new user
const registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return next(new ErrorHandler('User with this email already exists', 400));
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: 'avatars/default',
      url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/avatars/default.png'
    }
  });

  // Send welcome email (optional, skip if SMTP not configured)
  try {
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to ElectroStore!',
        message: emailTemplates.welcome(user.name)
      });
    }
  } catch (error) {
    console.log('Error sending welcome email:', error.message);
  }

  sendToken(user, 201, res, 'User registered successfully');
});

// Login user
const loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler('Please enter email and password', 400));
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  if (!user.isActive) {
    return next(new ErrorHandler('Your account has been deactivated', 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Invalid email or password', 401));
  }

  sendToken(user, 200, res, 'Login successful');
});

// Logout user
const logoutUser = catchAsyncError(async (req, res, next) => {
  res.cookie('token', null, {
    expires: new Date(Date.now()),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

// Get current user profile
const getUserProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('wishlist', 'name price images');

  res.status(200).json({
    success: true,
    user
  });
});

// Update user profile
const updateProfile = catchAsyncError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    dateOfBirth: req.body.dateOfBirth,
    address: req.body.address
  };

  // Update avatar if provided
  if (req.file) {
    const user = await User.findById(req.user.id);

    // Delete old avatar if it's not default
    if (user.avatar && user.avatar.public_id !== 'avatars/default') {
      await deleteImage(user.avatar.public_id);
    }

    try {
      const uploadResult = await uploadToCloudinary(req.file.path, 'electronics-store/avatars');
      newUserData.avatar = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url
      };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return next(new ErrorHandler('Error uploading avatar', 500));
    }
  }

  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    user
  });
});

// Update password
const updatePassword = catchAsyncError(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler('Please provide old and new password', 400));
  }

  const user = await User.findById(req.user.id).select('+password');

  const isPasswordMatched = await user.comparePassword(oldPassword);

  if (!isPasswordMatched) {
    return next(new ErrorHandler('Old password is incorrect', 400));
  }

  if (newPassword.length < 6) {
    return next(new ErrorHandler('New password must be at least 6 characters', 400));
  }

  user.password = newPassword;
  await user.save();

  sendToken(user, 200, res, 'Password updated successfully');
});

// Forgot password
const forgotPassword = catchAsyncError(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler('Please provide email', 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler('User not found with this email', 404));
  }

  // Generate reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/password/reset/${resetToken}`;

  try {
    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset Request - ElectroStore',
        message: emailTemplates.passwordReset(user.name, resetUrl)
      });

      res.status(200).json({
        success: true,
        message: `Password reset email sent to ${email}`
      });
    } else {
      res.status(200).json({
        success: true,
        message: `Password reset token generated. Reset URL: ${resetUrl}`,
        resetToken // Only for development
      });
    }
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorHandler('Error sending email', 500));
  }
});

// Reset password
const resetPassword = catchAsyncError(async (req, res, next) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) {
    return next(new ErrorHandler('Please provide new password', 400));
  }

  if (password.length < 6) {
    return next(new ErrorHandler('Password must be at least 6 characters', 400));
  }

  // Hash token and find user
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorHandler('Password reset token is invalid or has expired', 400));
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res, 'Password reset successful');
});

// Add to wishlist
const addToWishlist = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.id);

  if (user.wishlist.includes(productId)) {
    return next(new ErrorHandler('Product already in wishlist', 400));
  }

  user.wishlist.push(productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Product added to wishlist',
    wishlist: user.wishlist
  });
});

// Remove from wishlist
const removeFromWishlist = catchAsyncError(async (req, res, next) => {
  const { productId } = req.params;

  const user = await User.findById(req.user.id);
  user.wishlist = user.wishlist.filter(id => id.toString() !== productId);
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist',
    wishlist: user.wishlist
  });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  addToWishlist,
  removeFromWishlist
};
