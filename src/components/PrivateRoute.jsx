import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function PrivateRoute({ children }) {
  const { isAuthenticated, sessionInitialized, bootstrapStatus } = useAuthStore();

  const isRestoring = !sessionInitialized || bootstrapStatus === 'INIT' || bootstrapStatus === 'AUTHENTICATING';

  // Wait for background session bootstrap to resolve before deciding
  if (isRestoring) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
