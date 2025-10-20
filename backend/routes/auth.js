const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const { isAuthenticatedUser } = require('../middleware/auth');
const {
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
} = require('../controllers/authController');

// Public routes
router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.put('/reset-password/:token', passwordResetLimiter, resetPassword);

// Protected routes
router.post('/logout', isAuthenticatedUser, logoutUser);
router.get('/profile', isAuthenticatedUser, getUserProfile);
router.put('/profile', isAuthenticatedUser, upload.single('avatar'), updateProfile);
router.put('/password', isAuthenticatedUser, updatePassword);

// Wishlist routes
router.post('/wishlist/:productId', isAuthenticatedUser, addToWishlist);
router.delete('/wishlist/:productId', isAuthenticatedUser, removeFromWishlist);

module.exports = router;
