const Product = require('../models/Product');
const Category = require('../models/Category');
const ErrorHandler = require('../utils/ErrorHandler');
const catchAsyncError = require('../utils/catchAsyncError');
const APIFeatures = require('../utils/apiFeatures');
const { cloudinary, deleteImage } = require('../config/cloudinary');

// Get all products with advanced filtering
const getAllProducts = catchAsyncError(async (req, res, next) => {
  const resultsPerPage = parseInt(req.query.limit) || 12;
  const productsCount = await Product.countDocuments({ availability: true, status: 'active' });

  const apiFeatures = new APIFeatures(
    Product.find({ availability: true, status: 'active' }),
    req.query
  )
    .search()
    .filter()
    .pagination(resultsPerPage);

  let products = await apiFeatures.query.populate('createdBy', 'name');

  res.status(200).json({
    success: true,
    data: {
      products,
      productsCount,
      resultsPerPage,
      currentPage: parseInt(req.query.page) || 1,
      totalPages: Math.ceil(productsCount / resultsPerPage)
    }
  });
});

// Get single product details
const getProductDetails = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id)
    .populate('reviews.user', 'name avatar')
    .populate('createdBy', 'name');

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  // Increment view count (you can add this field to schema)
  // product.views = (product.views || 0) + 1;
  // await product.save({ validateBeforeSave: false });

  res.status(200).json({
    success: true,
    product
  });
});

