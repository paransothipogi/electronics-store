const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');
const { sendEmail, emailTemplates } = require('../utils/sendEmail');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create new order
const newOrder = catchAsyncError(async (req, res, next) => {
  const {
    orderItems,
    shippingAddress,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderNotes
  } = req.body;

  // Validate order items
  if (!orderItems || orderItems.length === 0) {
    return next(new ErrorHandler('No order items provided', 400));
  }

  // Validate and update stock
  for (let item of orderItems) {
    const product = await Product.findById(item.product);
    
    if (!product) {
      return next(new ErrorHandler(`Product not found: ${item.name}`, 404));
    }
    
    if (product.stock < item.quantity) {
      return next(new ErrorHandler(`Insufficient stock for ${product.name}. Available: ${product.stock}`, 400));
    }
    
    // Update product stock
    product.stock -= item.quantity;
    await product.save({ validateBeforeSave: false });
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    paymentInfo,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    orderNotes,
    paidAt: paymentInfo.status === 'completed' ? new Date() : undefined
  });

  // Send order confirmation email
  try {
    const user = await User.findById(req.user._id);
    await sendEmail({
      email: user.email,
      subject: 'Order Confirmation - ElectroStore',
      message: emailTemplates.orderConfirmation(user.name, order.orderNumber, totalPrice)
    });
  } catch (error) {
    console.log('Error sending order confirmation email:', error.message);
  }

  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    order
  });
});

// Get single order
const getSingleOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email')
    .populate('orderItems.product', 'name images');

  if (!order) {
    return next(new ErrorHandler('Order not found', 404));
  }

  // Check if user owns this order
  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorHandler('You are not authorized to view this order', 403));
  }

  res.status(200).json({
    success: true,
    order
  });
});

// Get logged in user's orders
const myOrders = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 10, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { user: req.user._id };
  if (status) filter.orderStatus = status;

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .populate('orderItems.product', 'name images price');

  const totalOrders = await Order.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      orders,
      totalOrders,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalOrders / parseInt(limit))
    }
  });
});

// Cancel order
const cancelOrder = catchAsyncError(async (req, res, next) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler('Order not found', 404));
  }

  // Check if user owns this order
  if (order.user.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler('You are not authorized to cancel this order', 403));
  }

  // Check if order can be cancelled
  if (!order.canBeCancelled()) {
    return next(new ErrorHandler('Order cannot be cancelled at this stage', 400));
  }

  const { reason } = req.body;

  // Restore product stock
  for (let item of order.orderItems) {
    const product = await Product.findById(item.product);
    if (product) {
      product.stock += item.quantity;
      await product.save({ validateBeforeSave: false });
    }
  }

  order.orderStatus = 'cancelled';
  order.cancelledAt = new Date();
  order.cancellationReason = reason;

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully'
  });
});

// Create Stripe payment intent
const createPaymentIntent = catchAsyncError(async (req, res, next) => {
  const { amount, currency = 'usd', metadata = {} } = req.body;

  if (!amount || amount <= 0) {
    return next(new ErrorHandler('Invalid payment amount', 400));
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        userId: req.user._id.toString(),
        ...metadata
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    return next(new ErrorHandler(`Payment initialization failed: ${error.message}`, 400));
  }
});

// Confirm payment
const confirmPayment = catchAsyncError(async (req, res, next) => {
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return next(new ErrorHandler('Payment intent ID is required', 400));
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    res.status(200).json({
      success: true,
      paymentStatus: paymentIntent.status,
      paymentIntent
    });
  } catch (error) {
    return next(new ErrorHandler(`Payment confirmation failed: ${error.message}`, 400));
  }
});

// Get order statistics for user
const getOrderStats = catchAsyncError(async (req, res, next) => {
  const stats = await Order.aggregate([
    { $match: { user: req.user._id } },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalPrice' }
      }
    }
  ]);

  const totalOrders = await Order.countDocuments({ user: req.user._id });
  const totalSpent = await Order.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: null, total: { $sum: '$totalPrice' } } }
  ]);

  res.status(200).json({
    success: true,
    data: {
      ordersByStatus: stats,
      totalOrders,
      totalSpent: totalSpent[0]?.total || 0
    }
  });
});

module.exports = {
  newOrder,
  getSingleOrder,
  myOrders,
  cancelOrder,
  createPaymentIntent,
  confirmPayment,
  getOrderStats
};
