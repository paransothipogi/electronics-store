const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');
const { cloudinary, deleteImage } = require('../config/cloudinary');

// Dashboard Statistics
const getDashboardStats = catchAsyncError(async (req, res, next) => {
  const totalUsers = await User.countDocuments({ role: 'user' });
  const totalProducts = await Product.countDocuments();
  const totalOrders = await Order.countDocuments();
  
  const revenueStats = await Order.aggregate([
    { $match: { orderStatus: { $in: ['delivered', 'shipped'] } } },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$totalPrice' },
        averageOrderValue: { $avg: '$totalPrice' }
      }
    }
  ]);

  const monthlyRevenue = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        orderStatus: { $in: ['delivered', 'shipped'] }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        revenue: { $sum: '$totalPrice' },
        orders: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const topProducts = await Order.aggregate([
    { $unwind: '$orderItems' },
    {
      $group: {
        _id: '$orderItems.product',
        totalSold: { $sum: '$orderItems.quantity' },
        revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.quantity'] } }
      }
    },
    { $sort: { totalSold: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product'
      }
    },
    { $unwind: '$product' },
    {
      $project: {
        name: '$product.name',
        image: { $arrayElemAt: ['$product.images.url', 0] },
        totalSold: 1,
        revenue: 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenueStats[0]?.totalRevenue || 0,
      averageOrderValue: revenueStats[0]?.averageOrderValue || 0,
      monthlyRevenue,
      topProducts
    }
  });
});

// User Management
const getAllUsers = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 10, search, role, status } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  if (role) filter.role = role;
  if (status) filter.isActive = status === 'active';

  const users = await User.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalUsers = await User.countDocuments(filter);

  res.status(200).json({
    success: true,
    data: {
      users,
      totalUsers,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalUsers / parseInt(limit))
    }
  });
});

const getUserDetails = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  // Get user's order statistics
  const orderStats = await Order.aggregate([
    { $match: { user: user._id } },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalPrice' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    user,
    orderStats
  });
});

const updateUserRole = catchAsyncError(async (req, res, next) => {
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return next(new ErrorHandler('Invalid role', 400));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { new: true, runValidators: true }
  ).select('-password');

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  res.status(200).json({
    success: true,
    message: 'User role updated successfully',
    user
  });
});

const toggleUserStatus = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new ErrorHandler('User not found', 404));
  }

  user.isActive = !user.isActive;
  await user.save();

  res.status(200).json({
    success: true,
    message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isActive: user.isActive
    }
  });
});

// Product Management
const createProduct = catchAsyncError(async (req, res, next) => {
  const images = [];

  if (req.files && req.files.length > 0) {
    for (let file of req.files) {
      images.push({
        public_id: file.public_id,
        url: file.secure_url,
        alt: req.body.name
      });
    }
  }

  const productData = {
    ...req.body,
    images,
    createdBy: req.user._id
  };

  const product = await Product.create(productData);

  res.status(201).json({
    success: true,
    message: 'Product created successfully',
    product
  });
});

const updateProduct = catchAsyncError(async (req, res, next) => {
  let product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  // Handle image updates
  if (req.files && req.files.length > 0) {
    // Delete old images from cloudinary
    for (let image of product.images) {
      await deleteImage(image.public_id);
    }

    const images = [];
    for (let file of req.files) {
      images.push({
        public_id: file.public_id,
        url: file.secure_url,
        alt: req.body.name || product.name
      });
    }
    req.body.images = images;
  }

  req.body.lastModifiedBy = req.user._id;

  product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    product
  });
});

const deleteProduct = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  // Delete images from cloudinary
  for (let image of product.images) {
    await deleteImage(image.public_id);
  }

  await Product.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully'
  });
});

// Order Management
const getAllOrders = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = {};
  if (status) filter.orderStatus = status;
  if (search) {
    filter.$or = [
      { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
      { trackingNumber: { $regex: search, $options: 'i' } }
    ];
  }

  const orders = await Order.find(filter)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

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

const updateOrderStatus = catchAsyncError(async (req, res, next) => {
  const { status, trackingNumber, estimatedDelivery } = req.body;

  const order = await Order.findById(req.params.id);

  if (!order) {
    return next(new ErrorHandler('Order not found', 404));
  }

  const validStatuses = ['processing', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler('Invalid order status', 400));
  }

  order.orderStatus = status;
  
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (estimatedDelivery) order.estimatedDelivery = new Date(estimatedDelivery);

  if (status === 'shipped') {
    order.shippedAt = new Date();
  } else if (status === 'delivered') {
    order.deliveredAt = new Date();
  }

  await order.save();

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully',
    order
  });
});

module.exports = {
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
};
