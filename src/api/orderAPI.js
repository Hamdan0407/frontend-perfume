import api from './axios';

/**
 * Order API Service
 * 
 * Handles all order operations:
 * - Create order (checkout)
 * - Get user's orders
 * - Get order details
 * - Cancel order
 * - Get order status
 * 
 * All operations require authentication
 */

const orderAPI = {
  /**
   * Create new order from cart
   * Requires: Authentication
   * @param {Object} checkoutData - Checkout information
   * @param {string} checkoutData.shippingAddress - Delivery address
   * @param {string} checkoutData.billingAddress - Billing address
   * @param {string} checkoutData.paymentMethod - Payment method (card, paypal, etc.)
   * @param {string} checkoutData.phone - Contact phone number
   * @returns {Promise} - Created order with ID and status
   * 
   * Response:
   * {
   *   id, orderNumber, userId, status, items: [...],
   *   subtotal, tax, shippingCost, total,
   *   shippingAddress, billingAddress,
   *   estimatedDelivery, createdAt
   * }
   * 
   * Errors:
   * - 400: Invalid checkout data or cart is empty
   * - 401: Not authenticated
   * - 409: Some items out of stock
   */
  createOrder: async (checkoutData) => {
    const response = await api.post('/orders', checkoutData);
    return response.data.data;
  },

  /**
   * Get all user's orders with pagination
   * Requires: Authentication
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10)
   * @param {string} params.status - Filter by status (pending, shipped, delivered, cancelled)
   * @param {string} params.sortBy - Sort field (createdAt, updatedAt, total)
   * @returns {Promise} - Orders list with pagination
   * 
   * Response:
   * {
   *   data: [{ id, orderNumber, status, total, createdAt, items }],
   *   pagination: { total, page, limit, pages }
   * }
   * 
   * Errors:
   * - 401: Not authenticated
   */
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { params });
    return response.data.data;
  },

  /**
   * Get detailed order information
   * Requires: Authentication
   * @param {number} orderId - Order ID
   * @returns {Promise} - Complete order details
   * 
   * Response:
   * {
   *   id, orderNumber, userId, status, paymentStatus,
   *   items: [{ id, product, quantity, price }],
   *   subtotal, tax, shippingCost, total,
   *   shippingAddress, billingAddress,
   *   trackingNumber, estimatedDelivery,
   *   timeline: [{ status, date, note }],
   *   createdAt, updatedAt
   * }
   * 
   * Errors:
   * - 404: Order not found
   * - 401: Not authenticated
   * - 403: User doesn't have permission to view this order
   */
  getOrderById: async (orderId) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data.data;
  },

  /**
   * Cancel an order (only if status is pending)
   * Requires: Authentication
   * @param {number} orderId - Order ID
   * @param {string} reason - Cancellation reason (optional)
   * @returns {Promise} - Updated order with cancelled status
   * 
   * Errors:
   * - 404: Order not found
   * - 400: Order cannot be cancelled (already shipped/delivered)
   * - 401: Not authenticated
   * - 403: User doesn't have permission
   */
  cancelOrder: async (orderId, reason = '') => {
    const response = await api.post(`/orders/${orderId}/cancel`, { reason });
    return response.data.data;
  },

  /**
   * Get order status and tracking information
   * Requires: Authentication
   * @param {number} orderId - Order ID
   * @returns {Promise} - Status and tracking details
   * 
   * Response:
   * {
   *   orderId, orderNumber, status, paymentStatus,
   *   trackingNumber, carrier, estimatedDelivery,
   *   timeline: [
   *     { status, timestamp, location, note }
   *   ]
   * }
   * 
   * Errors:
   * - 404: Order not found
   * - 401: Not authenticated
   */
  getOrderStatus: async (orderId) => {
    const response = await api.get(`/orders/${orderId}/status`);
    return response.data.data;
  },

  /**
   * Get order tracking information
   * @param {string} trackingNumber - Tracking number from carrier
   * @returns {Promise} - Real-time tracking updates
   * 
   * Response:
   * {
   *   trackingNumber, carrier, status, currentLocation,
   *   updates: [
   *     { timestamp, status, location, details }
   *   ]
   * }
   * 
   * Note: Public endpoint, does not require authentication
   */
  trackOrder: async (trackingNumber) => {
    const response = await api.get(`/orders/track/${trackingNumber}`);
    return response.data.data;
  },
};

export default orderAPI;
