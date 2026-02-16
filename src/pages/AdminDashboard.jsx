import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, BarChart3, Package, ShoppingCart, Users, Settings } from 'lucide-react';
import '../styles/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tokenExpiresAt');
    navigate('/login');
  };

  return (
    <div className="admin-container">
      {/* Simple Sidebar */}
      <aside className="admin-sidebar open">
        <div className="sidebar-header">
          <div className="logo">
            <BarChart3 size={28} />
            <span>PerfumeAdmin</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={20} />
            <span>Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={20} />
            <span>Products</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <ShoppingCart size={20} />
            <span>Orders</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={20} />
            <span>Users</span>
          </button>
          <button
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button
            className="nav-item logout"
            onClick={handleLogout}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
        </div>

        <div className="admin-content">
          {activeTab === 'dashboard' && (
            <div className="dashboard-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-label">Total Users</div>
                  <div className="stat-value">142</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📦</div>
                <div className="stat-info">
                  <div className="stat-label">Total Products</div>
                  <div className="stat-value">17</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🛒</div>
                <div className="stat-info">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-value">89</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-value">₹45,670</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="section">
              <h2>Products Management</h2>
              <p>Product management features coming soon...</p>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="section">
              <h2>Orders</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Status</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>ORD-001</td>
                    <td>John Doe</td>
                    <td><span className="badge delivered">Delivered</span></td>
                    <td>₹2,999.99</td>
                  </tr>
                  <tr>
                    <td>ORD-002</td>
                    <td>Jane Smith</td>
                    <td><span className="badge processing">Processing</span></td>
                    <td>₹1,890.50</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="section">
              <h2>Users</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>john@example.com</td>
                    <td>John Doe</td>
                    <td><span className="badge active">Active</span></td>
                  </tr>
                  <tr>
                    <td>jane@example.com</td>
                    <td>Jane Smith</td>
                    <td><span className="badge active">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="section">
              <h2>Settings</h2>
              <p>Settings page coming soon...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
