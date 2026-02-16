import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
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

function App() {
  const { isAuthenticated } = useAuthStore();
  const { initWishlist } = useWishlistStore();

  // Initialize session from localStorage on app load
  useEffect(() => {
    const { sessionInitialized, initializeSession } = useAuthStore.getState();

    if (!sessionInitialized) {
      console.log('🔄 Initializing session from localStorage...');
      initializeSession();
    }
  }, []);

  // Initialize wishlist when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      initWishlist();
    }
  }, [isAuthenticated, initWishlist]);

  return (
    <ToastProvider>
      <div className="flex flex-col min-h-screen overflow-x-hidden">
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
