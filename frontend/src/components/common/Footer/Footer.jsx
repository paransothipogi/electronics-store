import React from 'react';
import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiInstagram, FiLinkedin, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import styles from './Footer.module.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>⚡</div>
              <span>ElectroStore</span>
            </div>
            <p className={styles.description}>
              Your one-stop destination for the latest electronics and tech gadgets. 
              Quality products, competitive prices, and exceptional service.
            </p>
            <div className={styles.socialLinks}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <FiFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <FiLinkedin />
              </a>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h3>Quick Links</h3>
            <ul>
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/deals">Deals & Offers</Link></li>
              <li><Link to="/brands">Top Brands</Link></li>
              <li><Link to="/new-arrivals">New Arrivals</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3>Customer Service</h3>
            <ul>
              <li><Link to="/contact">Contact Us</Link></li>
              <li><Link to="/support">Help Center</Link></li>
              <li><Link to="/shipping">Shipping Info</Link></li>
              <li><Link to="/returns">Returns</Link></li>
              <li><Link to="/warranty">Warranty</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3>About</h3>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/press">Press</Link></li>
              <li><Link to="/investors">Investors</Link></li>
              <li><Link to="/blog">Blog</Link></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h3>Contact Info</h3>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <FiPhone />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className={styles.contactItem}>
                <FiMail />
                <span>support@electrostore.com</span>
              </div>
              <div className={styles.contactItem}>
                <FiMapPin />
                <span>123 Tech Street, Digital City, DC 12345</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.copyright}>
            <p>&copy; {currentYear} ElectroStore. All rights reserved.</p>
          </div>
          <div className={styles.legalLinks}>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/cookies">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
