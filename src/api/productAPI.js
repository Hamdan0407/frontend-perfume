import api from './axios';

/**
 * Products API Service
 * 
 * Handles all product-related API calls:
 * - Get all products
 * - Get product by ID
 * - Search and filter products
 * - Get featured products
 */

const productAPI = {
  /**
   * Get all products with optional filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20)
   * @param {string} params.search - Search term
   * @param {string} params.category - Category filter
   * @param {string} params.minPrice - Minimum price filter
   * @param {string} params.maxPrice - Maximum price filter
   * @param {string} params.sortBy - Sort field (name, price, rating)
   * @returns {Promise} - Paginated products list
   * 
   * Response:
   * Paginated endpoints: { content: [...], totalPages, totalElements, ... }
   * Direct list endpoints: [{ id, name, ... }, ...]
   */
  getProducts: async (params = {}) => {
    const response = await api.get('products', { params });
    return response.data;
  },

  getProductById: async (productId) => {
    const response = await api.get(`products/${productId}`);
    return response.data;
  },

  searchProducts: async (searchParams) => {
    const response = await api.get('products/search', { params: searchParams });
    return response.data;
  },

  getFeaturedProducts: async (limit = 8) => {
    const response = await api.get('products/featured', { params: { limit } });
    return response.data;
  },

  getProductsByCategory: async (category, params = {}) => {
    const response = await api.get(`products/category/${category}`, { params });
    return response.data;
  },

  filterProducts: async (filters) => {
    const response = await api.post('products/filter', filters);
    return response.data;
  },
};

export default productAPI;
