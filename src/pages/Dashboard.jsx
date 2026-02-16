import { useState, useEffect } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, DollarSign, ShoppingCart, Package, 
  Calendar, Award, ArrowUp, ArrowDown, RefreshCw 
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [dailySales, setDailySales] = useState([]);
  const [monthlySales, setMonthlySales] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const handleRefresh = async () => {
    const firstConfirm = window.confirm(
      '⚠️ FIRST CONFIRMATION\n\nAre you sure you want to DELETE ALL ORDERS from the database?\n\n🔴 THIS WILL PERMANENTLY DELETE:\n• All order records\n• All order history\n• All revenue data\n\n❌ THIS CANNOT BE UNDONE!'
    );
    
    if (!firstConfirm) return;
    
    const secondConfirm = window.confirm(
      '⚠️ FINAL WARNING\n\nYou are about to PERMANENTLY DELETE all orders from the database!\n\nType carefully and click OK ONLY if you are absolutely sure.\n\n🚨 THIS ACTION IS IRREVERSIBLE!'
    );
    
    if (!secondConfirm) return;
    
    setRefreshing(true);
    
    try {
      // Call backend to delete all orders from database
      await api.delete('/admin/analytics/reset');
      
      // Clear frontend data
      setStats({
        totalRevenue: 0,
        totalOrders: 0,
        totalProducts: 0,
        totalUsers: 0
      });
      setDailySales([]);
      setMonthlySales([]);
      setTopProducts([]);
      
      setLastRefreshed(new Date());
      setRefreshCount(prev => prev + 1);
      
      toast.success(`✓ All orders deleted from database! (Reset #${refreshCount + 1})`);
    } catch (error) {
      console.error('Reset failed:', error);
      toast.error('✗ Failed to reset data: ' + (error.response?.data?.error || error.message));
    } finally {
      setRefreshing(false);
    }
  };

  const fetchDashboardData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      // Add cache-busting parameter when forcing refresh
      const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
      
      if (forceRefresh) {
        console.log('🚀 Fetching with cache-buster:', cacheBuster);
      }
      
      // Fetch stats first
      const statsRes = await api.get(`/admin/stats?refresh=true${cacheBuster}`);
      console.log('📈 Stats fetched:', statsRes.data);
      setStats(statsRes.data);

      // Try to fetch analytics data
      try {
        const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : '';
        const [dailyRes, monthlyRes, topProductsRes] = await Promise.all([
          api.get(`/admin/analytics/daily-sales?days=${timeRange}${cacheBuster}`),
          api.get(`/admin/analytics/monthly-sales?months=12${cacheBuster}`),
          api.get(`/admin/analytics/top-products?limit=5&days=${timeRange}${cacheBuster}`)
        ]);

        console.log('📊 Daily sales:', dailyRes.data);
        console.log('📊 Monthly sales:', monthlyRes.data);
        console.log('📊 Top products:', topProductsRes.data);
        
        setDailySales(dailyRes.data || []);
        setMonthlySales(monthlyRes.data || []);
        setTopProducts(topProductsRes.data || []);
      } catch (analyticsError) {
        console.log('Analytics data not available:', analyticsError);
        // Set empty arrays so UI doesn't break
        setDailySales([]);
        setMonthlySales([]);
        setTopProducts([]);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, trend, trendValue }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                {trend === 'up' ? (
                  <ArrowUp className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDown className="h-4 w-4 text-red-600" />
                )}
                <span className={trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                  {trendValue}%
                </span>
                <span className="text-muted-foreground">vs last period</span>
              </div>
            )}
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.name.includes('Revenue') ? '₹' : ''}{entry.value.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-lg" />
          <Skeleton className="h-96 rounded-lg" />
        </div>
      </div>
    );
  }

  // Calculate totals from analytics data or use stats as fallback
  const totalRevenue = dailySales.length > 0 
    ? dailySales.reduce((sum, day) => sum + parseFloat(day.revenue || 0), 0)
    : (stats?.totalRevenue || 0);
  const totalOrders = dailySales.length > 0
    ? dailySales.reduce((sum, day) => sum + (day.orderCount || 0), 0) 
    : (stats?.totalOrders || 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
            <div className="flex items-center gap-3">
              <p className="text-muted-foreground">
                Track your store's performance and sales metrics
              </p>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-green-700 dark:text-green-400">
                  Last updated: {lastRefreshed.toLocaleTimeString('en-IN')}
                </span>
                {refreshCount > 0 && (
                  <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-bold">
                    #{refreshCount}
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            title="DANGER: Delete ALL orders from database (requires double confirmation)"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Deleting...' : 'Delete All Orders'}
          </button>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-sm font-medium text-muted-foreground">Time Range:</span>
          {['7', '30', '90'].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === days
                  ? 'bg-primary text-white'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={`₹${totalRevenue.toFixed(2)}`}
            subtitle={`Last ${timeRange} days`}
            icon={DollarSign}
          />
          <StatCard
            title="Total Orders"
            value={totalOrders.toLocaleString()}
            subtitle={`Last ${timeRange} days`}
            icon={ShoppingCart}
          />
          <StatCard
            title="Active Products"
            value={stats?.totalProducts || 0}
            subtitle="Currently available"
            icon={Package}
          />
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            subtitle="Registered accounts"
            icon={TrendingUp}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Daily Sales Chart */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Daily Sales</h3>
                  <p className="text-sm text-muted-foreground">Orders per day</p>
                </div>
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="orderCount" 
                    name="Orders"
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Revenue Trend</h3>
                  <p className="text-sm text-muted-foreground">Daily revenue (₹)</p>
                </div>
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar 
                    dataKey="revenue" 
                    name="Revenue (₹)"
                    fill="#10b981" 
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Revenue Chart */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Monthly Performance</h3>
                <p className="text-sm text-muted-foreground">Revenue and orders by month</p>
              </div>
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="revenue" 
                  name="Revenue (₹)"
                  fill="#3b82f6" 
                  radius={[8, 8, 0, 0]}
                />
                <Bar 
                  yAxisId="right"
                  dataKey="orderCount" 
                  name="Orders"
                  fill="#f59e0b" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Top Selling Products</h3>
                <p className="text-sm text-muted-foreground">Best performers in the last {timeRange} days</p>
              </div>
              <Award className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <Link 
                  key={product.id} 
                  to={`/products/${product.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <img 
                    src={product.imageUrl || 'https://via.placeholder.com/80'} 
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{product.name}</h4>
                    <p className="text-sm text-muted-foreground">{product.brand}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-muted-foreground">
                      {product.salesCount} sold
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      ₹{parseFloat(product.revenue).toFixed(2)}
                    </p>
                  </div>
                  <Badge 
                    variant={product.stock < 10 ? 'destructive' : 'secondary'}
                    className="ml-2"
                  >
                    {product.stock} in stock
                  </Badge>
                </Link>
              ))}
              {topProducts.length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No sales data available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Inventory Alerts */}
        {(stats?.lowStockProducts?.length > 0 || stats?.outOfStockProducts?.length > 0) && (
          <Card className="mt-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Inventory Alerts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.lowStockProducts?.length > 0 && (
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <h4 className="font-medium text-orange-700 mb-2">Low Stock ({stats.lowStockCount})</h4>
                    <div className="space-y-2">
                      {stats.lowStockProducts.slice(0, 3).map((product) => (
                        <div key={product.id} className="text-sm">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-orange-600 ml-2">({product.stock} left)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {stats.outOfStockProducts?.length > 0 && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-700 mb-2">Out of Stock ({stats.outOfStockCount})</h4>
                    <div className="space-y-2">
                      {stats.outOfStockProducts.slice(0, 3).map((product) => (
                        <div key={product.id} className="text-sm">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-red-600 ml-2">(0 left)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
