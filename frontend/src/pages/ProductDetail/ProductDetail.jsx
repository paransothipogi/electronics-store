import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiShoppingCart, FiHeart, FiShare2, FiStar, FiPlus, FiMinus, 
  FiTruck, FiShield, FiRefreshCcw, FiChevronLeft, FiChevronRight 
} from 'react-icons/fi';
import ProductCard from '../../components/product/ProductCard/ProductCard';
import Button from '../../components/ui/Button/Button';
import Card from '../../components/ui/Card/Card';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { productAPI, formatPrice } from '../../services/api';
import styles from './ProductDetail.module.css';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, isInCart, getItemQuantity, updateQuantity } = useCart();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [productResponse, relatedResponse] = await Promise.all([
          productAPI.getById(id),
          productAPI.getRelated(id)
        ]);

        setProduct(productResponse.data.product);
        setRelatedProducts(relatedResponse.data.products || []);
      } catch (err) {
        setError('Failed to load product details');
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id]);

  const fetchReviews = async () => {
    if (!product) return;
    
    try {
      setReviewsLoading(true);
      const response = await productAPI.getReviews(product._id);
      setReviews(response.data.data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews' && product && reviews.length === 0) {
      fetchReviews();
    }
  }, [activeTab, product]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
  };

  const handleWishlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setIsWishlisted(!isWishlisted);
    // Add wishlist API call here
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(window.location.href);
      // Show toast notification
    }
  };

  const handleQuantityChange = (newQuantity) => {
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const nextImage = () => {
    if (product.images && product.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === product.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (product.images && product.images.length > 1) {
      setSelectedImageIndex((prev) => 
        prev === 0 ? product.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.errorContainer}>
        <h2>Product not found</h2>
        <p>{error || 'The product you are looking for does not exist.'}</p>
        <Button onClick={() => navigate('/products')}>
          Back to Products
        </Button>
      </div>
    );
  }

  const inCart = isInCart(product._id);
  const cartQuantity = getItemQuantity(product._id);
  const discountPercentage = product.discountPrice 
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;
  const finalPrice = product.discountPrice || product.price;

  return (
    <div className={styles.productDetail}>
      <div className="container">
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb}>
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${product.category}`}>
            {product.category}
          </Link>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        {/* Product Main Section */}
        <div className={styles.productMain}>
          {/* Product Images */}
          <div className={styles.imageSection}>
            <div className={styles.mainImage}>
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[selectedImageIndex]?.url}
                    alt={product.images[selectedImageIndex]?.alt || product.name}
                    className={styles.productImage}
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        className={`${styles.imageNav} ${styles.prevButton}`}
                        onClick={prevImage}
                      >
                        <FiChevronLeft />
                      </button>
                      <button
                        className={`${styles.imageNav} ${styles.nextButton}`}
                        onClick={nextImage}
                      >
                        <FiChevronRight />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className={styles.noImage}>
                  <span>No Image Available</span>
                </div>
              )}
            </div>

            {/* Image Thumbnails */}
            {product.images && product.images.length > 1 && (
              <div className={styles.thumbnails}>
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    className={`${styles.thumbnail} ${
                      index === selectedImageIndex ? styles.active : ''
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img src={image.url} alt={image.alt || product.name} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className={styles.productInfo}>
            <div className={styles.productHeader}>
              <div className={styles.brandCategory}>
                <span className={styles.brand}>{product.brand}</span>
                <span className={styles.category}>{product.category}</span>
              </div>
              <div className={styles.actions}>
                <button
                  className={`${styles.actionButton} ${isWishlisted ? styles.active : ''}`}
                  onClick={handleWishlist}
                >
                  <FiHeart />
                </button>
                <button className={styles.actionButton} onClick={handleShare}>
                  <FiShare2 />
                </button>
              </div>
            </div>

            <h1 className={styles.productTitle}>{product.name}</h1>

            {product.shortDescription && (
              <p className={styles.shortDescription}>
                {product.shortDescription}
              </p>
            )}

            {/* Rating */}
            {product.rating > 0 && (
              <div className={styles.rating}>
                <div className={styles.stars}>
                  {[...Array(5)].map((_, index) => (
                    <FiStar
                      key={index}
                      className={`${styles.star} ${
                        index < Math.floor(product.rating) ? styles.filled : ''
                      }`}
                    />
                  ))}
                </div>
                <span className={styles.ratingText}>
                  {product.rating.toFixed(1)} ({product.numOfReviews} reviews)
                </span>
              </div>
            )}

            {/* Price */}
            <div className={styles.priceSection}>
              <div className={styles.mainPrice}>
                <span className={styles.currentPrice}>
                  {formatPrice(finalPrice)}
                </span>
                {product.discountPrice && (
                  <span className={styles.originalPrice}>
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              {discountPercentage > 0 && (
                <div className={styles.savings}>
                  <span className={styles.discountBadge}>
                    -{discountPercentage}%
                  </span>
                  <span className={styles.savingsText}>
                    You save {formatPrice(product.price - product.discountPrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Stock Status */}
            <div className={styles.stockInfo}>
              {product.stock > 0 ? (
                <>
                  <span className={styles.inStock}>✓ In Stock</span>
                  {product.stock <= 10 && (
                    <span className={styles.lowStock}>
                      Only {product.stock} left!
                    </span>
                  )}
                </>
              ) : (
                <span className={styles.outOfStock}>✗ Out of Stock</span>
              )}
            </div>

            {/* Quantity Selector */}
            {product.stock > 0 && (
              <div className={styles.quantitySection}>
                <label htmlFor="quantity">Quantity:</label>
                <div className={styles.quantityControls}>
                  <button
                    className={styles.quantityButton}
                    onClick={() => handleQuantityChange(quantity - 1)}
                    disabled={quantity <= 1}
                  >
                    <FiMinus />
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(parseInt(e.target.value))}
                    min="1"
                    max={product.stock}
                    className={styles.quantityInput}
                  />
                  <button
                    className={styles.quantityButton}
                    onClick={() => handleQuantityChange(quantity + 1)}
                    disabled={quantity >= product.stock}
                  >
                    <FiPlus />
                  </button>
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className={styles.cartSection}>
              {inCart ? (
                <div className={styles.inCartControls}>
                  <p className={styles.inCartText}>
                    This item is in your cart ({cartQuantity})
                  </p>
                  <div className={styles.cartButtons}>
                    <Link to="/cart">
                      <Button variant="secondary" fullWidth>
                        View Cart
                      </Button>
                    </Link>
                    <Button
                      variant="primary"
                      onClick={handleAddToCart}
                      fullWidth
                      icon={<FiPlus />}
                    >
                      Add More
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="large"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  icon={<FiShoppingCart />}
                >
                  {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              )}
            </div>

            {/* Features */}
            <div className={styles.features}>
              <div className={styles.feature}>
                <FiTruck className={styles.featureIcon} />
                <div>
                  <h4>Free Shipping</h4>
                  <p>On orders over $50</p>
                </div>
              </div>
              <div className={styles.feature}>
                <FiShield className={styles.featureIcon} />
                <div>
                  <h4>Warranty</h4>
                  <p>{product.warranty?.period} {product.warranty?.unit} warranty</p>
                </div>
              </div>
              <div className={styles.feature}>
                <FiRefreshCcw className={styles.featureIcon} />
                <div>
                  <h4>Returns</h4>
                  <p>30-day return policy</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className={styles.detailTabs}>
          <div className={styles.tabHeaders}>
            {['description', 'specifications', 'reviews'].map(tab => (
              <button
                key={tab}
                className={`${styles.tabHeader} ${
                  activeTab === tab ? styles.active : ''
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'reviews' && ` (${product.numOfReviews})`}
              </button>
            ))}
          </div>

          <div className={styles.tabContent}>
            {activeTab === 'description' && (
              <div className={styles.description}>
                <p>{product.description}</p>
                {product.features && product.features.length > 0 && (
                  <div className={styles.featuresList}>
                    <h3>Key Features</h3>
                    <ul>
                      {product.features.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'specifications' && (
              <div className={styles.specifications}>
                {product.specifications && product.specifications.length > 0 ? (
                  <table className={styles.specsTable}>
                    <tbody>
                      {product.specifications.map((spec, index) => (
                        <tr key={index}>
                          <td className={styles.specKey}>{spec.key}</td>
                          <td className={styles.specValue}>{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No specifications available.</p>
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className={styles.reviews}>
                {reviewsLoading ? (
                  <div className="loading-spinner"></div>
                ) : reviews.length > 0 ? (
                  <div className={styles.reviewsList}>
                    {reviews.map((review, index) => (
                      <Card key={index} className={styles.reviewCard}>
                        <div className={styles.reviewHeader}>
                          <div className={styles.reviewUser}>
                            <strong>{review.name}</strong>
                            <div className={styles.reviewStars}>
                              {[...Array(5)].map((_, i) => (
                                <FiStar
                                  key={i}
                                  className={`${styles.star} ${
                                    i < review.rating ? styles.filled : ''
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className={styles.reviewDate}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={styles.reviewComment}>{review.comment}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p>No reviews yet. Be the first to review this product!</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className={styles.relatedProducts}>
            <h2>Related Products</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.slice(0, 4).map(relatedProduct => (
                <ProductCard
                  key={relatedProduct._id}
                  product={relatedProduct}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetail;
