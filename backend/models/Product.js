const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: [true, 'Please provide a review comment'],
    maxlength: [500, 'Review cannot exceed 500 characters']
  },
  helpful: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const specificationSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide product name'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide product description'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'Short description cannot exceed 200 characters']
  },
  price: {
    type: Number,
    required: [true, 'Please provide product price'],
    min: [0, 'Price cannot be negative'],
    validate: {
      validator: function(v) {
        return v > 0;
      },
      message: 'Price must be greater than 0'
    }
  },
  discountPrice: {
    type: Number,
    default: null,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(v) {
        return !v || v < this.price;
      },
      message: 'Discount price must be less than regular price'
    }
  },
  category: {
    type: String,
    required: [true, 'Please select product category'],
    enum: {
      values: [
        'smartphones',
        'laptops',
        'tablets',
        'smartwatches',
        'headphones',
        'speakers',
        'cameras',
        'gaming',
        'accessories',
        'home-appliances'
      ],
      message: 'Please select a valid category'
    }
  },
  subcategory: {
    type: String,
    required: [true, 'Please provide subcategory']
  },
  brand: {
    type: String,
    required: [true, 'Please provide product brand'],
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  images: [{
    public_id: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    alt: String
  }],
  specifications: [specificationSchema],
  features: [String],
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    unit: {
      type: String,
      enum: ['cm', 'inches'],
      default: 'cm'
    }
  },
  colors: [{
    name: String,
    code: String
  }],
  storage: [String], // For devices with storage variants
  stock: {
    type: Number,
    required: [true, 'Please provide stock quantity'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  availability: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  reviews: [reviewSchema],
  tags: [String],
  featured: {
    type: Boolean,
    default: false
  },
  trending: {
    type: Boolean,
    default: false
  },
  bestSeller: {
    type: Boolean,
    default: false
  },
  warranty: {
    period: Number,
    unit: {
      type: String,
      enum: ['months', 'years'],
      default: 'months'
    },
    description: String
  },
  shippingInfo: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number
    },
    freeShipping: {
      type: Boolean,
      default: false
    },
    shippingCost: {
      type: Number,
      default: 0
    }
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String]
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for better performance
productSchema.index({ name: 'text', description: 'text', brand: 'text' });
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ price: 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ featured: 1 });
productSchema.index({ availability: 1, status: 1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.discountPrice && this.price > this.discountPrice) {
    return Math.round(((this.price - this.discountPrice) / this.price) * 100);
  }
  return 0;
});

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  return this.discountPrice || this.price;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= this.lowStockThreshold) return 'low-stock';
  return 'in-stock';
});

// Virtual for average rating (calculated from reviews)
productSchema.virtual('averageRating').get(function() {
  if (this.reviews.length === 0) return 0;
  const sum = this.reviews.reduce((acc, review) => acc + review.rating, 0);
  return (sum / this.reviews.length).toFixed(1);
});

// Pre-save middleware to generate SKU
productSchema.pre('save', function(next) {
  if (!this.sku) {
    const brand = this.brand.substring(0, 3).toUpperCase();
    const category = this.category.substring(0, 3).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.sku = `${brand}-${category}-${random}`;
  }
  next();
});

// Update rating and numOfReviews when reviews change
productSchema.methods.updateRating = function() {
  if (this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((acc, review) => acc + review.rating, 0);
    this.rating = (totalRating / this.reviews.length).toFixed(1);
    this.numOfReviews = this.reviews.length;
  } else {
    this.rating = 0;
    this.numOfReviews = 0;
  }
};

// Ensure virtual fields are serialized
productSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    // Remove sensitive fields
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Product', productSchema);
