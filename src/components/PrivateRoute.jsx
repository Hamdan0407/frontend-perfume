import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, sessionInitialized } = useAuthStore();

  // Wait for session to be restored from localStorage before deciding
  if (!sessionInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
