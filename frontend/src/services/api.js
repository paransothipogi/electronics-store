import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
};

export const productAPI = {
  getAll: (params = {}) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  getFeatured: () => api.get('/products/featured'),
  getTrending: () => api.get('/products/trending'),
  getBestSellers: () => api.get('/products/bestsellers'),
  search: (params = {}) => api.get('/products/search', { params }),
  getBrands: () => api.get('/products/brands'),
  getPriceRange: () => api.get('/products/price-range'),
  getRelated: (id) => api.get(`/products/${id}/related`),
  getReviews: (id, params = {}) => api.get(`/products/${id}/reviews`, { params }),
};

// Add missing categoryAPI
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (slug) => api.get(`/categories/${slug}`),
  getFeatured: () => api.get('/categories/featured')
};

// Helper functions
export const formatPrice = (price) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
};

export const handleApiError = (error) => {
  return error.response?.data?.message || 'An error occurred';
};

export const testConnection = async () => {
  try {
    const response = await api.get('/health');
    return { connected: true, data: response.data };
  } catch (error) {
    return { connected: false, error: error.message };
  }
};

export default api;
export { api };
