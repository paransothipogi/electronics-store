const express = require('express');
const router = express.Router();
const { isAuthenticatedUser } = require('../middleware/auth');
const {
  newOrder,
  getSingleOrder,
  myOrders,
  cancelOrder,
  createPaymentIntent,
  confirmPayment,
  getOrderStats
} = require('../controllers/orderController');

// All routes are protected
router.use(isAuthenticatedUser);

router.post('/', newOrder);
router.get('/me', myOrders);
router.get('/me/stats', getOrderStats);
router.get('/:id', getSingleOrder);
router.put('/:id/cancel', cancelOrder);

// Payment routes
router.post('/payment/create-intent', createPaymentIntent);
router.post('/payment/confirm', confirmPayment);

module.exports = router;
