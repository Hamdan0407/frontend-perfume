import api from './axios';

/**
 * Cart API Service
 * 
 * Handles all shopping cart operations:
 * - Get cart
 * - Add item to cart
 * - Update cart item quantity
 * - Remove item from cart
 * - Clear cart
 * 
 * All operations require authentication
 */

const cartAPI = {
  /**
   * Get user's shopping cart
   * Requires: Authentication
   * @returns {Promise} - Cart data with items
   * 
   * Response:
   * {
   *   id, userId, items: [
   *     { id, productId, product: {...}, quantity, price }
   *   ],
   *   subtotal, tax, total, itemCount
   * }
   * 
   * Errors:
   * - 401: Not authenticated
   */
  getCart: async () => {
    const response = await api.get('cart');
    return response.data.data;
  },

  /**
   * Add product to cart
   * Requires: Authentication
   * @param {Object} item - Cart item details
   * @param {number} item.productId - Product ID
   * @param {number} item.quantity - Quantity to add (default: 1)
   * @returns {Promise} - Updated cart
   * 
   * Errors:
   * - 400: Invalid quantity or product not found
   * - 401: Not authenticated
   */
  addToCart: async (productId, quantity = 1) => {
    const response = await api.post('cart', { productId, quantity });
    return response.data.data;
  },

  /**
   * Update cart item quantity
   * Requires: Authentication
   * @param {number} itemId - Cart item ID
   * @param {number} quantity - New quantity
   * @returns {Promise} - Updated cart
   * 
   * Errors:
   * - 400: Invalid quantity
   * - 404: Item not found in cart
   * - 401: Not authenticated
   */
  updateCartItem: async (itemId, quantity) => {
    const response = await api.put(`cart/items/${itemId}`, { quantity });
    return response.data.data;
  },

  /**
   * Remove item from cart
   * Requires: Authentication
   * @param {number} itemId - Cart item ID
   * @returns {Promise} - Updated cart
   * 
   * Errors:
   * - 404: Item not found in cart
   * - 401: Not authenticated
   */
  removeFromCart: async (itemId) => {
    const response = await api.delete(`cart/items/${itemId}`);
    return response.data.data;
  },

  /**
   * Clear entire cart
   * Requires: Authentication
   * @returns {Promise} - Empty cart
   */
  clearCart: async () => {
    const response = await api.post('cart/clear');
    return response.data.data;
  },

  /**
   * Get cart item count
   * Requires: Authentication
   * @returns {Promise} - Item count
   */
  getCartCount: async () => {
    const response = await api.get('cart/count');
    return response.data.data;
  },
};

export default cartAPI;
