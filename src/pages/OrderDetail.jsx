import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, MapPin, CreditCard, FileText, ArrowLeft, Download, ShoppingCart, Eye, Star } from 'lucide-react';
import api from '../api/axios';
import { useCartStore } from '../store/cartStore';
import OrderTimeline from '../components/OrderTimeline';
import RatingModal from '../components/RatingModal';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCartStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const fetchOrder = async () => {
    try {
      const { data } = await api.get(`orders/${id}`);
      setOrder(data);
    } catch (error) {
      toast.error('Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const response = await api.get(`orders/${id}/invoice`, {
        responseType: 'blob'
      });

      const contentType = response.headers['content-type'];
      if (!contentType || !contentType.includes('pdf')) {
        toast.error('Invoice not available');
        return;
      }

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${order.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Download invoice error:', error);
      toast.error('Could not download invoice');
    } finally {
      setDownloading(false);
    }
  };

  const handleReorder = async (product, quantity) => {
    try {
      await addToCart(product, quantity);
      toast.success('Product added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  const handleRateProduct = (product) => {
    setSelectedProduct(product);
    setRatingModalOpen(true);
  };

  const handleRatingSuccess = () => {
    // Optionally refresh order to show updated rating status
    fetchOrder();
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      PLACED: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      CONFIRMED: 'bg-blue-100 text-blue-800 border-blue-300',
      PACKED: 'bg-purple-100 text-purple-800 border-purple-300',
      HANDOVER: 'bg-orange-100 text-orange-800 border-orange-300',
      SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      DELIVERED: 'bg-green-100 text-green-800 border-green-300',
      CANCELLED: 'bg-red-100 text-red-800 border-red-300',
      EXCHANGED: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order not found</h3>
            <p className="text-muted-foreground mb-6">This order doesn't exist or you don't have access to it.</p>
            <Button asChild>
              <Link to="/orders">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Orders
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button variant="ghost" onClick={() => navigate('/orders')} className="mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <h1 className="text-3xl font-bold text-foreground">Order #{order.orderNumber}</h1>
          <p className="text-muted-foreground mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
        <Badge className={cn("text-sm px-4 py-2", getStatusBadgeClass(order.status))}>
          {order.status.replace('_', ' ')}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div key={item.id}>
                    <div className="flex items-center gap-4">
                      <Link to={`/products/${item.product.id}`}>
                        <img
                          src={item.product.imageUrl || 'https://via.placeholder.com/80'}
                          alt={item.product.name}
                          className="w-20 h-20 object-cover rounded hover:opacity-75 transition-opacity"
                        />
                      </Link>
                      <div className="flex-1">
                        <Link
                          to={`/products/${item.product.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {item.product.name}
                        </Link>
                        <p className="text-sm text-muted-foreground mt-1">
                          ₹{item.price.toFixed(2)} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">₹{item.subtotal.toFixed(2)}</p>
                        {/* Reorder button removed as requested */}
                        {['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(order.status) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRateProduct(item.product)}
                            className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            Rate Product
                          </Button>
                        )}
                      </div>
                    </div>
                    {index < order.items.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <OrderTimeline orderId={id} currentStatus={order.status} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>₹{order.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>₹{order.shippingCost.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-primary">₹{order.totalAmount.toFixed(2)}</span>
              </div>
              {order.status !== 'CANCELLED' && (
                <div className="space-y-2 mt-4">
                  <Button
                    className="w-full"
                    onClick={() => navigate(`/invoice/${order.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Invoice
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleDownloadInvoice}
                    disabled={downloading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {downloading ? 'Downloading...' : 'Download PDF'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p className="font-medium">{order.shippingName || 'N/A'}</p>
              <p className="text-muted-foreground">{order.shippingAddress}</p>
              <p className="text-muted-foreground">
                {order.shippingCity}, {order.shippingState} {order.shippingZipCode}
              </p>
              <p className="text-muted-foreground">{order.shippingCountry}</p>
              {order.shippingPhone && (
                <p className="text-muted-foreground mt-2">Phone: {order.shippingPhone}</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Info */}
          {order.paymentMethod && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Method
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <p className="font-medium">{order.paymentMethod}</p>
                {order.paymentStatus && (
                  <Badge variant="outline" className="mt-2">
                    {order.paymentStatus}
                  </Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => setRatingModalOpen(false)}
        product={selectedProduct}
        orderId={order?.id}
        onSuccess={handleRatingSuccess}
      />
    </div>
  );
}
