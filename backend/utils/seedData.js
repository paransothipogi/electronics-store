const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database Connection Error:', error);
    process.exit(1);
  }
};

const sampleCategories = [
  {
    name: 'Smartphones',
    description: 'Latest smartphones with cutting-edge technology',
    featured: true,
    sortOrder: 1
  },
  {
    name: 'Laptops',
    description: 'High-performance laptops for work and gaming',
    featured: true,
    sortOrder: 2
  },
  {
    name: 'Tablets',
    description: 'Portable tablets for productivity and entertainment',
    featured: true,
    sortOrder: 3
  },
  {
    name: 'Headphones',
    description: 'Premium audio experience with latest headphones',
    featured: true,
    sortOrder: 4
  }
];

const sampleProducts = [
  {
    name: 'iPhone 15 Pro Max',
    description: 'The most advanced iPhone ever with titanium design and A17 Pro chip',
    shortDescription: 'Latest iPhone with titanium design',
    price: 1199,
    discountPrice: 1099,
    category: 'smartphones',
    subcategory: 'flagship',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    images: [{
      public_id: 'sample/iphone-15-pro-max',
      url: 'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=800&q=80',
      alt: 'iPhone 15 Pro Max'
    }],
    specifications: [
      { key: 'Display', value: '6.7-inch Super Retina XDR' },
      { key: 'Processor', value: 'A17 Pro chip' },
      { key: 'Storage', value: '256GB' },
      { key: 'Camera', value: '48MP + 12MP + 12MP' },
      { key: 'Battery', value: 'All-day battery life' }
    ],
    features: ['Face ID', '5G Connectivity', 'Wireless Charging', 'Water Resistant'],
    stock: 50,
    featured: true,
    trending: true,
    warranty: { period: 1, unit: 'years', description: 'Limited warranty' }
  },
  {
    name: 'MacBook Pro 16-inch M3',
    description: 'Supercharged for pros with M3 chip, up to 22 hours of battery life',
    shortDescription: 'Professional laptop with M3 chip',
    price: 2499,
    discountPrice: 2299,
    category: 'laptops',
    subcategory: 'professional',
    brand: 'Apple',
    model: 'MacBook Pro 16-inch',
    images: [{
      public_id: 'sample/macbook-pro-16',
      url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      alt: 'MacBook Pro 16-inch'
    }],
    specifications: [
      { key: 'Display', value: '16.2-inch Liquid Retina XDR' },
      { key: 'Processor', value: 'Apple M3 Pro' },
      { key: 'Memory', value: '18GB Unified Memory' },
      { key: 'Storage', value: '512GB SSD' },
      { key: 'Graphics', value: '18-core GPU' }
    ],
    features: ['Touch ID', 'Magic Keyboard', 'Force Touch trackpad', '1080p FaceTime HD camera'],
    stock: 25,
    featured: true,
    bestSeller: true,
    warranty: { period: 1, unit: 'years', description: 'Limited warranty' }
  },
  {
    name: 'iPad Pro 12.9-inch',
    description: 'The ultimate iPad experience with M2 chip and Liquid Retina XDR display',
    shortDescription: 'Professional tablet with M2 chip',
    price: 1099,
    discountPrice: 999,
    category: 'tablets',
    subcategory: 'professional',
    brand: 'Apple',
    model: 'iPad Pro 12.9-inch',
    images: [{
      public_id: 'sample/ipad-pro-129',
      url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&q=80',
      alt: 'iPad Pro 12.9-inch'
    }],
    specifications: [
      { key: 'Display', value: '12.9-inch Liquid Retina XDR' },
      { key: 'Processor', value: 'Apple M2' },
      { key: 'Storage', value: '128GB' },
      { key: 'Camera', value: '12MP Wide + 10MP Ultra Wide' },
      { key: 'Connectivity', value: 'Wi-Fi 6E + 5G' }
    ],
    features: ['Apple Pencil support', 'Magic Keyboard compatible', 'Face ID', 'USB-C'],
    stock: 30,
    featured: true,
    warranty: { period: 1, unit: 'years', description: 'Limited warranty' }
  },
  {
    name: 'Sony WH-1000XM5',
    description: 'Industry-leading noise canceling headphones with exceptional sound quality',
    shortDescription: 'Premium noise-canceling headphones',
    price: 399,
    discountPrice: 349,
    category: 'headphones',
    subcategory: 'over-ear',
    brand: 'Sony',
    model: 'WH-1000XM5',
    images: [{
      public_id: 'sample/sony-wh-1000xm5',
      url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&q=80',
      alt: 'Sony WH-1000XM5'
    }],
    specifications: [
      { key: 'Driver Size', value: '30mm' },
      { key: 'Battery Life', value: '30 hours' },
      { key: 'Charging', value: 'USB-C' },
      { key: 'Weight', value: '250g' },
      { key: 'Connectivity', value: 'Bluetooth 5.2' }
    ],
    features: ['Active Noise Cancellation', 'Quick Charge', 'Voice Assistant', 'Touch Controls'],
    stock: 75,
    trending: true,
    bestSeller: true,
    warranty: { period: 2, unit: 'years', description: 'International warranty' }
  }
];

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await Product.deleteMany();
    await Category.deleteMany();
    console.log('🗑️ Existing data cleared');

    // Create admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@electrostore.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User',
        email: 'admin@electrostore.com',
        password: 'admin123456',
        role: 'admin',
        isEmailVerified: true
      });
      console.log('👤 Admin user created');
    }

    // Seed categories
    const createdCategories = await Category.insertMany(sampleCategories);
    console.log('📂 Categories seeded');

    // Get admin user for product creation
    const adminUser = await User.findOne({ email: 'admin@electrostore.com' });

    // Add createdBy to products
    const productsWithCreator = sampleProducts.map(product => ({
      ...product,
      createdBy: adminUser._id
    }));

    // Seed products
    await Product.insertMany(productsWithCreator);
    console.log('📱 Products seeded');

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding
if (require.main === module) {
  connectDB().then(seedDatabase);
}

module.exports = { seedDatabase };
