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
   * {
   *   data: [{ id, name, description, price, image, rating }, ...],
   *   pagination: { total, page, limit, pages }
   * }
   */
  getProducts: async (params = {}) => {
    const response = await api.get('/products', { params });
    return response.data;
  },

  /**
   * Get single product by ID
   * @param {number} productId - Product ID
   * @returns {Promise} - Product details
   * 
   * Response:
   * {
   *   id, name, description, price, image, rating,
   *   category, brand, stock, reviews: [{ id, rating, comment }]
   * }
   * 
   * Errors:
   * - 404: Product not found
   */
  getProductById: async (productId) => {
    const response = await api.get(`/products/${productId}`);
    return response.data;
  },

  /**
   * Search products
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.q - Search query
   * @param {string} searchParams.category - Filter by category
   * @returns {Promise} - Search results
   */
  searchProducts: async (searchParams) => {
    const response = await api.get('/products/search', { params: searchParams });
    return response.data;
  },

  /**
   * Get featured products
   * @param {number} limit - Number of products to return (default: 8)
   * @returns {Promise} - Featured products list
   */
  getFeaturedProducts: async (limit = 8) => {
    const response = await api.get('/products/featured', { params: { limit } });
    return response.data;
  },

  /**
   * Get products by category
   * @param {string} category - Category name
   * @param {Object} params - Additional parameters (page, limit, sort)
   * @returns {Promise} - Products in category
   */
  getProductsByCategory: async (category, params = {}) => {
    const response = await api.get(`/products/category/${category}`, { params });
    return response.data;
  },

  /**
   * Filter products by criteria
   * @param {Object} filters - Filter criteria
   * @param {string} filters.minPrice - Minimum price
   * @param {string} filters.maxPrice - Maximum price
   * @param {string} filters.category - Category
   * @param {string} filters.rating - Minimum rating
   * @returns {Promise} - Filtered products
   */
  filterProducts: async (filters) => {
    const response = await api.post('/products/filter', filters);
    return response.data;
  },
};

export default productAPI;
