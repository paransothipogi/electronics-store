import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload || []
      };
    
    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload;
      const existingItem = state.items.find(item => item.product._id === product._id);

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.product._id === product._id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          )
        };
      }

      return {
        ...state,
        items: [...state.items, { product, quantity }]
      };
    }

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.product._id !== action.payload)
      };

    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      
      if (quantity <= 0) {
        return {
          ...state,
          items: state.items.filter(item => item.product._id !== productId)
        };
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.product._id === productId
            ? { ...item, quantity }
            : item
        )
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      };

    case 'APPLY_COUPON':
      return {
        ...state,
        coupon: action.payload
      };

    case 'REMOVE_COUPON':
      return {
        ...state,
        coupon: null
      };

    default:
      return state;
  }
};

const initialState = {
  items: [],
  coupon: null
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: parsedCart });
      } catch (error) {
        console.error('Error parsing saved cart:', error);
        localStorage.removeItem('cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);

  const addToCart = (product, quantity = 1) => {
    dispatch({ 
      type: 'ADD_ITEM', 
      payload: { product, quantity } 
    });
  };

  const removeFromCart = (productId) => {
    dispatch({ 
      type: 'REMOVE_ITEM', 
      payload: productId 
    });
  };

  const updateQuantity = (productId, quantity) => {
    dispatch({ 
      type: 'UPDATE_QUANTITY', 
      payload: { productId, quantity } 
    });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const applyCoupon = (coupon) => {
    dispatch({ type: 'APPLY_COUPON', payload: coupon });
  };

  const removeCoupon = () => {
    dispatch({ type: 'REMOVE_COUPON' });
  };

  // Cart calculations
  const getCartTotal = () => {
    const subtotal = state.items.reduce((total, item) => {
      const price = item.product.discountPrice || item.product.price;
      return total + (price * item.quantity);
    }, 0);

    // Apply coupon discount
    const discount = state.coupon ? (subtotal * state.coupon.discount / 100) : 0;
    
    return Math.max(0, subtotal - discount);
  };

  const getCartSubtotal = () => {
    return state.items.reduce((subtotal, item) => {
      const price = item.product.discountPrice || item.product.price;
      return subtotal + (price * item.quantity);
    }, 0);
  };

  const getCartCount = () => {
    return state.items.reduce((count, item) => count + item.quantity, 0);
  };

  const getTotalSavings = () => {
    const savings = state.items.reduce((total, item) => {
      if (item.product.discountPrice) {
        const itemSavings = (item.product.price - item.product.discountPrice) * item.quantity;
        return total + itemSavings;
      }
      return total;
    }, 0);

    // Add coupon savings
    const couponSavings = state.coupon 
      ? (getCartSubtotal() * state.coupon.discount / 100) 
      : 0;

    return savings + couponSavings;
  };

  const getShippingCost = () => {
    const subtotal = getCartSubtotal();
    const freeShippingThreshold = 50;
    
    return subtotal >= freeShippingThreshold ? 0 : 5.99;
  };

  const getTax = () => {
    const subtotal = getCartSubtotal();
    const taxRate = 0.08; // 8% tax
    
    return subtotal * taxRate;
  };

  const getFinalTotal = () => {
    return getCartTotal() + getShippingCost() + getTax();
  };

  const isInCart = (productId) => {
    return state.items.some(item => item.product._id === productId);
  };

  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.product._id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    items: state.items,
    coupon: state.coupon,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    applyCoupon,
    removeCoupon,
    getCartTotal,
    getCartSubtotal,
    getCartCount,
    getTotalSavings,
    getShippingCost,
    getTax,
    getFinalTotal,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
