const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
});

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for local storage (fallback if Cloudinary not configured)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif, webp) are allowed!'));
    }
  },
});

// Upload to cloudinary function
const uploadToCloudinary = async (filePath, folder = 'electronics-store') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      quality: 'auto:good',
      fetch_format: 'auto'
    });
    
    // Delete local file after upload
    fs.unlinkSync(filePath);
    
    return {
      public_id: result.public_id,
      url: result.secure_url,
      secure_url: result.secure_url
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Return local file info if cloudinary fails
    return {
      public_id: `local_${Date.now()}`,
      url: `/uploads/${path.basename(filePath)}`,
      secure_url: `/uploads/${path.basename(filePath)}`
    };
  }
};

// Delete image from cloudinary
const deleteImage = async (publicId) => {
  try {
    if (publicId && !publicId.startsWith('local_')) {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log(`Image deleted from cloudinary: ${publicId}`, result);
      return result;
    }
  } catch (error) {
    console.error('Error deleting image from cloudinary:', error);
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadToCloudinary,
  deleteImage,
};
