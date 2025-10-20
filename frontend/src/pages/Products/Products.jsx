import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FiFilter, FiGrid, FiList, FiX, FiChevronDown } from 'react-icons/fi';
import ProductCard from '../../components/product/ProductCard/ProductCard';
import Button from '../../components/ui/Button/Button';
import Card from '../../components/ui/Card/Card';
import { productAPI } from '../../services/api';
import styles from './Products.module.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    minPrice: '',
    maxPrice: '',
    rating: '',
    availability: true
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    resultsPerPage: 12
  });
  const [brands, setBrands] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const brand = searchParams.get('brand') || '';
    const search = searchParams.get('search') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';
    const rating = searchParams.get('rating') || '';
    const page = parseInt(searchParams.get('page')) || 1;
    const sort = searchParams.get('sort') || 'newest';

    setFilters(prev => ({
      ...prev,
      category,
      brand,
      search,
      minPrice,
      maxPrice,
      rating
    }));
    setSortBy(sort);
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, [searchParams]);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: pagination.currentPage,
        limit: pagination.resultsPerPage,
        sort: sortBy,
        ...filters
      };

      // Remove empty values
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await productAPI.getAll(params);
      const { products, totalPages, totalProducts, currentPage } = response.data.data;

      setProducts(products || []);
      setPagination(prev => ({
        ...prev,
        totalPages,
        totalProducts,
        currentPage
      }));
    } catch (err) {
      setError('Failed to load products. Please try again.');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [filters, sortBy, pagination.currentPage, pagination.resultsPerPage]);

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const [brandsResponse, priceResponse] = await Promise.all([
        productAPI.getBrands(),
        productAPI.getPriceRange()
      ]);

      setBrands(brandsResponse.data.brands || []);
      setPriceRange(priceResponse.data.priceRange || { min: 0, max: 1000 });
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchFilterOptions();
  }, [fetchFilterOptions]);

  // Update URL params when filters change
  const updateURLParams = useCallback((newFilters, newSort, newPage = 1) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });

    if (newSort && newSort !== 'newest') {
      params.set('sort', newSort);
    }

    if (newPage > 1) {
      params.set('page', newPage.toString());
    }

    setSearchParams(params);
  }, [setSearchParams]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    updateURLParams(newFilters, sortBy, 1);
  };

  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    updateURLParams(filters, newSort, 1);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
    updateURLParams(filters, sortBy, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear filters
  const clearFilters = () => {
    const clearedFilters = {
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      availability: true
    };
    setFilters(clearedFilters);
    setSortBy('newest');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    setSearchParams({});
  };

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.entries(filters).filter(([key, value]) => 
      key !== 'availability' && value && value !== ''
    ).length;
  };

  const categories = [
    'smartphones',
    'laptops', 
    'tablets',
    'headphones',
    'cameras',
    'gaming',
    'accessories'
  ];

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'popularity', label: 'Most Popular' }
  ];

  return (
    <div className={styles.products}>
      <div className="container">
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className={styles.headerContent}>
            <h1>Products</h1>
            <p>
              {pagination.totalProducts > 0 
                ? `Showing ${pagination.totalProducts} products`
                : 'No products found'
              }
            </p>
          </div>
          
          {/* Controls */}
          <div className={styles.controls}>
            <div className={styles.viewControls}>
              <button
                className={`${styles.viewButton} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <FiGrid />
              </button>
              <button
                className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                onClick={() => setViewMode('list')}
              >
                <FiList />
              </button>
            </div>

            <div className={styles.sortControl}>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className={styles.sortSelect}
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FiChevronDown className={styles.selectIcon} />
            </div>

            <button
              className={styles.mobileFilterToggle}
              onClick={() => setShowMobileFilters(true)}
            >
              <FiFilter />
              Filters {getActiveFilterCount() > 0 && `(${getActiveFilterCount()})`}
            </button>
          </div>
        </div>

        <div className={styles.content}>
          {/* Sidebar Filters */}
          <aside className={styles.sidebar}>
            <Card className={styles.filtersCard}>
              <div className={styles.filtersHeader}>
                <h3>Filters</h3>
                {getActiveFilterCount() > 0 && (
                  <Button variant="ghost" size="small" onClick={clearFilters}>
                    Clear All
                  </Button>
                )}
              </div>

              <div className={styles.filterSection}>
                <h4>Category</h4>
                <div className={styles.filterOptions}>
                  {categories.map(category => (
                    <label key={category} className={styles.filterOption}>
                      <input
                        type="radio"
                        name="category"
                        value={category}
                        checked={filters.category === category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      />
                      <span className={styles.filterLabel}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.filterSection}>
                <h4>Brand</h4>
                <div className={styles.filterOptions}>
                  {brands.slice(0, 10).map(brand => (
                    <label key={brand} className={styles.filterOption}>
                      <input
                        type="radio"
                        name="brand"
                        value={brand}
                        checked={filters.brand === brand}
                        onChange={(e) => handleFilterChange('brand', e.target.value)}
                      />
                      <span className={styles.filterLabel}>{brand}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className={styles.filterSection}>
                <h4>Price Range</h4>
                <div className={styles.priceInputs}>
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className={styles.priceInput}
                  />
                  <span>to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className={styles.priceInput}
                  />
                </div>
              </div>

              <div className={styles.filterSection}>
                <h4>Rating</h4>
                <div className={styles.filterOptions}>
                  {[4, 3, 2, 1].map(rating => (
                    <label key={rating} className={styles.filterOption}>
                      <input
                        type="radio"
                        name="rating"
                        value={rating}
                        checked={filters.rating === rating.toString()}
                        onChange={(e) => handleFilterChange('rating', e.target.value)}
                      />
                      <span className={styles.filterLabel}>
                        {rating}+ Stars
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          </aside>

          {/* Main Content */}
          <main className={styles.main}>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className="loading-spinner"></div>
                <p>Loading products...</p>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <h3>Something went wrong</h3>
                <p>{error}</p>
                <Button onClick={fetchProducts}>Try Again</Button>
              </div>
            ) : products.length === 0 ? (
              <div className={styles.emptyContainer}>
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className={`${styles.productsGrid} ${styles[viewMode]}`}>
                  {products.map(product => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      variant={viewMode === 'list' ? 'list' : 'default'}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className={styles.pagination}>
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={pagination.currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <div className={styles.pageNumbers}>
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        const pageNumber = i + 1;
                        return (
                          <button
                            key={pageNumber}
                            className={`${styles.pageNumber} ${
                              pageNumber === pagination.currentPage ? styles.active : ''
                            }`}
                            onClick={() => handlePageChange(pageNumber)}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={pagination.currentPage === pagination.totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Filters Modal */}
      {showMobileFilters && (
        <div className={styles.mobileFiltersModal}>
          <div className={styles.modalOverlay} onClick={() => setShowMobileFilters(false)} />
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Filters</h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowMobileFilters(false)}
              >
                <FiX />
              </button>
            </div>
            <div className={styles.modalBody}>
              {/* Same filter content as sidebar */}
              <div className={styles.filterSection}>
                <h4>Category</h4>
                <div className={styles.filterOptions}>
                  {categories.map(category => (
                    <label key={category} className={styles.filterOption}>
                      <input
                        type="radio"
                        name="mobile-category"
                        value={category}
                        checked={filters.category === category}
                        onChange={(e) => handleFilterChange('category', e.target.value)}
                      />
                      <span className={styles.filterLabel}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              {/* Add other filter sections similarly */}
            </div>
            <div className={styles.modalFooter}>
              <Button variant="outline" onClick={clearFilters} fullWidth>
                Clear All
              </Button>
              <Button variant="primary" onClick={() => setShowMobileFilters(false)} fullWidth>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
