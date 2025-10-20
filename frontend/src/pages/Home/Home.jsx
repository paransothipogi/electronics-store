import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiShield, FiHeadphones, FiRefreshCcw } from 'react-icons/fi';
import ProductCard from '../../components/product/ProductCard/ProductCard';
import Button from '../../components/ui/Button/Button';
import Card from '../../components/ui/Card/Card';
import { productAPI, categoryAPI } from '../../services/api';
import styles from './Home.module.css';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [
          featuredResponse,
          trendingResponse,
          bestSellersResponse,
          categoriesResponse
        ] = await Promise.all([
          productAPI.getFeatured(),
          productAPI.getTrending(),
          productAPI.getBestSellers(),
          categoryAPI.getFeatured()
        ]);

        setFeaturedProducts(featuredResponse.data.products || []);
        setTrendingProducts(trendingResponse.data.products || []);
        setBestSellers(bestSellersResponse.data.products || []);
        setCategories(categoriesResponse.data.categories || []);
      } catch (err) {
        setError('Failed to load data');
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const features = [
    {
      icon: <FiTruck />,
      title: 'Free Shipping',
      description: 'Free shipping on orders over $50'
    },
    {
      icon: <FiShield />,
      title: 'Secure Payment',
      description: '100% secure payment processing'
    },
    {
      icon: <FiHeadphones />,
      title: '24/7 Support',
      description: 'Round the clock customer support'
    },
    {
      icon: <FiRefreshCcw />,
      title: 'Easy Returns',
      description: '30-day hassle-free returns'
    }
  ];

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="loading-spinner"></div>
        <p>Loading amazing products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <Button onClick={() => window.location.reload()}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.heroContent}>
            <div className={styles.heroText}>
              <span className={styles.heroSubtitle}>
                Welcome to ElectroStore
              </span>
              <h1 className={styles.heroTitle}>
                Discover the Latest in
                <span className={styles.highlight}> Electronics</span>
              </h1>
              <p className={styles.heroDescription}>
                From cutting-edge smartphones to powerful laptops, find everything you need 
                to stay connected and productive. Shop with confidence and enjoy amazing deals.
              </p>
              <div className={styles.heroActions}>
                <Link to="/products">
                  <Button variant="primary" size="large" icon={<FiArrowRight />}>
                    Shop Now
                  </Button>
                </Link>
                <Link to="/deals">
                  <Button variant="outline" size="large">
                    View Deals
                  </Button>
                </Link>
              </div>
            </div>
            <div className={styles.heroImage}>
              <div className={styles.heroImageContent}>
                <div className={styles.floatingCard}>
                  <span className={styles.dealBadge}>50% OFF</span>
                  <h3>Latest iPhones</h3>
                  <p>Starting from $599</p>
                </div>
                <div className={styles.productShowcase}>
                  <img 
                    src="https://tse2.mm.bing.net/th/id/OIP.Jefrc8kc7jfxgdVM-frVPgHaE8?rs=1&pid=ImgDetMain&o=7&rm=3" 
                    alt="Featured Electronics"
                    className={styles.showcaseImage}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <Card key={index} className={styles.featureCard} hover>
                <div className={styles.featureIcon}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className={styles.categories}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Shop by Category</h2>
              <p>Explore our wide range of electronic categories</p>
            </div>
            <div className={styles.categoriesGrid}>
              {categories.map((category) => (
                <Link 
                  key={category._id} 
                  to={`/products?category=${category.name.toLowerCase()}`}
                  className={styles.categoryCard}
                >
                  <div className={styles.categoryImage}>
                    <img 
                      src={category.image?.url || '/api/placeholder/300/200'} 
                      alt={category.name}
                    />
                  </div>
                  <div className={styles.categoryContent}>
                    <h3>{category.name}</h3>
                    <p>{category.description}</p>
                    <span className={styles.categoryArrow}>
                      <FiArrowRight />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className={styles.productsSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Featured Products</h2>
              <p>Handpicked products just for you</p>
              <Link to="/products?featured=true">
                <Button variant="outline" icon={<FiArrowRight />}>
                  View All Featured
                </Button>
              </Link>
            </div>
            <div className={styles.productsGrid}>
              {featuredProducts.slice(0, 8).map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product} 
                  variant="featured"
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className={styles.productsSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Trending Now</h2>
              <p>What's popular this week</p>
              <Link to="/products?trending=true">
                <Button variant="outline" icon={<FiArrowRight />}>
                  View All Trending
                </Button>
              </Link>
            </div>
            <div className={styles.productsGrid}>
              {trendingProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Best Sellers Section - NOW USED */}
      {bestSellers.length > 0 && (
        <section className={styles.productsSection}>
          <div className="container">
            <div className={styles.sectionHeader}>
              <h2>Best Sellers</h2>
              <p>Our top-selling products this month</p>
              <Link to="/products?bestsellers=true">
                <Button variant="outline" icon={<FiArrowRight />}>
                  View All Best Sellers
                </Button>
              </Link>
            </div>
            <div className={styles.productsGrid}>
              {bestSellers.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter Section */}
      <section className={styles.newsletter}>
        <div className="container">
          <Card className={styles.newsletterCard} variant="gradient">
            <div className={styles.newsletterContent}>
              <h2>Stay Updated</h2>
              <p>Get the latest deals and new product announcements delivered to your inbox</p>
              <form className={styles.newsletterForm}>
                <input 
                  type="email" 
                  placeholder="Enter your email address"
                  className={styles.emailInput}
                />
                <Button type="submit" variant="primary">
                  Subscribe
                </Button>
              </form>
              <p className={styles.newsletterDisclaimer}>
                We respect your privacy. Unsubscribe anytime.
              </p>
            </div>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <h3>10K+</h3>
              <p>Happy Customers</p>
            </div>
            <div className={styles.statItem}>
              <h3>500+</h3>
              <p>Products Available</p>
            </div>
            <div className={styles.statItem}>
              <h3>50+</h3>
              <p>Top Brands</p>
            </div>
            <div className={styles.statItem}>
              <h3>99.9%</h3>
              <p>Uptime Guarantee</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
