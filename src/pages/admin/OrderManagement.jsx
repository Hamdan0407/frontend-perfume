import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchOrders();
  }, [page]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('admin/orders', {
        params: { page, size: 10 },
      });
      setOrders(response.data.content);
      setTotalPages(response.data.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (orderId) => {
    try {
      const response = await api.get(`admin/orders/${orderId}`);
      setSelectedOrder(response.data);
      setShowDetail(true);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError('Failed to load order details');
    }
  };

  const handleUpdateStatus = async (orderId, status) => {
    try {
      setUpdatingStatus(orderId);
      await api.patch(`admin/orders/${orderId}/status`, { status });

      // Update the order in detail view
      if (selectedOrder && selectedOrder.id === orderId) {
        const response = await api.get(`admin/orders/${orderId}`);
        setSelectedOrder(response.data);
      }

      // Refresh orders list
      fetchOrders();
      setUpdatingStatus(null);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError('Failed to update order status');
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PLACED: 'bg-yellow-100 text-yellow-700',
      CONFIRMED: 'bg-blue-100 text-blue-700',
      PACKED: 'bg-purple-100 text-purple-700',
      SHIPPED: 'bg-indigo-100 text-indigo-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
      REFUNDED: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const statusOptions = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

  if (loading && orders.length === 0) {
    return <div className="text-center py-8">Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">📋 Order Management</h2>
        <p className="text-gray-500 mt-1">View and manage customer orders</p>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Date
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{order.orderNumber}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  <div>{order.userName}</div>
                  <div className="text-xs text-gray-500">{order.userEmail}</div>
                </td>
                <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                  ₹{order.totalAmount}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleViewDetails(order.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Page {page + 1} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">Order #{selectedOrder.orderNumber}</h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedOrder.userName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedOrder.userEmail}</p>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Order Details</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-semibold text-lg">₹{selectedOrder.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Date</p>
                    <p className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Shipping Address</p>
                    <p className="font-medium">{selectedOrder.shippingAddress}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Tracking Number</p>
                    <p className="font-medium">{selectedOrder.trackingNumber || 'Not assigned'}</p>
                  </div>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Update Status</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Current Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Change to</p>
                    <div className="space-y-2">
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(selectedOrder.id, status)}
                          disabled={updatingStatus === selectedOrder.id || status === selectedOrder.status}
                          className={`w-full px-4 py-2 rounded-lg font-medium transition ${status === selectedOrder.status
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                          {updatingStatus === selectedOrder.id ? 'Updating...' : `Change to ${status}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-2">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
