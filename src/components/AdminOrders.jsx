import { useState, useEffect } from 'react';
import { Clock, CheckCircle, X, Save, Eye, Edit, Truck, RefreshCw, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/axios';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', notes: '' });
  const [shiprocketLoading, setShiprocketLoading] = useState({}); // { orderId: 'creating' | 'refreshing' }

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('admin/orders?size=50');
      setOrders(response.data.content || response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'All'
    ? orders
    : orders.filter(o => {
      const status = o.status?.toUpperCase() || '';
      return status === filter.toUpperCase();
    });

  const getStatusIcon = (status) => {
    const statusUpper = status?.toUpperCase() || '';
    if (['PENDING', 'PROCESSING'].includes(statusUpper)) return <Clock size={16} />;
    if (['SHIPPED', 'DELIVERED'].includes(statusUpper)) return <CheckCircle size={16} />;
    if (statusUpper === 'CANCELLED') return <X size={16} />;
    return null;
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'PROCESSING': 'Processing',
      'PLACED': 'Placed',
      'CONFIRMED': 'Confirmed',
      'PACKED': 'Packed',
      'SHIPPED': 'Shipped',
      'DELIVERED': 'Delivered',
      'CANCELLED': 'Cancelled',
      'HANDOVER': 'Handover',
      'OUT_FOR_DELIVERY': 'Out for Delivery',
      'REFUNDED': 'Refunded'
    };
    return statusMap[status?.toUpperCase()] || status || 'Unknown';
  };

  const handleEditStatus = (order) => {
    setEditingOrder(order.id);
    setEditForm({
      status: order.status || 'PLACED',
      notes: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingOrder(null);
    setEditForm({ status: '', notes: '' });
  };

  const handleSaveStatus = async () => {
    if (!editForm.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      const response = await api.put(`admin/orders/${editingOrder}/status`, editForm);

      if (response.status === 200) {
        const updatedOrder = response.data;
        setOrders(orders.map(order =>
          order.id === editingOrder ? updatedOrder : order
        ));
        toast.success('Order status updated successfully');
        setEditingOrder(null);
        setEditForm({ status: '', notes: '' });
      } else {
        const error = await response.text();
        toast.error(`Failed to update status: ${error}`);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Failed to update order status');
    }
  };

  const handleCreateShipment = async (orderId) => {
    setShiprocketLoading(prev => ({ ...prev, [orderId]: 'creating' }));
    try {
      const response = await api.post(`admin/shiprocket/orders/${orderId}/create-shipment`);
      if (response.data?.status === 'success') {
        const awb = response.data?.data?.awbCode;
        toast.success(`Shipment created! AWB: ${awb || 'Generated'}`);
        // Update order in local state with tracking number
        setOrders(orders.map(o =>
          o.id === orderId ? { ...o, trackingNumber: awb, shipmentStatus: 'CREATED' } : o
        ));
      } else {
        toast.error(response.data?.message || 'Failed to create shipment');
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create shipment';
      toast.error(errMsg);
      console.error('Create shipment error:', error);
    } finally {
      setShiprocketLoading(prev => ({ ...prev, [orderId]: null }));
    }
  };

  const handleRefreshTracking = async (orderId) => {
    setShiprocketLoading(prev => ({ ...prev, [orderId]: 'refreshing' }));
    try {
      const response = await api.post(`admin/shiprocket/orders/${orderId}/refresh-tracking`);
      if (response.data?.status === 'success') {
        const shipmentStatus = response.data?.shipmentStatus || 'N/A';
        toast.success(`Tracking refreshed! Status: ${shipmentStatus}`);
        setOrders(orders.map(o =>
          o.id === orderId ? { ...o, shipmentStatus } : o
        ));
      } else {
        toast.error(response.data?.message || 'Failed to refresh tracking');
      }
    } catch (error) {
      const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to refresh tracking';
      toast.error(errMsg);
      console.error('Refresh tracking error:', error);
    } finally {
      setShiprocketLoading(prev => ({ ...prev, [orderId]: null }));
    }
  };

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>Orders Management</h2>
        <div className="order-filters">
          {['All', 'Pending', 'Processing', 'Shipped', 'Delivered'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="orders-table-wrapper">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
              <th>Shipping</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="loading">Loading...</td></tr>
            ) : filteredOrders.length === 0 ? (
              <tr><td colSpan="8" className="empty">No orders found</td></tr>
            ) : (
              filteredOrders.map(order => (
                <tr key={order.id}>
                  <td><strong>{order.orderNumber || `#ORD-${order.id}`}</strong></td>
                  <td>{order.user?.firstName} {order.user?.lastName || 'N/A'}</td>
                  <td>{order.items?.length || 0}</td>
                  <td className="amount">₹{order.totalAmount?.toFixed(2) || '0.00'}</td>
                  <td>
                    {editingOrder === order.id ? (
                      <div className="status-edit-container">
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="status-select"
                        >
                          <option value="PLACED">Placed</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PACKED">Packed</option>
                          <option value="SHIPPED">Shipped</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                          <option value="HANDOVER">Handover</option>
                          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                          <option value="REFUNDED">Refunded</option>
                        </select>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Add notes (optional)"
                          className="notes-textarea"
                          rows="2"
                        />
                      </div>
                    ) : (
                      <span className={`status-badge ${order.status?.toLowerCase()}`}>
                        {getStatusIcon(order.status)}
                        {getStatusDisplay(order.status)}
                      </span>
                    )}
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td>
                    {editingOrder === order.id ? (
                      <div className="edit-actions">
                        <button
                          className="btn-save"
                          onClick={handleSaveStatus}
                          title="Save Changes"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          className="btn-cancel"
                          onClick={handleCancelEdit}
                          title="Cancel Edit"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button className="btn-view" title="View Details">
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-edit"
                          onClick={() => handleEditStatus(order)}
                          title="Edit Status"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                  <td>
                    {/* Shiprocket Controls */}
                    {order.trackingNumber ? (
                      <div className="shiprocket-info">
                        <div className="awb-display" title="AWB Number">
                          <Package size={14} />
                          <span className="awb-code">{order.trackingNumber}</span>
                        </div>
                        {order.shipmentStatus && (
                          <div className="shipment-status-display">
                            <span className="shipment-status-text">{order.shipmentStatus}</span>
                          </div>
                        )}
                        <button
                          className="btn-refresh-tracking"
                          onClick={() => handleRefreshTracking(order.id)}
                          disabled={shiprocketLoading[order.id] === 'refreshing'}
                          title="Refresh Tracking"
                        >
                          <RefreshCw size={14} className={shiprocketLoading[order.id] === 'refreshing' ? 'spin' : ''} />
                          {shiprocketLoading[order.id] === 'refreshing' ? 'Refreshing...' : 'Refresh'}
                        </button>
                      </div>
                    ) : ['PACKED', 'HANDOVER', 'SHIPPED'].includes(order.status?.toUpperCase()) ? (
                      <button
                        className="btn-create-shipment"
                        onClick={() => handleCreateShipment(order.id)}
                        disabled={shiprocketLoading[order.id] === 'creating'}
                        title="Create Shiprocket Shipment"
                      >
                        <Truck size={14} />
                        {shiprocketLoading[order.id] === 'creating' ? 'Creating...' : 'Create Shipment'}
                      </button>
                    ) : (
                      <span className="no-shipment">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
