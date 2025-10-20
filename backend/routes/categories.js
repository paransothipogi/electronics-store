const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Get all categories
const getAllCategories = catchAsyncError(async (req, res, next) => {
  const categories = await Category.find({ isActive: true })
    .populate('subcategories')
    .sort({ sortOrder: 1, name: 1 });

  res.status(200).json({
    success: true,
    count: categories.length,
    categories
  });
});

// Get single category
const getCategory = catchAsyncError(async (req, res, next) => {
  const category = await Category.findOne({ slug: req.params.slug, isActive: true })
    .populate('subcategories')
    .populate('productCount');

  if (!category) {
    return next(new ErrorHandler('Category not found', 404));
  }

  res.status(200).json({
    success: true,
    category
  });
});

// Get featured categories
const getFeaturedCategories = catchAsyncError(async (req, res, next) => {
  const categories = await Category.find({ featured: true, isActive: true })
    .sort({ sortOrder: 1 })
    .limit(8);

  res.status(200).json({
    success: true,
    count: categories.length,
    categories
  });
});

// Admin: Create category
const createCategory = catchAsyncError(async (req, res, next) => {
  const categoryData = { ...req.body };

  if (req.file) {
    categoryData.image = {
      public_id: req.file.public_id,
      url: req.file.secure_url,
      alt: req.body.name
    };
  }

  const category = await Category.create(categoryData);

  res.status(201).json({
    success: true,
    message: 'Category created successfully',
    category
  });
});

// Admin: Update category
const updateCategory = catchAsyncError(async (req, res, next) => {
  let category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler('Category not found', 404));
  }

  const updateData = { ...req.body };

  if (req.file) {
    updateData.image = {
      public_id: req.file.public_id,
      url: req.file.secure_url,
      alt: req.body.name || category.name
    };
  }

  category = await Category.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    success: true,
    message: 'Category updated successfully',
    category
  });
});

// Admin: Delete category
const deleteCategory = catchAsyncError(async (req, res, next) => {
  const category = await Category.findById(req.params.id);

  if (!category) {
    return next(new ErrorHandler('Category not found', 404));
  }

  // Check if category has products
  const productCount = await Product.countDocuments({ category: category.name });
  if (productCount > 0) {
    return next(new ErrorHandler('Cannot delete category with existing products', 400));
  }

  await Category.findByIdAndDelete(req.params.id);

  res.status(200).json({
    success: true,
    message: 'Category deleted successfully'
  });
});

// Public routes
router.get('/', getAllCategories);
router.get('/featured', getFeaturedCategories);
router.get('/:slug', getCategory);

// Admin routes
router.post('/', isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), createCategory);
router.put('/:id', isAuthenticatedUser, authorizeRoles('admin'), upload.single('image'), updateCategory);
router.delete('/:id', isAuthenticatedUser, authorizeRoles('admin'), deleteCategory);

module.exports = router;
