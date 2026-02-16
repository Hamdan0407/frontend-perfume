import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Shield } from 'lucide-react';
import api from '../../api/axios';
import Overview from './Overview';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';
import UserManagement from './UserManagement';
import { Card } from '../../components/ui/card';
import { LoadingSpinner } from '../../components/ui/spinner';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { cn } from '../../lib/utils';

export default function Dashboard() {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await api.get('/admin/profile');
        setAdminProfile(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        setError('Failed to load admin profile');
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <LoadingSpinner text="Loading admin dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const navItems = [
    { name: 'Overview', path: '', icon: LayoutDashboard },
    { name: 'Products', path: 'products', icon: Package },
    { name: 'Orders', path: 'orders', icon: ShoppingCart },
    { name: 'Users', path: 'users', icon: Users },
  ];

  const isActive = (path) => {
    const currentPath = location.pathname.split('/admin')[1] || '';
    const currentRoute = currentPath.replace(/^\//, '');
    return currentRoute.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-accent" />
              <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            </div>
            {adminProfile && (
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Welcome back</p>
                <p className="font-semibold text-foreground">
                  {adminProfile.firstName} {adminProfile.lastName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <nav className="w-56 flex-shrink-0">
            <Card>
              <div className="p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Management
                </h3>
                <ul className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.path}>
                        <Link
                          to={`/admin${item.path ? '/' + item.path : ''}`}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm",
                            isActive(item.path)
                              ? 'bg-primary text-primary-foreground font-medium'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          </nav>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <Routes>
              <Route path="" element={<Overview />} />
              <Route path="products/*" element={<ProductManagement />} />
              <Route path="orders/*" element={<OrderManagement />} />
              <Route path="users/*" element={<UserManagement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}
