import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiShoppingCart, FiMenu, FiX, FiSearch, FiUser, FiHeart, FiLogOut } from 'react-icons/fi';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import Button from '../../ui/Button/Button';
import styles from './Header.module.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  
  const { getCartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setIsMenuOpen(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  // Navigation items
  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Products', path: '/products' },
    { label: 'Categories', path: '/categories' },
    { label: 'Deals', path: '/deals' },
    { label: 'About', path: '/about' }
  ];

  const cartCount = getCartCount();

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <div className={styles.headerContent}>
          {/* Logo */}
          <Link to="/" className={styles.logo} onClick={() => setIsMenuOpen(false)}>
            <div className={styles.logoIcon}>
              <span>⚡</span>
            </div>
            <span className={styles.logoText}>ElectroStore</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className={styles.desktopNav}>
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`${styles.navLink} ${
                  location.pathname === item.path ? styles.active : ''
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <form className={styles.searchForm} onSubmit={handleSearch}>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="Search electronics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                <FiSearch />
              </button>
            </div>
          </form>

          {/* Header Actions */}
          <div className={styles.headerActions}>
            {/* User Menu */}
            {user ? (
              <div className={styles.userMenu}>
                <button
                  className={styles.userButton}
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <FiUser />
                  <span className={styles.hiddenMobile}>
                    Hi, {user.name.split(' ')[0]}
                  </span>
                </button>
                {isUserMenuOpen && (
                  <div className={styles.userDropdown}>
                    <Link to="/profile" className={styles.dropdownItem}>
                      <FiUser /> My Profile
                    </Link>
                    <Link to="/orders" className={styles.dropdownItem}>
                      <FiHeart /> My Orders
                    </Link>
                    <Link to="/wishlist" className={styles.dropdownItem}>
                      <FiHeart /> Wishlist
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={styles.dropdownItem}
                    >
                      <FiLogOut /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link to="/login">
                  <Button variant="ghost" size="small">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="small">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Cart Icon */}
            <Link to="/cart" className={styles.cartLink}>
              <div className={styles.cartIconWrapper}>
                <FiShoppingCart className={styles.cartIcon} />
                {cartCount > 0 && (
                  <span className={styles.cartBadge}>{cartCount}</span>
                )}
              </div>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              className={styles.menuToggle}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMenuOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
          {/* Mobile Search */}
          <form className={styles.mobileSearch} onSubmit={handleSearch}>
            <div className={styles.searchInputWrapper}>
              <input
                type="text"
                placeholder="Search electronics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                <FiSearch />
              </button>
            </div>
          </form>

          {/* Mobile Navigation */}
          <nav className={styles.mobileNav}>
            {navItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className={`${styles.mobileNavLink} ${
                  location.pathname === item.path ? styles.active : ''
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Auth */}
          {!user && (
            <div className={styles.mobileAuth}>
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" fullWidth>
                  Login
                </Button>
              </Link>
              <Link to="/register" onClick={() => setIsMenuOpen(false)}>
                <Button variant="primary" fullWidth>
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Overlay */}
        {isMenuOpen && (
          <div 
            className={styles.overlay} 
            onClick={() => setIsMenuOpen(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsMenuOpen(false);
              }
            }}
          />
        )}

        {/* User Menu Overlay */}
        {isUserMenuOpen && (
          <div 
            className={styles.userMenuOverlay}
            onClick={() => setIsUserMenuOpen(false)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setIsUserMenuOpen(false);
              }
            }}
          />
        )}
      </div>
    </header>
  );
};

export default Header;
