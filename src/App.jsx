import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import AnnouncementBar from './components/AnnouncementBar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import ErrorBoundary from './components/ErrorBoundary';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ScrollToTop from './components/ScrollToTop';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';

// Version-safe lazy loading with retry logic
const lazyRetry = (componentImport) =>
  lazy(async () => {
    // try-catch for sessionStorage access (fails in some private/incognito modes)
    let pageHasAlreadyBeenForceRefreshed = false;
    try {
      pageHasAlreadyBeenForceRefreshed = JSON.parse(
        window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
      );
    } catch (e) {
      console.warn('Storage access failed:', e);
    }

    try {
      const component = await componentImport();
      try {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      } catch (e) {}
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // Log the error and refresh the page to fetch new chunks
        console.error('Dynamic import failed, refreshing page...', error);
        try {
          window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        } catch (e) {}
        
        // Immediate reload to recover
        window.location.reload();
        
        // Return a promise that never resolves - browser will reload anyway
        return new Promise(() => {});
      }

      // If we already tried to refresh and it still fails, throw the error
      console.error('Dynamic import failed twice, app cannot continue:', error);
      throw error;
    }
  });

// Lazy load pages with retry handling
const Home = lazyRetry(() => import('./pages/Home'));
const Products = lazyRetry(() => import('./pages/Products'));
const ProductDetail = lazyRetry(() => import('./pages/ProductDetail'));
const Cart = lazyRetry(() => import('./pages/Cart'));
const Checkout = lazyRetry(() => import('./pages/Checkout'));
const Login = lazyRetry(() => import('./pages/Login'));
const Register = lazyRetry(() => import('./pages/Register'));
const Wishlist = lazyRetry(() => import('./pages/Wishlist'));
const Orders = lazyRetry(() => import('./pages/Orders'));
const OrderDetail = lazyRetry(() => import('./pages/OrderDetail'));
const InvoicePage = lazyRetry(() => import('./pages/InvoicePage'));
const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const AdminPanel = lazyRetry(() => import('./pages/AdminPanel'));
const Profile = lazyRetry(() => import('./pages/Profile'));
const ForgotPassword = lazyRetry(() => import('./pages/ForgotPassword'));
const ResetPassword = lazyRetry(() => import('./pages/ResetPassword'));
const ContactUs = lazyRetry(() => import('./pages/ContactUs'));
const ShippingInfo = lazyRetry(() => import('./pages/ShippingInfo'));
const ReturnsExchange = lazyRetry(() => import('./pages/ReturnsExchange'));
const FAQ = lazyRetry(() => import('./pages/FAQ'));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin" />
  </div>
);


function App() {
  const { isAuthenticated, sessionInitialized } = useAuthStore();
  // Trigger Fresh Deployment - Syncing with updated Railway backend (Force redeploy)
  const { initWishlist } = useWishlistStore();

  // Force Light Theme Static Only - Removing Dark Mode Support
  useEffect(() => {
    // 1. Explicitly remove 'dark' class from root element
    document.documentElement.classList.remove('dark');
    // 2. Clear theme from localStorage to prevent legacy settings sticking
    if (localStorage.getItem('theme')) {
      localStorage.removeItem('theme');
    }
  }, []);

  // Initialize wishlist when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initWishlist();
    }
  }, [isAuthenticated, initWishlist]);

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            background: '#fff',
            color: '#1a1a1a',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
          success: { icon: '✅' },
          error: { icon: '❌' },
        }}
      />
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <ErrorBoundary fallback={<div className="p-4 text-center">Loading error recovery...</div>}>
          <ScrollToTop />
        <ErrorBoundary fallback={<div className="h-1 bg-amber-500" />}>
          <AnnouncementBar />
        </ErrorBoundary>
        <ErrorBoundary>
          <Navbar />
        </ErrorBoundary>
        <main className="flex-grow overflow-x-hidden">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
              <Route path="/products" element={<ErrorBoundary><Products /></ErrorBoundary>} />
              <Route path="/products/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
              <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />
              <Route path="/register" element={<ErrorBoundary><Register /></ErrorBoundary>} />
              <Route path="/forgot-password" element={<ErrorBoundary><ForgotPassword /></ErrorBoundary>} />
              <Route path="/reset-password" element={<ErrorBoundary><ResetPassword /></ErrorBoundary>} />
              <Route path="/contact" element={<ErrorBoundary><ContactUs /></ErrorBoundary>} />
              <Route path="/shipping" element={<ErrorBoundary><ShippingInfo /></ErrorBoundary>} />
              <Route path="/returns" element={<ErrorBoundary><ReturnsExchange /></ErrorBoundary>} />
              <Route path="/faq" element={<ErrorBoundary><FAQ /></ErrorBoundary>} />

              {/* Protected Routes */}
              <Route path="/wishlist" element={<PrivateRoute><ErrorBoundary><Wishlist /></ErrorBoundary></PrivateRoute>} />
              <Route path="/cart" element={<PrivateRoute><ErrorBoundary><Cart /></ErrorBoundary></PrivateRoute>} />
              <Route path="/checkout" element={<PrivateRoute><ErrorBoundary><Checkout /></ErrorBoundary></PrivateRoute>} />
              <Route path="/orders" element={<PrivateRoute><ErrorBoundary><Orders /></ErrorBoundary></PrivateRoute>} />
              <Route path="/orders/:id" element={<PrivateRoute><ErrorBoundary><OrderDetail /></ErrorBoundary></PrivateRoute>} />
              <Route path="/invoice/:id" element={<PrivateRoute><ErrorBoundary><InvoicePage /></ErrorBoundary></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><ErrorBoundary><Profile /></ErrorBoundary></PrivateRoute>} />
              <Route path="/dashboard" element={<AdminRoute><ErrorBoundary><Dashboard /></ErrorBoundary></AdminRoute>} />
              <Route path="/admin" element={<AdminRoute><ErrorBoundary><AdminPanel /></ErrorBoundary></AdminRoute>} />
            </Routes>
          </Suspense>
        </main>
        <ErrorBoundary fallback={<div className="py-8 text-center text-slate-400">© 2026 Muwas Perfumes</div>}>
          <Footer />
        </ErrorBoundary>

        {/* Chatbot Widget */}
        <ErrorBoundary fallback={null}>
          <Chatbot />
        </ErrorBoundary>
      </ErrorBoundary>
      </div>
    </>
  );
}

export default App;
