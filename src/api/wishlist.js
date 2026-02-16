import axios from 'axios';

const API_URL = 'http://localhost:8080/api/wishlist';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const wishlistAPI = {
  // Get user's wishlist
  getWishlist: async () => {
    const response = await axios.get(API_URL, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Get wishlist product IDs (for quick check)
  getWishlistProductIds: async () => {
    const response = await axios.get(`${API_URL}/product-ids`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Add product to wishlist
  addToWishlist: async (productId) => {
    const response = await axios.post(`${API_URL}/${productId}`, {}, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Remove product from wishlist
  removeFromWishlist: async (productId) => {
    const response = await axios.delete(`${API_URL}/${productId}`, {
      headers: getAuthHeader(),
    });
    return response.data;
  },

  // Check if product is in wishlist
  checkInWishlist: async (productId) => {
    const response = await axios.get(`${API_URL}/check/${productId}`, {
      headers: getAuthHeader(),
    });
    return response.data.inWishlist;
  },

  // Get wishlist count
  getWishlistCount: async () => {
    const response = await axios.get(`${API_URL}/count`, {
      headers: getAuthHeader(),
    });
    return response.data.count;
  },
};

export default wishlistAPI;
