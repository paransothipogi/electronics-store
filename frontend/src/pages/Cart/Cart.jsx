import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiShoppingBag, FiArrowLeft, FiGift, FiX } from 'react-icons/fi';
import Button from '../../components/ui/Button/Button';
import Card from '../../components/ui/Card/Card';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../services/api';
import styles from './Cart.module.css';

const Cart = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartSubtotal,
    getCartTotal,
    getTotalSavings,
    getShippingCost,
    getTax,
    getFinalTotal,
    coupon,
    applyCoupon,
    removeCoupon
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity === 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');

    try {
      // Simulate API call for coupon validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coupon validation
      const validCoupons = {
        'SAVE10': { code: 'SAVE10', discount: 10, description: '10% off your order' },
        'WELCOME20': { code: 'WELCOME20', discount: 20, description: '20% off for new customers' },
        'FREE50': { code: 'FREE50', discount: 15, description: '15% off orders over $50' }
      };

      const validCoupon = validCoupons[couponCode.toUpperCase()];
      
      if (validCoupon) {
        applyCoupon(validCoupon);
        setCouponCode('');
        setCouponError('');
      } else {
        setCouponError('Invalid coupon code');
      }
    } catch (error) {
      setCouponError('Failed to apply coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponCode('');
    setCouponError('');
  };

  const handleCheckout = () => {
    if (!user) {
      navigate('/login?redirect=/cart');
    } else {
      navigate('/checkout');
    }
  };

  const subtotal = getCartSubtotal();
  const savings = getTotalSavings();
  const shipping = getShippingCost();
  const tax = getTax();
  const total = getFinalTotal();
  const freeShippingThreshold = 50;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  if (items.length === 0) {
    return (
      <div className={styles.emptyCart}>
        <div className="container">
          <Card className={styles.emptyCartCard}>
            <div className={styles.emptyCartContent}>
              <FiShoppingBag className={styles.emptyCartIcon} />
              <h2>Your cart is empty</h2>
              <p>Looks like you haven't added any items to your cart yet.</p>
              <Link to="/products">
                <Button variant="primary" size="large" icon={<FiShoppingBag />}>
                  Start Shopping
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cart}>
      <div className="container">
        <div className={styles.cartHeader}>
          <div className={styles.headerContent}>
            <Link to="/products" className={styles.backLink}>
              <FiArrowLeft />
              Continue Shopping
            </Link>
            <h1>Shopping Cart ({items.length} items)</h1>
          </div>
          <Button
            variant="outline"
            size="small"
            onClick={clearCart}
            icon={<FiTrash2 />}
          >
            Clear Cart
          </Button>
        </div>

        <div className={styles.cartContent}>
          {/* Cart Items */}
          <div className={styles.cartItems}>
            {/* Free Shipping Progress */}
            {shipping > 0 && (
              <Card className={styles.shippingCard}>
                <div className={styles.shippingProgress}>
                  <div className={styles.shippingInfo}>
                    <FiGift className={styles.shippingIcon} />
                    <div>
                      <p>
                        {remainingForFreeShipping > 0 
                          ? `Add ${formatPrice(remainingForFreeShipping)} more for FREE shipping!`
                          : 'You qualify for FREE shipping!'
                        }
                      </p>
                    </div>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ 
                        width: `${Math.min(100, (subtotal / freeShippingThreshold) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Cart Items List */}
            <div className={styles.itemsList}>
              {items.map((item) => (
                <Card key={item.product._id} className={styles.cartItem}>
                  <div className={styles.itemContent}>
                    <Link 
                      to={`/products/${item.product._id}`}
                      className={styles.itemImage}
                    >
                      <img
                        src={item.product.images?.[0]?.url || '/api/placeholder/150/150'}
                        alt={item.product.name}
                      />
                    </Link>

                    <div className={styles.itemDetails}>
                      <div className={styles.itemInfo}>
                        <Link 
                          to={`/products/${item.product._id}`}
                          className={styles.itemName}
                        >
                          <h3>{item.product.name}</h3>
                        </Link>
                        <div className={styles.itemMeta}>
                          <span className={styles.brand}>{item.product.brand}</span>
                          <span className={styles.category}>{item.product.category}</span>
                        </div>
                        {item.product.stock <= 10 && item.product.stock > 0 && (
                          <p className={styles.stockWarning}>
                            Only {item.product.stock} left in stock
                          </p>
                        )}
                      </div>

                      <div className={styles.itemControls}>
                        <div className={styles.quantityControls}>
                          <button
                            className={styles.quantityBtn}
                            onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                          >
                            <FiMinus />
                          </button>
                          <span className={styles.quantity}>{item.quantity}</span>
                          <button
                            className={styles.quantityBtn}
                            onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <FiPlus />
                          </button>
                        </div>

                        <button
                          className={styles.removeBtn}
                          onClick={() => removeFromCart(item.product._id)}
                          title="Remove from cart"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>

                    <div className={styles.itemPricing}>
                      <div className={styles.priceInfo}>
                        {item.product.discountPrice ? (
                          <>
                            <span className={styles.currentPrice}>
                              {formatPrice(item.product.discountPrice)}
                            </span>
                            <span className={styles.originalPrice}>
                              {formatPrice(item.product.price)}
                            </span>
                          </>
                        ) : (
                          <span className={styles.currentPrice}>
                            {formatPrice(item.product.price)}
                          </span>
                        )}
                      </div>
                      <div className={styles.totalPrice}>
                        {formatPrice((item.product.discountPrice || item.product.price) * item.quantity)}
                      </div>
                      {item.product.discountPrice && (
                        <div className={styles.savings}>
                          Save {formatPrice((item.product.price - item.product.discountPrice) * item.quantity)}
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className={styles.orderSummary}>
            <Card className={styles.summaryCard}>
              <div className={styles.summaryHeader}>
                <h2>Order Summary</h2>
              </div>

              <div className={styles.summaryContent}>
                {/* Coupon Section */}
                <div className={styles.couponSection}>
                  {coupon ? (
                    <div className={styles.appliedCoupon}>
                      <div className={styles.couponInfo}>
                        <FiGift className={styles.couponIcon} />
                        <div>
                          <strong>{coupon.code}</strong>
                          <p>{coupon.description}</p>
                        </div>
                      </div>
                      <button
                        className={styles.removeCouponBtn}
                        onClick={handleRemoveCoupon}
                      >
                        <FiX />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.couponForm}>
                      <div className={styles.couponInput}>
                        <input
                          type="text"
                          placeholder="Enter coupon code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <Button
                          variant="outline"
                          size="small"
                          onClick={handleApplyCoupon}
                          loading={isApplyingCoupon}
                          disabled={!couponCode.trim()}
                        >
                          Apply
                        </Button>
                      </div>
                      {couponError && (
                        <p className={styles.couponError}>{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price Breakdown */}
                <div className={styles.priceBreakdown}>
                  <div className={styles.priceRow}>
                    <span>Subtotal ({items.length} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {savings > 0 && (
                    <div className={styles.priceRow}>
                      <span>Savings</span>
                      <span className={styles.savingsAmount}>
                        -{formatPrice(savings)}
                      </span>
                    </div>
                  )}

                  <div className={styles.priceRow}>
                    <span>
                      Shipping
                      {shipping === 0 && (
                        <span className={styles.freeShipping}> (FREE)</span>
                      )}
                    </span>
                    <span>{shipping > 0 ? formatPrice(shipping) : 'FREE'}</span>
                  </div>

                  <div className={styles.priceRow}>
                    <span>Tax</span>
                    <span>{formatPrice(tax)}</span>
                  </div>

                  <div className={styles.totalRow}>
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <div className={styles.checkoutSection}>
                  <Button
                    variant="primary"
                    size="large"
                    fullWidth
                    onClick={handleCheckout}
                  >
                    {user ? 'Proceed to Checkout' : 'Login to Checkout'}
                  </Button>
                  
                  {!user && (
                    <p className={styles.checkoutNote}>
                      You'll be able to review your order before it's placed.
                    </p>
                  )}
                </div>

                {/* Security Features */}
                <div className={styles.securityFeatures}>
                  <div className={styles.feature}>
                    <span>🔒</span>
                    <span>Secure Checkout</span>
                  </div>
                  <div className={styles.feature}>
                    <span>🚚</span>
                    <span>Fast Delivery</span>
                  </div>
                  <div className={styles.feature}>
                    <span>↩️</span>
                    <span>Easy Returns</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Recommended Products */}
            <Card className={styles.recommendationsCard}>
              <h3>You might also like</h3>
              <div className={styles.recommendations}>
                <p>Loading recommendations...</p>
                {/* This would typically show recommended products */}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