// Get featured products
const getFeaturedProducts = catchAsyncError(async (req, res, next) => {
  const products = await Product.find({ 
    featured: true, 
    availability: true, 
    status: 'active' 
  })
  .limit(8)
  .select('name price discountPrice images rating numOfReviews brand category');

  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// Get trending products
const getTrendingProducts = catchAsyncError(async (req, res, next) => {
  const products = await Product.find({ 
    trending: true, 
    availability: true, 
    status: 'active' 
  })
  .limit(8)
  .select('name price discountPrice images rating numOfReviews brand category');

  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// Get best selling products
const getBestSellers = catchAsyncError(async (req, res, next) => {
  const products = await Product.find({ 
    bestSeller: true, 
    availability: true, 
    status: 'active' 
  })
  .limit(8)
  .select('name price discountPrice images rating numOfReviews brand category');

  res.status(200).json({
    success: true,
    count: products.length,
    products
  });
});

// Get products by category
const getProductsByCategory = catchAsyncError(async (req, res, next) => {
  const { category } = req.params;
  const resultsPerPage = parseInt(req.query.limit) || 12;

  const apiFeatures = new APIFeatures(
    Product.find({ category, availability: true, status: 'active' }),
    req.query
  )
    .search()
    .filter()
    .pagination(resultsPerPage);

  const products = await apiFeatures.query;
  const totalProducts = await Product.countDocuments({ 
    category, 
    availability: true, 
    status: 'active' 
  });

  res.status(200).json({
    success: true,
    data: {
      products,
      totalProducts,
      resultsPerPage,
      currentPage: parseInt(req.query.page) || 1,
      totalPages: Math.ceil(totalProducts / resultsPerPage),
      category
    }
  });
});

// Get all brands
const getBrands = catchAsyncError(async (req, res, next) => {
  const brands = await Product.distinct('brand', { availability: true, status: 'active' });
  
  res.status(200).json({
    success: true,
    count: brands.length,
    brands: brands.sort()
  });
});

// Get price range
const getPriceRange = catchAsyncError(async (req, res, next) => {
  const priceRange = await Product.aggregate([
    { $match: { availability: true, status: 'active' } },
    {
      $group: {
        _id: null,
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    priceRange: priceRange[0] || { minPrice: 0, maxPrice: 0 }
  });
});

// Search products with advanced features
const searchProducts = catchAsyncError(async (req, res, next) => {
  const { 
    q, 
    category, 
    brand, 
    minPrice, 
    maxPrice, 
    rating, 
    sort = 'relevance',
    page = 1,
    limit = 12
  } = req.query;

  if (!q || q.trim().length < 2) {
    return next(new ErrorHandler('Search query must be at least 2 characters', 400));
  }

  // Build search query
  const searchQuery = {
    $and: [
      { availability: true },
      { status: 'active' },
      {
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { brand: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ]
      }
    ]
  };

  // Add filters
  if (category) searchQuery.$and.push({ category });
  if (brand) searchQuery.$and.push({ brand });
  if (minPrice || maxPrice) {
    const priceFilter = {};
    if (minPrice) priceFilter.$gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.$lte = parseFloat(maxPrice);
    searchQuery.$and.push({ price: priceFilter });
  }
  if (rating) searchQuery.$and.push({ rating: { $gte: parseFloat(rating) } });

  // Build sort options
  let sortOptions = {};
  switch (sort) {
    case 'price-low':
      sortOptions = { price: 1 };
      break;
    case 'price-high':
      sortOptions = { price: -1 };
      break;
    case 'rating':
      sortOptions = { rating: -1, numOfReviews: -1 };
      break;
    case 'newest':
      sortOptions = { createdAt: -1 };
      break;
    case 'popularity':
      sortOptions = { numOfReviews: -1, rating: -1 };
      break;
    default: // relevance
      sortOptions = { featured: -1, rating: -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Execute search
  const [products, totalProducts] = await Promise.all([
    Product.find(searchQuery)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .select('name price discountPrice images rating numOfReviews brand category'),
    Product.countDocuments(searchQuery)
  ]);

  // Get search suggestions for similar terms
  const suggestions = await Product.find({
    $and: [
      { availability: true },
      { status: 'active' },
      {
        $or: [
          { name: { $regex: q.substring(0, Math.max(3, q.length - 1)), $options: 'i' } },
          { brand: { $regex: q.substring(0, Math.max(3, q.length - 1)), $options: 'i' } }
        ]
      }
    ]
  })
  .distinct('name')
  .limit(5);

  res.status(200).json({
    success: true,
    data: {
      products,
      totalProducts,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalProducts / parseInt(limit)),
      hasNextPage: skip + parseInt(limit) < totalProducts,
      hasPrevPage: parseInt(page) > 1,
      suggestions: totalProducts === 0 ? suggestions : [],
      query: q,
      filters: { category, brand, minPrice, maxPrice, rating }
    }
  });
});

// Create product review
const createProductReview = catchAsyncError(async (req, res, next) => {
  const { rating, comment } = req.body;
  const productId = req.params.id;

  if (!rating || !comment) {
    return next(new ErrorHandler('Please provide rating and comment', 400));
  }

  if (rating < 1 || rating > 5) {
    return next(new ErrorHandler('Rating must be between 1 and 5', 400));
  }

  const review = {
    user: req.user._id,
    name: req.user.name,
    rating: Number(rating),
    comment: comment.trim()
  };

  const product = await Product.findById(productId);

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  // Check if user already reviewed this product
  const isReviewed = product.reviews.find(
    (rev) => rev.user.toString() === req.user._id.toString()
  );

  if (isReviewed) {
    // Update existing review
    product.reviews.forEach((rev) => {
      if (rev.user.toString() === req.user._id.toString()) {
        rev.comment = comment;
        rev.rating = rating;
      }
    });
  } else {
    // Add new review
    product.reviews.push(review);
  }

  // Update product rating
  product.updateRating();
  await product.save();

  res.status(200).json({
    success: true,
    message: isReviewed ? 'Review updated successfully' : 'Review added successfully'
  });
});

// Get product reviews
const getProductReviews = catchAsyncError(async (req, res, next) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const product = await Product.findById(req.params.id)
    .populate({
      path: 'reviews.user',
      select: 'name avatar',
      options: {
        skip: skip,
        limit: parseInt(limit)
      }
    });

  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  const totalReviews = product.reviews.length;
  const reviews = product.reviews.slice(skip, skip + parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      reviews,
      totalReviews,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalReviews / parseInt(limit)),
      averageRating: product.rating
    }
  });
});

// Get related products
const getRelatedProducts = catchAsyncError(async (req, res, next) => {
  const product = await Product.findById(req.params.id);
  
  if (!product) {
    return next(new ErrorHandler('Product not found', 404));
  }

  const relatedProducts = await Product.find({
    _id: { $ne: product._id },
    $or: [
      { category: product.category },
      { brand: product.brand },
      { tags: { $in: product.tags } }
    ],
    availability: true,
    status: 'active'
  })
  .limit(8)
  .select('name price discountPrice images rating numOfReviews brand category');

  res.status(200).json({
    success: true,
    count: relatedProducts.length,
    products: relatedProducts
  });
});

module.exports = {
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
};
