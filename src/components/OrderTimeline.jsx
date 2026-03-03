import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, Clock, XCircle, Package, Truck, Navigation, MapPin, Home, AlertCircle } from 'lucide-react';
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
      setError(null);
      const { data } = await api.get(`orders/${orderId}/tracking`);
      setTrackingData(data);
    } catch (err) {
      setError('tracking_unavailable');
      console.error('Tracking fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return { fullDate: '', time: '' };
    const date = new Date(dateTimeString);
    return {
      fullDate: date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  };

  const getMilestoneIcon = (label) => {
    const iconMap = {
      'Order Created': Package,
      'Packed': Package,
      'Picked Up': Navigation,
      'In Transit': Truck,
      'Out for Delivery': MapPin,
      'Delivered': Home,
    };
    const Icon = iconMap[label] || Circle;
    return <Icon className="w-4 h-4 sm:w-5 sm:h-5" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-8">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-3 text-muted-foreground text-sm">Loading tracking info...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error === 'tracking_unavailable') {
    return (
      <div className="bg-white rounded-xl border shadow-sm p-6">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-medium">Tracking temporarily unavailable</p>
            <p className="text-sm text-muted-foreground mt-1">Please check back later for tracking updates.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData) return null;

  const { milestones, history, shipmentStatus, trackingNumber } = trackingData;

  // Cancelled/Refunded state
  if (currentStatus === 'CANCELLED' || currentStatus === 'REFUNDED') {
    const cancelEvent = history?.find(e => e.status === currentStatus);
    return (
      <div className="bg-white rounded-xl border border-red-200 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-700">
              Order {currentStatus === 'CANCELLED' ? 'Cancelled' : 'Refunded'}
            </h3>
            {cancelEvent && (
              <p className="text-sm text-gray-600">
                {formatDateTime(cancelEvent.timestamp).fullDate} at {formatDateTime(cancelEvent.timestamp).time}
              </p>
            )}
          </div>
        </div>
        {cancelEvent?.notes && (
          <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{cancelEvent.notes}</p>
        )}
      </div>
    );
  }

  // No AWB yet — Shipment not dispatched
  if (!trackingNumber) {
    return (
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b">
          <h3 className="font-bold text-slate-900 text-lg">Delivery Status</h3>
        </div>
        <div className="p-6">
          {/* Vertical stepper for pre-dispatch statuses */}
          <div className="relative pl-10 space-y-6">
            {milestones?.slice(0, 2).map((m, i) => (
              <div key={i} className="relative">
                <div className={cn(
                  "absolute -left-10 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10",
                  m.completed ? "bg-green-500 border-green-500 text-white" :
                    m.current ? "bg-white border-blue-500 text-blue-500 animate-pulse" :
                      "bg-white border-slate-200 text-slate-300"
                )}>
                  {m.completed ? <CheckCircle className="w-4 h-4" /> : getMilestoneIcon(m.label)}
                </div>
                {i < 1 && (
                  <div className={cn(
                    "absolute -left-6 top-8 w-0.5 h-6",
                    m.completed ? "bg-green-400" : "bg-slate-200"
                  )} />
                )}
                <div>
                  <p className={cn(
                    "font-semibold text-sm",
                    m.completed ? "text-green-700" : m.current ? "text-blue-700" : "text-slate-400"
                  )}>{m.label}</p>
                  {m.date && <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(m.date).fullDate}</p>}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
            <Package className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Shipment not yet dispatched</p>
              <p className="text-xs text-amber-700 mt-1">Your order is being prepared. Tracking will be available once it's shipped.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full tracking timeline with all milestones
  const completedCount = milestones.filter(m => m.completed).length;
  const progressPercent = Math.max(0, ((completedCount - 1) / (milestones.length - 1)) * 100);

  return (
    <div className="space-y-6">
      {/* Visual Progress Bar */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-slate-900 text-lg">Delivery Status</h3>
          <div className="text-sm flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border shadow-sm">
            <span className="text-muted-foreground">AWB:</span>
            <span className="font-mono font-bold text-primary select-all">{trackingNumber}</span>
          </div>
        </div>

        {/* Desktop: Horizontal stepper */}
        <div className="hidden sm:block px-6 pt-10 pb-10">
          <div className="relative">
            {/* Background track */}
            <div className="absolute top-5 left-[8%] right-[8%] h-1 bg-slate-100 rounded-full" />
            {/* Filled track */}
            <div
              className="absolute top-5 left-[8%] h-1 bg-green-500 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercent * 0.84}%` }}
            />

            <div className="flex justify-between items-start relative">
              {milestones.map((m, i) => (
                <div key={i} className="flex flex-col items-center text-center" style={{ width: `${100 / milestones.length}%` }}>
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all border-2 shadow-sm relative z-10",
                    m.completed ? "bg-green-500 border-green-500 text-white" :
                      m.current ? "bg-white border-blue-500 text-blue-500 animate-pulse scale-110" :
                        "bg-white border-slate-200 text-slate-300"
                  )}>
                    {m.completed ? <CheckCircle className="w-5 h-5" /> : getMilestoneIcon(m.label)}
                  </div>
                  <span className={cn(
                    "text-[10px] md:text-xs font-bold uppercase tracking-wider leading-tight",
                    m.completed ? "text-green-600" : m.current ? "text-blue-600" : "text-slate-400"
                  )}>
                    {m.label}
                  </span>
                  {m.date && (
                    <span className="text-[9px] text-muted-foreground mt-1">{formatDateTime(m.date).fullDate}</span>
                  )}
                  {m.location && (
                    <span className="text-[9px] text-blue-500 mt-0.5">{m.location}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Current Shiprocket status label */}
          {shipmentStatus && (
            <div className="mt-6 text-center">
              <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                <Truck className="w-4 h-4" />
                {shipmentStatus}
              </span>
            </div>
          )}
        </div>

        {/* Mobile: Vertical stepper */}
        <div className="sm:hidden p-6">
          <div className="relative pl-10 space-y-6">
            {milestones.map((m, i) => (
              <div key={i} className="relative">
                <div className={cn(
                  "absolute -left-10 top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 z-10",
                  m.completed ? "bg-green-500 border-green-500 text-white" :
                    m.current ? "bg-white border-blue-500 text-blue-500 animate-pulse" :
                      "bg-white border-slate-200 text-slate-300"
                )}>
                  {m.completed ? <CheckCircle className="w-4 h-4" /> : getMilestoneIcon(m.label)}
                </div>
                {i < milestones.length - 1 && (
                  <div className={cn(
                    "absolute -left-6 top-8 w-0.5 h-full",
                    m.completed ? "bg-green-400" : "bg-slate-200"
                  )} />
                )}
                <div>
                  <p className={cn(
                    "font-semibold text-sm",
                    m.completed ? "text-green-700" : m.current ? "text-blue-700" : "text-slate-400"
                  )}>{m.label}</p>
                  {m.date && <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(m.date).fullDate}</p>}
                  {m.location && <p className="text-xs text-blue-500 mt-0.5">{m.location}</p>}
                </div>
              </div>
            ))}
          </div>

          {shipmentStatus && (
            <div className="mt-6 flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg text-sm font-medium">
              <Truck className="w-4 h-4 flex-shrink-0" />
              {shipmentStatus}
            </div>
          )}
        </div>
      </div>

      {/* Activity History */}
      {history && history.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b">
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Activity History
            </h3>
          </div>
          <div className="p-6">
            <div className="relative pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-0.5 before:bg-slate-100">
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                        <h4 className={cn(
                          "font-bold text-sm capitalize",
                          index === 0 ? "text-primary" : "text-slate-700"
                        )}>
                          {event.status.replace(/_/g, ' ').toLowerCase()}
                        </h4>
                        <span className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border whitespace-nowrap">
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
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTimeline;
