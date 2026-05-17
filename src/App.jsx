import { useEffect, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Navbar from './components/Navbar';
import AnnouncementBar from './components/AnnouncementBar';
import Footer from './components/Footer';
import Chatbot from './components/Chatbot';
import { ToastProvider } from './context/ToastContext';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Register from './pages/Register';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import InvoicePage from './pages/InvoicePage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ContactUs from './pages/ContactUs';
import ShippingInfo from './pages/ShippingInfo';
import ReturnsExchange from './pages/ReturnsExchange';
import FAQ from './pages/FAQ';
import { useAuthStore } from './store/authStore';
import { useWishlistStore } from './store/wishlistStore';
import ScrollToTop from './components/ScrollToTop';


function App() {
  const { 
    isAuthenticated, 
    sessionInitialized: authReady, 
    accessToken: token, 
    user,
    bootstrapStatus,
    bootstrap
  } = useAuthStore();
  const { initWishlist } = useWishlistStore();
  const [forceReady, setForceReady] = useState(false);

  // Bootstrap the authentication session once store hydration finishes
  useEffect(() => {
    if (authReady && (bootstrapStatus === 'INIT' || bootstrapStatus === 'FAILED' && token)) {
      bootstrap();
    }
  }, [authReady, bootstrapStatus, bootstrap, token]);

  // Safety fallback: Guarantee the website never gets stuck on the loader forever
  useEffect(() => {
    const timer = setTimeout(() => {
      const isReady = authReady && (bootstrapStatus === 'AUTHENTICATED' || bootstrapStatus === 'FAILED' || bootstrapStatus === 'GUEST');
      if (!isReady) {
        console.warn("⚠️ Auth bootstrap timed out, forcing application load.");
        setForceReady(true);
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [authReady, bootstrapStatus]);

  // Temporary logging for auth persistence debugging
  useEffect(() => {
    console.log("TOKEN:", token);
    console.log("USER RESTORED:", user);
    console.log("AUTH READY:", authReady);
    console.log("BOOTSTRAP STATUS:", bootstrapStatus);
  }, [token, user, authReady, bootstrapStatus]);

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

  const isReady = authReady && (bootstrapStatus === 'AUTHENTICATED' || bootstrapStatus === 'FAILED' || bootstrapStatus === 'GUEST');

  // Loading guard: Prevent rendering empty/stale layout or firing requests before auth bootstrap completes
  if (!isReady && !forceReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Restoring your session...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen overflow-x-hidden">
        <ScrollToTop />
        <AnnouncementBar />
        <Navbar />
        <main className="flex-grow overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/shipping" element={<ShippingInfo />} />
            <Route path="/returns" element={<ReturnsExchange />} />
            <Route path="/faq" element={<FAQ />} />

            {/* Protected Routes */}
            <Route path="/wishlist" element={<PrivateRoute><Wishlist /></PrivateRoute>} />
            <Route path="/cart" element={<PrivateRoute><Cart /></PrivateRoute>} />
            <Route path="/checkout" element={<PrivateRoute><Checkout /></PrivateRoute>} />
            <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
            <Route path="/orders/:id" element={<PrivateRoute><OrderDetail /></PrivateRoute>} />
            <Route path="/invoice/:id" element={<PrivateRoute><InvoicePage /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/dashboard" element={<AdminRoute><Dashboard /></AdminRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
          </Routes>
        </main>
        <Footer />

        {/* Chatbot Widget */}
        <Chatbot />
      </div>
    </ToastProvider>
  );
}

export default App;
