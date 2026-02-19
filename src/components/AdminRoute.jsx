import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function AdminRoute({ children }) {
  const { isAuthenticated, user, sessionInitialized } = useAuthStore();

  // Wait for session to be restored from localStorage before deciding
  if (!sessionInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

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
