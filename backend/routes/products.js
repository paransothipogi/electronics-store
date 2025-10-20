const express = require('express');
const router = express.Router();
const { isAuthenticatedUser, optionalAuth } = require('../middleware/auth');
const {
  getAllProducts,
  getProductDetails,
  getFeaturedProducts,
  getTrendingProducts,
  getBestSellers,
  getProductsByCategory,
  getBrands,
  getPriceRange,
  searchProducts,
  createProductReview,
  getProductReviews,
  getRelatedProducts
} = require('../controllers/productController');

// Public routes
router.get('/', getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/bestsellers', getBestSellers);
router.get('/brands', getBrands);
router.get('/price-range', getPriceRange);
router.get('/search', searchProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', optionalAuth, getProductDetails);
router.get('/:id/reviews', getProductReviews);
router.get('/:id/related', getRelatedProducts);

// Protected routes
router.post('/:id/reviews', isAuthenticatedUser, createProductReview);

module.exports = router;
