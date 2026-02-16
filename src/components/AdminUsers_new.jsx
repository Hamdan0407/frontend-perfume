import React, { useState, useEffect } from 'react';
import { Mail, Shield, LogOut, Lock, Unlock } from 'lucide-react';
import { toast } from 'react-toastify';
import '../styles/AdminUsers.css';

const POSITION_LABELS = {
  ADMIN: '👔 Manager/Owner',
  USER: '📦 Warehouse Worker',
  CUSTOMER: '👥 Customer'
};

const POSITION_COLORS = {
  ADMIN: 'admin',
  USER: 'warehouse',
  CUSTOMER: 'customer'
};

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    fetchUsers();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8080/api/admin/users?size=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data.content || []);
      } else {
        toast.error('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error loading users');
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
    : filter === 'Active' 
      ? users.filter(u => u.active)
      : filter === 'Blocked'
      ? users.filter(u => !u.active)
      : users.filter(u => u.role === filter);

  if (loading) {
    return <div className="users-container"><p style={{padding: '20px'}}>Loading users...</p></div>;
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h2>Team Management</h2>
          <p>{filteredUsers.length} users</p>
        </div>
        <div className="user-filters">
          {['All', 'Active', 'Blocked', 'ADMIN', 'USER'].map(status => (
            <button
              key={status}
              className={`filter-btn ${filter === status ? 'active' : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'ADMIN' ? '👔 Managers' : status === 'USER' ? '📦 Warehouse' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="users-grid">
        {filteredUsers.length === 0 ? (
          <p style={{padding: '20px', gridColumn: '1/-1'}}>No users found</p>
        ) : (
          filteredUsers.map(user => (
            <div key={user.id} className={`user-card ${!user.active ? 'blocked' : ''}`}>
              <div className="user-card-header">
                <div className="user-avatar">{user.firstName?.charAt(0) || 'U'}</div>
                <span className={`role-badge ${POSITION_COLORS[user.role]}`}>
                  {POSITION_LABELS[user.role] || user.role}
                </span>
              </div>
              
              <div className="user-card-content">
                <h3>{user.firstName} {user.lastName}</h3>
                
                <div className="user-detail">
                  <Mail size={14} />
                  <span>{user.email}</span>
                </div>
                
                {user.phoneNumber && (
                  <div className="user-detail">
                    <span>📞 {user.phoneNumber}</span>
                  </div>
                )}
                
                <div className="user-detail">
                  <Shield size={14} />
                  <span>Status: <strong>{user.active ? '✅ Active' : '❌ Blocked'}</strong></span>
                </div>

                <div className="user-stats">
                  <div className="stat">
                    <span className="label">Joined</span>
                    <span className="value">{new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Role</span>
                    <span className="value">{user.role}</span>
                  </div>
                </div>

                <div className="user-card-actions">
                  <button 
                    className={`btn-action ${user.active ? 'block' : 'unblock'}`}
                    onClick={() => handleBlockUser(user.id, user.active)}
                    title={user.active ? 'Block this user' : 'Unblock this user'}
                  >
                    {user.active ? (
                      <>
                        <Lock size={14} /> Block
                      </>
                    ) : (
                      <>
                        <Unlock size={14} /> Unblock
                      </>
                    )}
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
