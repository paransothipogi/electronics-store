const express = require('express');
const router = express.Router();
const { upload } = require('../config/cloudinary');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const {
  getDashboardStats,
  getAllUsers,
  getUserDetails,
  updateUserRole,
  toggleUserStatus,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus
} = require('../controllers/adminController');

// All admin routes require authentication and admin role
router.use(isAuthenticatedUser, authorizeRoles('admin'));

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserDetails);
router.put('/users/:id/role', updateUserRole);
router.put('/users/:id/status', toggleUserStatus);

// Product management
router.post('/products', upload.array('images', 5), createProduct);
router.put('/products/:id', upload.array('images', 5), updateProduct);
router.delete('/products/:id', deleteProduct);

// Order management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

module.exports = router;
