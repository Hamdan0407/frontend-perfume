import React, { useState, useEffect } from 'react';
import { Mail, Shield, Eye, EyeOff } from 'lucide-react';
import '../styles/AdminUsers.css';
import { toast } from 'react-toastify';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    // Demo mode: Use mock users data
    setUsers([
      {
        id: 1,
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'CUSTOMER',
        active: true,
        joinDate: '2024-01-01'
      },
      {
        id: 2,
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'CUSTOMER',
        active: true,
        joinDate: '2024-01-05'
      }
    ]);
    setLoading(false);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/admin/users?size=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.content || []);
      } else {
        // Gracefully handle auth errors
        console.warn('Failed to load admin users, showing empty list');
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId, currentStatus) => {
    try {
      const action = currentStatus ? 'block' : 'unblock';
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchUsers();
        toast.success(`User ${action}ed successfully`);
      } else {
        toast.error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Failed to update user status');
    }
  };

  const filteredUsers = filter === 'All' 
    ? users 
    : users.filter(u => {
        if (filter === 'Active') return u.active;
        if (filter === 'Blocked') return !u.active;
        return u.role === filter;
      });

  if (loading) {
    return <div className="users-container"><p>Loading users...</p></div>;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Users Management</h2>
        <div className="user-filters">
          {['All', 'Active', 'Blocked'].map(role => (
            <button
              key={role}
              className={`filter-btn ${filter === role ? 'active' : ''}`}
              onClick={() => setFilter(role)}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className="users-grid">
        {filteredUsers.length === 0 ? (
          <p>No users found</p>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className={`user-card ${!user.active ? 'blocked' : ''}`}>
              <div className="user-card-header">
                <div className="user-avatar">{user.firstName?.charAt(0) || 'U'}</div>
                <span className={`role-badge ${user.role?.toLowerCase()}`}>{user.role}</span>
              </div>
              
              <div className="user-card-content">
                <h3>{user.firstName} {user.lastName}</h3>
                
                <div className="user-detail">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                
                <div className="user-detail">
                  <Shield size={14} />
                  <span>Status: <strong>{user.active ? 'Active' : 'Blocked'}</strong></span>
                </div>

                <div className="user-stats">
                  <div className="stat">
                    <span className="label">Joined</span>
                    <span className="value">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="user-card-actions">
                  <button 
                    className={`btn-action ${user.active ? 'block' : 'unblock'}`}
                    onClick={() => handleBlockUser(user.id, user.active)}
                  >
                    {user.active ? 'Block User' : 'Unblock User'}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
