import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiStar, FiEye } from 'react-icons/fi';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../ui/Button/Button';
import styles from './ProductCard.module.css';

const ProductCard = ({ product, variant = 'default' }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  
  const { addToCart, isInCart, getItemQuantity } = useCart();
  const { user } = useAuth();

  const {
    _id,
    name,
    price,
    discountPrice,
    images,
    rating,
    numOfReviews,
    brand,
    category,
    availability,
    stock
  } = product;

  const discountPercentage = discountPrice 
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const finalPrice = discountPrice || price;
  const inCart = isInCart(_id);
  const cartQuantity = getItemQuantity(_id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      // Redirect to login or show login modal
      return;
    }
    setIsWishlisted(!isWishlisted);
    // Add wishlist API call here
  };

  const handleImageError = () => {
    setIsImageLoaded(false);
  };

  const getStockStatus = () => {
    if (!availability || stock === 0) return 'out-of-stock';
    if (stock <= 10) return 'low-stock';
    return 'in-stock';
  };

  const stockStatus = getStockStatus();

  return (
    <div className={`${styles.card} ${styles[variant]} ${styles[stockStatus]}`}>
      {/* Product Image */}
      <div className={styles.imageContainer}>
        <Link to={`/products/${_id}`} className={styles.imageLink}>
          <div className={styles.imageWrapper}>
            {images && images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex]?.url || images[0]?.url}
                  alt={images[currentImageIndex]?.alt || name}
                  className={`${styles.productImage} ${isImageLoaded ? styles.loaded : ''}`}
                  onLoad={() => setIsImageLoaded(true)}
                  onError={handleImageError}
                />
                {!isImageLoaded && (
                  <div className={styles.imagePlaceholder}>
                    <div className={styles.loadingSpinner}></div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noImage}>
                <span>No Image</span>
              </div>
            )}
            
            {/* Image Indicators */}
            {images && images.length > 1 && (
              <div className={styles.imageIndicators}>
                {images.slice(0, 3).map((_, index) => (
                  <button
                    key={index}
                    className={`${styles.indicator} ${
                      index === currentImageIndex ? styles.active : ''
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                  />
                ))}
              </div>
            )}
            
            {/* Overlay Actions */}
            <div className={styles.overlay}>
              <button
                className={styles.quickView}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  // Add quick view functionality
                }}
              >
                <FiEye />
                <span>Quick View</span>
              </button>
            </div>
          </div>
        </Link>

        {/* Badges */}
        <div className={styles.badges}>
          {discountPercentage > 0 && (
            <span className={styles.discountBadge}>
              -{discountPercentage}%
            </span>
          )}
          {stockStatus === 'out-of-stock' && (
            <span className={styles.stockBadge}>
              Out of Stock
            </span>
          )}
          {stockStatus === 'low-stock' && (
            <span className={styles.stockBadge}>
              Only {stock} left
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          className={`${styles.wishlistButton} ${isWishlisted ? styles.active : ''}`}
          onClick={handleWishlist}
          disabled={!user}
        >
          <FiHeart />
        </button>
      </div>

      {/* Product Info */}
      <div className={styles.productInfo}>
        {/* Brand & Category */}
        <div className={styles.meta}>
          <span className={styles.brand}>{brand}</span>
          <span className={styles.category}>{category}</span>
        </div>

        {/* Product Name */}
        <Link to={`/products/${_id}`} className={styles.productName}>
          <h3>{name}</h3>
        </Link>

        {/* Rating */}
        {rating > 0 && (
          <div className={styles.rating}>
            <div className={styles.stars}>
              {[...Array(5)].map((_, index) => (
                <FiStar
                  key={index}
                  className={`${styles.star} ${
                    index < Math.floor(rating) ? styles.filled : ''
                  }`}
                />
              ))}
            </div>
            <span className={styles.ratingText}>
              {rating.toFixed(1)} ({numOfReviews} reviews)
            </span>
          </div>
        )}

        {/* Price */}
        <div className={styles.priceContainer}>
          <div className={styles.priceWrapper}>
            <span className={styles.currentPrice}>
              ${finalPrice.toFixed(2)}
            </span>
            {discountPrice && (
              <span className={styles.originalPrice}>
                ${price.toFixed(2)}
              </span>
            )}
          </div>
          {discountPercentage > 0 && (
            <span className={styles.savings}>
              Save ${(price - discountPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <div className={styles.actions}>
          {inCart ? (
            <div className={styles.cartControls}>
              <span className={styles.inCartText}>
                In Cart ({cartQuantity})
              </span>
              <Link to="/cart">
                <Button variant="secondary" size="small" fullWidth>
                  View Cart
                </Button>
              </Link>
            </div>
          ) : (
            <Button
              variant="primary"
              size="medium"
              fullWidth
              onClick={handleAddToCart}
              disabled={stockStatus === 'out-of-stock'}
              icon={<FiShoppingCart />}
            >
              {stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
