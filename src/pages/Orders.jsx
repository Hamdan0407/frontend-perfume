import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Package, ShoppingBag, Calendar, Truck, Eye } from 'lucide-react';
import api from '../api/axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { cn } from '../lib/utils';

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      // Use /orders/page endpoint with large page size to get all orders
      const { data } = await api.get('orders/page', {
        params: {
          page: 0,
          size: 1000
        }
      });
      // Extract content from paginated response
      setOrders(data.content || data);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const variants = {
      PLACED: 'default',
      CONFIRMED: 'secondary',
      PACKED: 'outline',
      SHIPPED: 'default',
      DELIVERED: 'default',
      CANCELLED: 'destructive',
      REFUNDED: 'outline',
    };
    return variants[status] || 'default';
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
      REFUNDED: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const filteredOrders = orders.filter(order =>
    filterStatus === 'ALL' || order.status === filterStatus
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Skeleton className="h-10 w-48 mb-8" />
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
          <p className="text-muted-foreground mt-1">View and track your orders</p>
        </div>
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-8 w-8 text-primary" />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['ALL', 'PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus(status)}
          >
            {status === 'ALL' ? 'All Orders' : status === 'OUT_FOR_DELIVERY' ? 'Out For Delivery' : status.replace('_', ' ')}
            {status === 'ALL' && ` (${orders.length})`}
          </Button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filterStatus === 'ALL' ? 'No orders yet' : `No ${filterStatus.toLowerCase()} orders`}
            </h3>
            <p className="text-muted-foreground mb-6">
              {filterStatus === 'ALL'
                ? 'Start shopping to place your first order!'
                : 'Try a different filter or start shopping'}
            </p>
            <Button asChild>
              <Link to="/products">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Browse Products
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Order Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between lg:justify-start gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Order #{order.orderNumber}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</span>
                        </div>
                      </div>
                      <Badge className={cn("lg:ml-4", getStatusBadgeClass(order.status))}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Order Items Preview */}
                    <div className="flex flex-wrap items-center gap-3">
                      {(order.items || order.orderItems || []).slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <img
                            src={item.product.imageUrl || 'https://via.placeholder.com/40'}
                            alt={item.product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                          <div className="text-xs">
                            <p className="font-medium truncate max-w-[100px]">{item.product.name}</p>
                            <p className="text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                      {(order.items || order.orderItems || []).length > 3 && (
                        <span className="text-sm text-muted-foreground">
                          +{(order.items || order.orderItems || []).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Total and Action */}
                  <div className="flex items-center justify-between lg:flex-col lg:items-end gap-4">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{order.totalAmount.toFixed(2)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
