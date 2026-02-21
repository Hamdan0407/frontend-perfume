import api from './axios';

const API_URL = '/wishlist';

export const wishlistAPI = {
  // Get user's wishlist
  getWishlist: async () => {
    const response = await api.get(API_URL);
    return response.data;
  },

  // Get wishlist product IDs (for quick check)
  getWishlistProductIds: async () => {
    const response = await api.get(`${API_URL}/product-ids`);
    return response.data;
  },

  // Add product to wishlist
  addToWishlist: async (productId) => {
    const response = await api.post(`${API_URL}/${productId}`);
    return response.data;
  },

  // Remove product from wishlist
  removeFromWishlist: async (productId) => {
    const response = await api.delete(`${API_URL}/${productId}`);
    return response.data;
  },

  // Check if product is in wishlist
  checkInWishlist: async (productId) => {
    const response = await api.get(`${API_URL}/check/${productId}`);
    return response.data.inWishlist;
  },

  // Get wishlist count
  getWishlistCount: async () => {
    const response = await api.get(`${API_URL}/count`);
    return response.data.count;
  },
};

export default wishlistAPI;
