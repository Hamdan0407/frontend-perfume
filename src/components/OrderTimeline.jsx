import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, XCircle, RotateCcw } from 'lucide-react';
import api from '../api/axios.js';

const OrderTimeline = ({ orderId, currentStatus }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTimeline();
  }, [orderId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`orders/${orderId}/timeline`);
      setTimeline(data);
    } catch (err) {
      setError('Failed to load order timeline');
      console.error('Timeline fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    const dayOptions = { weekday: 'short', day: 'numeric', month: 'short' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };

    return {
      fullDate: date.toLocaleDateString('en-IN', dayOptions),
      time: date.toLocaleTimeString('en-IN', timeOptions)
    };
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      PLACED: [
        'Your Order has been placed',
      ],
      CONFIRMED: [
        'Seller has confirmed your order',
        'Order is being prepared'
      ],
      PACKED: [
        'Your item has been packed',
        'Ready for pickup by delivery partner'
      ],
      HANDOVER: [
        'Your item has been picked up by delivery partner',
      ],
      SHIPPED: [
        'Your item has been shipped',
        'Package is in transit'
      ],
      OUT_FOR_DELIVERY: [
        'Your item is out for delivery',
        'Expected delivery today'
      ],
      DELIVERED: [
        'Your item has been delivered',
      ]
    };
    return descriptions[status] || ['Status updated'];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
      </div>
    );
  }

  // Handle cancelled/refunded orders
  if (currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED') {
    const cancelEvent = timeline.find(e => e.status === currentStatus);
    return (
      <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg border border-red-200">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            {currentStatus === 'CANCELLED' ? (
              <XCircle className="w-6 h-6 text-red-600" />
            ) : (
              <RotateCcw className="w-6 h-6 text-orange-600" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-700">
              Order {currentStatus === 'CANCELLED' ? 'Cancelled' : 'Refunded'}
            </h3>
            {cancelEvent && (
              <p className="text-sm text-gray-600">
                {formatDateTime(cancelEvent.timestamp).fullDate} - {formatDateTime(cancelEvent.timestamp).time}
              </p>
            )}
          </div>
        </div>
        {cancelEvent?.notes && (
          <p className="text-sm text-gray-700 bg-gray-50 rounded p-3 mt-3">
            {cancelEvent.notes}
          </p>
        )}
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No tracking information available</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg border">
      <div className="p-6 border-b">
        <h3 className="text-xl font-semibold text-gray-900">Order Tracking</h3>
      </div>

      <div className="p-6">
        <div className="relative">
          {timeline.map((event, index) => {
            const { fullDate, time } = formatDateTime(event.timestamp);
            const isLast = index === timeline.length - 1;
            const descriptions = getStatusDescription(event.status);

            return (
              <div key={event.id || index} className="relative pb-10">
                <div className="flex items-start gap-4">
                  {/* Timeline Line */}
                  {!isLast && (
                    <div className="absolute left-3 top-8 w-0.5 h-full bg-green-500" style={{ height: 'calc(100% - 2rem)' }} />
                  )}

                  {/* Icon */}
                  <div className="relative flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-grow pt-0">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-gray-900 text-base">
                        {event.status.replace('_', ' ').split(' ').map(word =>
                          word.charAt(0) + word.slice(1).toLowerCase()
                        ).join(' ')}
                      </h4>
                      <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                        {fullDate} - {time}
                      </span>
                    </div>

                    {/* Status descriptions */}
                    <div className="space-y-1 mt-2">
                      {descriptions.map((desc, idx) => (
                        <p key={idx} className="text-sm text-gray-700">
                          {desc}
                        </p>
                      ))}
                      {event.notes && (
                        <p className="text-sm text-gray-600 mt-2 italic">
                          {event.notes}
                        </p>
                      )}
                    </div>

                    {event.updatedBy && event.updatedBy !== 'SYSTEM' && (
                      <p className="text-xs text-gray-500 mt-2">
                        Updated by: {event.updatedBy}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderTimeline;