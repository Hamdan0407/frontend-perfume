import api from './axios';

/**
 * Review API Service
 * 
 * Handles product reviews:
 * - Get product reviews
 * - Get user's reviews
 * - Add review to product
 * - Update review
 * - Delete review
 * - Get review stats
 * 
 * Authentication required for posting/editing reviews
 */

const reviewAPI = {
  /**
   * Get all reviews for a product
   * Requires: No authentication
   * @param {number} productId - Product ID
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.sortBy - Sort field (helpful, recent, rating)
   * @param {number} params.minRating - Filter by minimum rating (1-5)
   * @returns {Promise} - Reviews list with pagination
   * 
   * Response:
   * {
   *   data: [
   *     {
   *       id, productId, userId, user: { id, firstName, lastName },
   *       rating, title, comment, helpful, notHelpful,
   *       verified, createdAt, updatedAt
   *     }
   *   ],
   *   pagination: { total, page, limit, pages }
   * }
   */
  getProductReviews: async (productId, params = {}) => {
    const response = await api.get(`products/${productId}/reviews`, { params });
    return response.data.data;
  },

  /**
   * Get user's own reviews
   * Requires: Authentication
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number
   * @param {number} params.limit - Items per page
   * @returns {Promise} - User's reviews list
   * 
   * Response:
   * {
   *   data: [...reviews],
   *   pagination: { total, page, limit, pages }
   * }
   * 
   * Errors:
   * - 401: Not authenticated
   */
  getUserReviews: async (params = {}) => {
    const response = await api.get('reviews/my-reviews', { params });
    return response.data.data;
  },

  /**
   * Get single review
   * @param {number} reviewId - Review ID
   * @returns {Promise} - Review details
   */
  getReviewById: async (reviewId) => {
    const response = await api.get(`reviews/${reviewId}`);
    return response.data.data;
  },

  /**
   * Add review to product
   * Requires: Authentication
   * @param {number} productId - Product ID
   * @param {Object} reviewData - Review information
   * @param {number} reviewData.rating - Rating (1-5)
   * @param {string} reviewData.title - Review title
   * @param {string} reviewData.comment - Review comment
   * @returns {Promise} - Created review
   * 
   * Response:
   * {
   *   id, productId, userId, rating, title, comment,
   *   helpful: 0, notHelpful: 0, verified: false,
   *   createdAt
   * }
   * 
   * Validation:
   * - rating: Required, 1-5
   * - title: Required, 5-200 characters
   * - comment: Optional, max 2000 characters
   * 
   * Errors:
   * - 400: Invalid review data
   * - 401: Not authenticated
   * - 409: Already reviewed this product
   */
  addReview: async (productId, reviewData) => {
    const response = await api.post(`products/${productId}/reviews`, reviewData);
    return response.data.data;
  },

  // Simple wrapper for backend /api/reviews endpoint
  createReview: async (productId, rating, comment) => {
    const response = await api.post('reviews', {
      productId,
      rating,
      comment,
    });
    return response.data;
  },

  /**
   * Update own review
   * Requires: Authentication
   * @param {number} reviewId - Review ID
   * @param {Object} reviewData - Updated review data
   * @param {number} reviewData.rating - New rating
   * @param {string} reviewData.title - New title
   * @param {string} reviewData.comment - New comment
   * @returns {Promise} - Updated review
   * 
   * Errors:
   * - 400: Invalid review data
   * - 401: Not authenticated
   * - 403: Not review author
   * - 404: Review not found
   */
  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`reviews/${reviewId}`, reviewData);
    return response.data.data;
  },

  /**
   * Delete own review
   * Requires: Authentication
   * @param {number} reviewId - Review ID
   * @returns {Promise} - Success status
   * 
   * Errors:
   * - 401: Not authenticated
   * - 403: Not review author
   * - 404: Review not found
   */
  deleteReview: async (reviewId) => {
    await api.delete(`reviews/${reviewId}`);
    return true;
  },

  /**
   * Mark review as helpful
   * Requires: No authentication (IP-based tracking)
   * @param {number} reviewId - Review ID
   * @returns {Promise} - Updated helpful count
   */
  markHelpful: async (reviewId) => {
    const response = await api.post(`reviews/${reviewId}/helpful`);
    return response.data.data;
  },

  /**
   * Mark review as not helpful
   * Requires: No authentication
   * @param {number} reviewId - Review ID
   * @returns {Promise} - Updated not helpful count
   */
  markNotHelpful: async (reviewId) => {
    const response = await api.post(`reviews/${reviewId}/not-helpful`);
    return response.data.data;
  },

  /**
   * Get review statistics for a product
   * @param {number} productId - Product ID
   * @returns {Promise} - Review stats
   * 
   * Response:
   * {
   *   productId, averageRating, totalReviews,
   *   ratingDistribution: { 5: count, 4: count, ... },
   *   verified: count,
   *   percentageRecommended: number
   * }
   */
  getReviewStats: async (productId) => {
    const response = await api.get(`products/${productId}/reviews/stats`);
    return response.data.data;
  },
};

export default reviewAPI;
