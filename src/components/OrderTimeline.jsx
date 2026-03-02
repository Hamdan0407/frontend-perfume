import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, XCircle, RotateCcw, Package, Truck, MapPin, Home } from 'lucide-react';
import api from '../api/axios.js';
import { cn } from '../lib/utils';

const OrderTimeline = ({ orderId, currentStatus }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTracking();
  }, [orderId]);

  const fetchTracking = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`orders/${orderId}/tracking`);
      setTrackingData(data);
    } catch (err) {
      setError('Failed to load order tracking');
      console.error('Tracking fetch error:', err);
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

  const getMilestoneIcon = (label) => {
    switch (label) {
      case 'Order Created': return <Package className="w-5 h-5" />;
      case 'In Transit': return <Truck className="w-5 h-5" />;
      case 'Reached Hub': return <MapPin className="w-5 h-5" />;
      case 'Out for Delivery': return <Truck className="w-5 h-5" />;
      case 'Delivered': return <Home className="w-5 h-5" />;
      default: return <Circle className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 bg-white rounded-lg border">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !trackingData) {
    return (
      <div className="text-center py-8 text-red-600 bg-white rounded-lg border">
        <p>{error || 'No tracking information available'}</p>
      </div>
    );
  }

  const { milestones, history, shipmentStatus, trackingNumber } = trackingData;

  // Handle cancelled/refunded orders
  if (currentStatus === 'CANCELLED' || currentStatus === 'EXCHANGED') {
    const cancelEvent = history.find(e => e.status === currentStatus);
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
              Order {currentStatus === 'CANCELLED' ? 'Cancelled' : 'Exchanged'}
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Visual Progress Bar */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-50 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg">Delivery Status</CardTitle>
            {trackingNumber && (
              <div className="text-sm flex items-center gap-2 bg-white px-3 py-1 rounded-full border shadow-sm">
                <span className="text-muted-foreground">AWB:</span>
                <span className="font-mono font-bold text-primary">{trackingNumber}</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-10 pb-12 px-4 md:px-8">
          <div className="relative">
            {/* Connection Lines */}
            <div className="absolute top-5 left-0 w-full h-1 bg-slate-100 -z-10 rounded-full" />
            <div
              className="absolute top-5 left-0 h-1 bg-green-500 -z-10 transition-all duration-1000 rounded-full"
              style={{
                width: `${(milestones.filter(m => m.completed).length - 1) * 25}%`
              }}
            />

            <div className="flex justify-between items-start">
              {milestones.map((m, i) => (
                <div key={i} className="flex flex-col items-center w-1/5 text-center px-1">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all border-2 shadow-sm",
                    m.completed ? "bg-green-500 border-green-500 text-white" :
                      m.current ? "bg-white border-blue-500 text-blue-500 animate-pulse scale-110" :
                        "bg-white border-slate-200 text-slate-300"
                  )}>
                    {m.completed ? <CheckCircle className="w-5 h-5" /> : getMilestoneIcon(m.label)}
                  </div>
                  <span className={cn(
                    "text-[10px] md:text-xs font-bold uppercase tracking-wider",
                    m.completed ? "text-green-600" : m.current ? "text-blue-600" : "text-slate-400"
                  )}>
                    {m.label}
                  </span>
                  {m.current && shipmentStatus && (
                    <span className="mt-1 text-[9px] text-blue-500 font-medium italic animate-bounce">
                      {shipmentStatus}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Detailed Tracking History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
            {[...history].reverse().map((event, index) => {
              const { fullDate, time } = formatDateTime(event.timestamp);
              return (
                <div key={index} className="relative">
                  <div className={cn(
                    "absolute -left-8 top-1.5 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10",
                    index === 0 ? "bg-primary" : "bg-slate-300"
                  )}>
                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                  </div>
                  <div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1">
                      <h4 className={cn("font-bold text-base capitalize", index === 0 ? "text-primary" : "text-slate-700")}>
                        {event.status.replace('_', ' ').toLowerCase()}
                      </h4>
                      <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border">
                        {fullDate} at {time}
                      </span>
                    </div>
                    {event.notes && (
                      <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100 mt-2">
                        {event.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper components for layout consistency
const Card = ({ children, className }) => (
  <div className={cn("bg-white rounded-xl border shadow-sm", className)}>{children}</div>
);

const CardHeader = ({ children, className }) => (
  <div className={cn("px-6 py-4", className)}>{children}</div>
);

const CardTitle = ({ children, className }) => (
  <h3 className={cn("font-bold text-slate-900", className)}>{children}</h3>
);

const CardContent = ({ children, className }) => (
  <div className={cn("px-6 py-4", className)}>{children}</div>
);

export default OrderTimeline;
