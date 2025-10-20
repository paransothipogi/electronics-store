const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  zipCode: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true,
    default: 'United States'
  }
}, { _id: false });

const paymentInfoSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
    enum: ['card', 'paypal', 'stripe', 'cash_on_delivery']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  transactionId: String,
  paidAt: Date,
  paymentIntent: String // Stripe payment intent ID
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderItems: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentInfo: paymentInfoSchema,
  itemsPrice: {
    type: Number,
    required: true,
    min: 0
  },
  taxPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  shippingPrice: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  orderStatus: {
    type: String,
    required: true,
    enum: [
      'processing',
      'confirmed',
      'shipped',
      'delivered',
      'cancelled',
      'refunded',
      'returned'
    ],
    default: 'processing'
  },
  orderNotes: String,
  trackingNumber: String,
  estimatedDelivery: Date,
  deliveredAt: Date,
  shippedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  refundedAt: Date,
  refundAmount: Number,
  returnReason: String,
  returnedAt: Date
}, {
  timestamps: true
});

// Indexes for better performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'paymentInfo.status': 1 });
orderSchema.index({ trackingNumber: 1 });

// Virtual for order number
orderSchema.virtual('orderNumber').get(function() {
  return `ORD-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Virtual for total items count
orderSchema.virtual('totalItems').get(function() {
  return this.orderItems.reduce((total, item) => total + item.quantity, 0);
});

// Virtual for order age in days
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Methods
orderSchema.methods.canBeCancelled = function() {
  return ['processing', 'confirmed'].includes(this.orderStatus);
};

orderSchema.methods.canBeModified = function() {
  return this.orderStatus === 'processing';
};

orderSchema.methods.isDelivered = function() {
  return this.orderStatus === 'delivered' && this.deliveredAt;
};

// Pre-save middleware to calculate total price
orderSchema.pre('save', function(next) {
  if (this.isModified('orderItems') || this.isModified('taxPrice') || 
      this.isModified('shippingPrice') || this.isModified('discountAmount')) {
    
    this.itemsPrice = this.orderItems.reduce(
      (total, item) => total + (item.price * item.quantity), 0
    );
    
    this.totalPrice = this.itemsPrice + this.taxPrice + this.shippingPrice - this.discountAmount;
  }
  next();
});

// Ensure virtual fields are serialized
orderSchema.set('toJSON', { 
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Order', orderSchema);
