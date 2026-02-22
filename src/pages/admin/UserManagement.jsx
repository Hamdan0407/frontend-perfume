import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuthStore } from '../../store/authStore';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('admin/users', {
        params: { page, size: 10 },
      });
      setUsers(response.data.content);
      setTotalPages(response.data.totalPages);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (userId) => {
    try {
      const response = await api.get(`/admin/users/${userId}`);
      setSelectedUser(response.data);
      setShowDetail(true);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    // Check if current user is ADMIN
    const currentUser = useAuthStore.getState().user;
    if (!currentUser || currentUser.role !== 'ADMIN') {
      setError('❌ Only ADMIN can assign roles');
      return;
    }

    // If assigning ADMIN role, check if an ADMIN already exists
    if (newRole === 'ADMIN') {
      const adminUsers = users.filter(u => u.role === 'ADMIN');
      const isCurrentlyAdmin = selectedUser.role === 'ADMIN';

      if (adminUsers.length > 0 && !isCurrentlyAdmin) {
        setError('❌ Only ONE ADMIN user is allowed. Remove existing ADMIN first.');
        return;
      }
    }

    try {
      setUpdating({ userId, type: 'role' });
      await api.put(`admin/users/${userId}/role`, { role: newRole });

      // Update the user in detail view
      if (selectedUser && selectedUser.id === userId) {
        const response = await api.get(`/admin/users/${userId}`);
        setSelectedUser(response.data);
      }

      // Refresh users list
      fetchUsers();
      setUpdating(null);
      setError(null);
    } catch (err) {
      console.error('Error updating user role:', err);
      setError('❌ Failed to update user role');
      setUpdating(null);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      setUpdating({ userId, type: 'status' });
      await api.put(`admin/users/${userId}/status`, { active: newStatus });

      // Update the user in detail view
      if (selectedUser && selectedUser.id === userId) {
        const response = await api.get(`/admin/users/${userId}`);
        setSelectedUser(response.data);
      }

      // Refresh users list
      fetchUsers();
      setUpdating(null);
    } catch (err) {
      console.error('Error updating user status:', err);
      setError('Failed to update user status');
      setUpdating(null);
    }
  };

  const getRoleColor = (role) => {
    if (role === 'ADMIN') return 'bg-red-100 text-red-700';
    if (role === 'EMPLOYEE') return 'bg-purple-100 text-purple-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getStatusColor = (active) => {
    return active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  if (loading && users.length === 0) {
    return <div className="text-center py-8">Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">👥 User Management</h2>
        <p className="text-gray-500 mt-1">Manage user roles and status</p>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Joined</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {Array.isArray(users) && users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{user.firstName} {user.lastName}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.active)}`}>
                    {user.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <button
                    onClick={() => handleViewDetails(user.id)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Manage
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Page {page + 1} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page === totalPages - 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetail && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {selectedUser.firstName} {selectedUser.lastName}
              </h3>
              <button
                onClick={() => setShowDetail(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div>
                <h4 className="text-lg font-semibold mb-3">User Information</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">First Name</p>
                    <p className="font-medium">{selectedUser.firstName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Name</p>
                    <p className="font-medium">{selectedUser.lastName}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="font-medium">
                      {new Date(selectedUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              {selectedUser.address && (
                <div>
                  <h4 className="text-lg font-semibold mb-3">Address</h4>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedUser.address}</p>
                  </div>
                </div>
              )}

              {/* Role Management */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Role Management</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Current Role</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRoleColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Change Role To</p>
                    <div className="space-y-2">
                      {['USER', 'EMPLOYEE', 'ADMIN'].map((role) => (
                        <button
                          key={role}
                          onClick={() => handleUpdateRole(selectedUser.id, role)}
                          disabled={updating?.type === 'role' || role === selectedUser.role}
                          className={`w-full px-4 py-2 rounded-lg font-medium transition ${role === selectedUser.role
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                        >
                          {updating?.type === 'role' && updating?.userId === selectedUser.id
                            ? 'Updating...'
                            : `Change to ${role}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div>
                <h4 className="text-lg font-semibold mb-3">Status Management</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Current Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedUser.active)}`}>
                      {selectedUser.active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Change Status To</p>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleUpdateStatus(selectedUser.id, true)}
                        disabled={updating?.type === 'status' || selectedUser.active}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition ${selectedUser.active
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                      >
                        {updating?.type === 'status' && updating?.userId === selectedUser.id
                          ? 'Updating...'
                          : 'Activate User'}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(selectedUser.id, false)}
                        disabled={updating?.type === 'status' || !selectedUser.active}
                        className={`w-full px-4 py-2 rounded-lg font-medium transition ${!selectedUser.active
                          ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                          : 'bg-red-600 text-white hover:bg-red-700'
                          }`}
                      >
                        {updating?.type === 'status' && updating?.userId === selectedUser.id
                          ? 'Updating...'
                          : 'Deactivate User'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-2">
              <button
                onClick={() => setShowDetail(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
