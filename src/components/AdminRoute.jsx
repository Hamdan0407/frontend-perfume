import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore();

  // Not logged in - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Logged in but not admin - redirect to home
  if (!user || user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  // Logged in as admin - allow access
  return children;
}
