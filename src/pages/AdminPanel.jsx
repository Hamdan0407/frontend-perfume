import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3, Package, ShoppingCart, Users, Settings, LogOut, Menu, X,
  TrendingUp, DollarSign, Eye, Edit, Trash2, Plus, Search, Bell,
  Calendar, ArrowUpRight, RefreshCw, Save, XCircle, Check, AlertCircle,
  Download, Upload, FileText, Image as ImageIcon
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';
import '../styles/AdminPanel.css';

export default function AdminPanel() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isLive, setIsLive] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'

  // Product form
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: 'Floral',
    brand: '',
    imageUrl: '',
    size: '10ml',
    type: 'Eau de Parfum',
    active: true
  });

  // Variants management
  const [productVariants, setProductVariants] = useState([]);

  // Coupon form
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    usageLimit: '',
    usageLimitPerUser: '1',
    validFrom: '',
    validUntil: '',
    active: true
  });

  // Image upload
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadMethod, setUploadMethod] = useState('url'); // 'url' or 'upload'
  const fileInputRef = useRef(null);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    storeName: 'Muwas.in',
    storeEmail: 'admin@perfumeshop.com',
    supportPhone: '+91 98765 43210',
    currency: 'INR',
    taxRate: '18',
    freeShippingThreshold: '899',
    defaultShippingCost: '99'
  });

  // Format price in INR
  const formatINR = (amount) => {
    if (!amount && amount !== 0) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get status color for badges
  const getStatusColor = (status) => {
    const colors = {
      'PLACED': 'warning',
      'CONFIRMED': 'info',
      'PACKED': 'info',
      'SHIPPED': 'primary',
      'DELIVERED': 'success',
      'COMPLETED': 'success',
      'CANCELLED': 'danger',
      'REFUNDED': 'secondary'
    };
    return colors[status] || 'default';
  };

  // Calculate real-time analytics (memoized)
  const analytics = React.useMemo(() => {
    // Total Revenue (from completed/delivered orders)
    const completedOrders = orders.filter(o =>
      ['DELIVERED', 'COMPLETED', 'SHIPPED'].includes(o.status)
    );
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const confirmedRevenue = completedOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);

    // Order stats - using backend enum values
    const pendingOrders = orders.filter(o => o.status === 'PLACED').length;
    const processingOrders = orders.filter(o => ['PACKED', 'CONFIRMED'].includes(o.status)).length;
    const shippedOrders = orders.filter(o => o.status === 'SHIPPED').length;
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

    // Stock stats
    const totalStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const lowStockProducts = products.filter(p => (p.stock || 0) <= 10 && (p.stock || 0) > 0);
    const outOfStockProducts = products.filter(p => (p.stock || 0) === 0);
    const activeProducts = products.filter(p => p.active !== false);

    // Customer stats
    const totalCustomers = users.filter(u => u.role === 'CUSTOMER' || !u.role).length;
    const activeCustomers = users.filter(u => u.active !== false).length;

    // Today's stats
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => {
      if (!o.createdAt) return false;
      return new Date(o.createdAt).toDateString() === today;
    });
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

    // Average order value
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Inventory value
    const inventoryValue = products.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);

    return {
      totalRevenue,
      confirmedRevenue,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalStock,
      lowStockProducts,
      outOfStockProducts,
      activeProducts,
      totalCustomers,
      activeCustomers,
      todayOrders: todayOrders.length,
      todayRevenue,
      avgOrderValue,
      inventoryValue
    };
  }, [orders, products, users]);

  // Categories for dropdown
  const categories = ['perfume', 'attar', 'aroma chemicals'];
  const orderStatuses = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

  // Size options based on category
  const getSizeOptions = (category) => {
    if (category === 'attar') {
      return ['6ml', '12ml'];
    } else if (category === 'perfume') {
      return ['30ml', '50ml', '100ml'];
    } else if (category === 'aroma chemicals') {
      return ['50ml', '100ml', '250ml', '500ml', '1L'];
    }
    return ['30ml', '50ml', '100ml']; // default for perfume
  };

  // Fetch Products
  const fetchProducts = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('products?size=100');
      setProducts(data.content || data || []);
    } catch (err) {
      console.error('Error loading products:', err);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Orders
  const fetchOrders = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('admin/orders?size=100');
      setOrders(data.content || data || []);
    } catch (err) {
      console.error('Error loading orders:', err);
      // Try alternate endpoint
      try {
        const { data } = await api.get('orders?size=100');
        setOrders(data.content || data || []);
      } catch (e) {
        console.error('Alternate orders endpoint failed:', e);
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh Dashboard Stats with Double Confirmation
  const refreshStats = async () => {
    const firstConfirm = window.confirm(
      '⚠️ FIRST CONFIRMATION\n\nAre you sure you want to refresh dashboard statistics?\n\nThis will reload:\n• Total Revenue\n• Total Orders\n• Total Customers\n• All Statistics'
    );

    if (!firstConfirm) return;

    const secondConfirm = window.confirm(
      '⚠️ SECOND CONFIRMATION\n\nPlease confirm again that you want to refresh all dashboard data.\n\nClick OK to proceed with refresh.'
    );

    if (!secondConfirm) return;

    setLoading(true);
    try {
      // Clear data first for visual feedback
      setProducts([]);
      setOrders([]);
      setUsers([]);

      // Add cache-busting parameter
      const cacheBuster = `?_t=${Date.now()}&size=100`;

      // Fetch all data without individual loading states
      const [productsRes, ordersRes, usersRes] = await Promise.all([
        api.get(`products${cacheBuster}`),
        api.get(`admin/orders${cacheBuster}`).catch(() => api.get(`orders${cacheBuster}`)),
        api.get(`admin/users${cacheBuster}`)
      ]);

      setProducts(productsRes.data.content || productsRes.data || []);
      setOrders(ordersRes.data.content || ordersRes.data || []);
      setUsers(usersRes.data.content || usersRes.data || []);
      setLastUpdated(new Date());

      toast.success('✓ Dashboard statistics refreshed successfully!');
    } catch (error) {
      console.error('Error refreshing stats:', error);
      toast.error('✗ Failed to refresh statistics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users
  const fetchUsers = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('admin/users?size=100');
      setUsers(data.content || data || []);
    } catch (err) {
      console.error('Error loading users:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Coupons
  const fetchCoupons = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('admin/coupons');
      setCoupons(data || []);
    } catch (err) {
      console.error('Error loading coupons:', err);
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch all data on mount
  useEffect(() => {
    fetchProducts();
    fetchOrders();
    fetchUsers();
    fetchCoupons();
  }, []);

  // Real-time auto-refresh every 10 seconds for dashboard
  useEffect(() => {
    if (activeTab === 'dashboard' && isLive) {
      const interval = setInterval(async () => {
        // Silent refresh without loading spinner
        try {
          const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
            api.get('products?size=100'),
            api.get('admin/orders?size=100').catch(() => api.get('orders?size=100')),
            api.get('admin/users?size=100')
          ]);

          if (productsRes.status === 'fulfilled') {
            setProducts(productsRes.value.data.content || productsRes.value.data || []);
          }
          if (ordersRes.status === 'fulfilled') {
            setOrders(ordersRes.value.data.content || ordersRes.value.data || []);
          }
          if (usersRes.status === 'fulfilled') {
            setUsers(usersRes.value.data.content || usersRes.value.data || []);
          }

          setLastUpdated(new Date());
        } catch (error) {
          console.error('Auto-refresh error:', error);
        }
      }, 10000); // Refresh every 10 seconds

      return () => clearInterval(interval);
    }
  }, [activeTab, isLive]);

  useEffect(() => {
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'orders') fetchOrders();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'coupons') fetchCoupons();
  }, [activeTab, fetchProducts, fetchOrders, fetchUsers, fetchCoupons]);

  const handleLogout = React.useCallback(() => {
    logout();
    navigate('/login');
  }, [logout, navigate]);

  const refreshAll = React.useCallback(() => {
    fetchProducts();
    fetchOrders();
    fetchUsers();
    setLastUpdated(new Date());
    toast.success('Data refreshed!');
  }, [fetchProducts, fetchOrders, fetchUsers]);

  // ==================== PRODUCT OPERATIONS ====================

  const openAddProductModal = () => {
    setModalMode('add');
    setProductForm({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: 'perfume',
      brand: '',
      imageUrl: '',
      size: '30ml', // default for perfume
      type: 'Eau de Parfum',
      active: true
    });
    setImagePreview(null);
    setUploadMethod('url');
    setShowProductModal(true);
  };

  const openEditProductModal = (product) => {
    setModalMode('edit');
    setSelectedItem(product);
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      category: product.category || 'perfume',
      brand: product.brand || '',
      imageUrl: product.imageUrl || '',
      size: product.size || (product.category === 'attar' ? '6ml' : '30ml'),
      type: product.type || 'Eau de Parfum',
      active: product.active !== false
    });
    // Load existing variants or create default one
    if (product.variants && product.variants.length > 0) {
      setProductVariants(product.variants.map(v => ({
        id: v.id || Date.now() + Math.random(),
        size: v.size,
        price: v.price?.toString() || '',
        stock: v.stock?.toString() || '',
        active: v.active !== false
      })));
    } else {
      // Create variant from product data if no variants exist
      const sizeNum = parseInt(product.size) || 30;
      setProductVariants([{
        id: Date.now(),
        size: sizeNum,
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '',
        active: true
      }]);
    }
    // Set image preview if product has an image
    if (product.imageUrl) {
      setImagePreview(product.imageUrl);
      setUploadMethod(product.imageUrl.startsWith('data:') ? 'upload' : 'url');
    } else {
      setImagePreview(null);
      setUploadMethod('url');
    }
    setShowProductModal(true);
  };

  const handleProductSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate variants
    if (!productVariants || productVariants.length === 0) {
      toast.error('Please add at least one size variant');
      setLoading(false);
      return;
    }

    // Build variants data
    const variantsData = productVariants.map(v => ({
      size: parseInt(v.size) || 30,
      price: parseFloat(v.price) || parseFloat(productForm.price) || 0,
      stock: parseInt(v.stock) || 0,
      active: v.active !== false
    }));

    // Calculate total stock from all variants
    const totalStock = variantsData.reduce((sum, v) => sum + v.stock, 0);

    // Use first variant price as main product price
    const mainPrice = variantsData[0].price;

    // Build product data with proper types
    const imageUrl = productForm.imageUrl || '';
    const productData = {
      name: productForm.name.trim(),
      description: productForm.description?.trim() || 'Premium perfume',
      price: mainPrice,
      stock: totalStock,
      category: productForm.category || 'perfume',
      brand: productForm.brand?.trim() || 'Generic',
      imageUrl: imageUrl.startsWith('data:') ? imageUrl : imageUrl.trim(),
      size: productForm.size || (productForm.category === 'attar' ? '6ml' : '30ml'),
      type: productForm.type || 'Eau de Parfum',
      active: productForm.active !== false,
      featured: false,
      variants: variantsData
    };

    try {
      if (modalMode === 'add') {
        await api.post('admin/products', productData);
        toast.success('Product created successfully!');
      } else {
        await api.put(`admin/products/${selectedItem.id}`, productData);
        toast.success('Product updated successfully!');
      }
      setShowProductModal(false);
      fetchProducts();
    } catch (err) {
      console.error('Product save error:', err);
      const errorMsg = err.response?.data?.message
        || err.response?.data?.error
        || (typeof err.response?.data === 'string' ? err.response?.data : null)
        || 'Failed to save product';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [productForm, productVariants, modalMode, selectedItem, fetchProducts]);

  // Variant management functions
  const addVariant = () => {
    const newVariant = {
      id: Date.now(),
      size: 30,
      price: '',
      stock: '',
      active: true
    };
    setProductVariants([...productVariants, newVariant]);
  };

  const removeVariant = (variantId) => {
    if (productVariants.length === 1) {
      toast.error('Product must have at least one size variant');
      return;
    }
    setProductVariants(productVariants.filter(v => v.id !== variantId));
  };

  const updateVariant = (variantId, field, value) => {
    setProductVariants(productVariants.map(v =>
      v.id === variantId ? { ...v, [field]: value } : v
    ));
  };

  const confirmDeleteProduct = (product) => {
    setSelectedItem(product);
    setShowDeleteConfirm(true);
  };

  const handleDeleteProduct = async () => {
    setLoading(true);
    try {
      await api.delete(`admin/products/${selectedItem.id}`);
      toast.success('Product deleted successfully!');
      setShowDeleteConfirm(false);
      fetchProducts();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete product');
    } finally {
      setLoading(false);
    }
  };

  // ==================== ORDER OPERATIONS ====================

  const openOrderModal = (order) => {
    setSelectedItem(order);
    setShowOrderModal(true);
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.put(`admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
      fetchOrders();
      setShowOrderModal(false);
    } catch (err) {
      console.error('Order update error:', err);
      toast.error('Failed to update order status');
    }
  };

  // ==================== USER OPERATIONS ====================

  const openUserModal = (user) => {
    setSelectedItem(user);
    setShowUserModal(true);
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      await api.put(`admin/users/${userId}/status`, { active: !currentStatus });
      toast.success(`User ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (err) {
      console.error('User status update error:', err);
      toast.error('Failed to update user status');
    }
  };

  const handleChangeUserRole = async (userId, newRole) => {
    try {
      await api.put(`admin/users/${userId}/role`, { role: newRole });
      toast.success(`User role updated to ${newRole}`);
      fetchUsers();
      setShowUserModal(false);
    } catch (err) {
      console.error('Role update error:', err);
      toast.error('Failed to update user role');
    }
  };

  // ==================== COUPON OPERATIONS ====================

  const openAddCouponModal = () => {
    setModalMode('add');
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    setCouponForm({
      code: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      maxDiscountAmount: '',
      usageLimit: '100',
      usageLimitPerUser: '1',
      validFrom: now.toISOString().slice(0, 16),
      validUntil: nextMonth.toISOString().slice(0, 16),
      active: true
    });
    setShowCouponModal(true);
  };

  const openEditCouponModal = (coupon) => {
    setModalMode('edit');
    setSelectedItem(coupon);
    setCouponForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue?.toString() || '',
      minOrderAmount: coupon.minOrderAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      maxDiscountAmount: coupon.maxDiscountAmount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      usageLimitPerUser: coupon.usageLimitPerUser?.toString() || '1',
      validFrom: new Date(coupon.validFrom).toISOString().slice(0, 16),
      validUntil: new Date(coupon.validUntil).toISOString().slice(0, 16),
      active: coupon.active
    });
    setShowCouponModal(true);
  };

  const handleCouponSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);

    const couponData = {
      code: couponForm.code.toUpperCase().trim(),
      description: couponForm.description.trim(),
      discountType: couponForm.discountType,
      discountValue: parseFloat(couponForm.discountValue) || 0,
      minOrderAmount: couponForm.minOrderAmount ? parseFloat(couponForm.minOrderAmount) : null,
      maxDiscountAmount: couponForm.maxDiscountAmount ? parseFloat(couponForm.maxDiscountAmount) : null,
      maxDiscountAmount: couponForm.maxDiscountAmount ? parseFloat(couponForm.maxDiscountAmount) : null,
      usageLimit: parseInt(couponForm.usageLimit, 10) || 100,
      usageLimitPerUser: parseInt(couponForm.usageLimitPerUser, 10) || 1,
      validFrom: new Date(couponForm.validFrom).toISOString(),
      validUntil: new Date(couponForm.validUntil).toISOString(),
      active: couponForm.active !== false
    };

    try {
      if (modalMode === 'add') {
        await api.post('admin/coupons', couponData);
        toast.success('Coupon created successfully!');
      } else {
        await api.put(`admin/coupons/${selectedItem.id}`, couponData);
        toast.success('Coupon updated successfully!');
      }
      setShowCouponModal(false);
      fetchCoupons();
    } catch (err) {
      console.error('Coupon save error:', err);
      const errorMsg = err.response?.data?.message
        || err.response?.data?.error
        || 'Failed to save coupon';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [couponForm, modalMode, selectedItem, fetchCoupons]);

  const confirmDeleteCoupon = (coupon) => {
    setSelectedItem(coupon);
    setShowDeleteConfirm(true);
  };

  const handleDeleteCoupon = async () => {
    setLoading(true);
    try {
      await api.delete(`admin/coupons/${selectedItem.id}`);
      toast.success('Coupon deleted successfully!');
      setShowDeleteConfirm(false);
      fetchCoupons();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleCouponStatus = async (couponId) => {
    try {
      await api.patch(`admin/coupons/${couponId}/toggle`);
      toast.success('Coupon status updated!');
      fetchCoupons();
    } catch (err) {
      console.error('Coupon toggle error:', err);
      toast.error('Failed to update coupon status');
    }
  };

  // ==================== SETTINGS OPERATIONS ====================

  const handleSaveSettings = React.useCallback(() => {
    // Save to localStorage for now (in production, this would go to backend)
    localStorage.setItem('storeSettings', JSON.stringify(settingsForm));
    toast.success('Settings saved successfully!');
  }, [settingsForm]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('storeSettings');
    if (savedSettings) {
      try {
        setSettingsForm(JSON.parse(savedSettings));
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // ==================== IMAGE UPLOAD HANDLER ====================
  const handleImageUpload = React.useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Convert to base64 for preview and storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setImagePreview(base64String);
      setProductForm(prev => ({ ...prev, imageUrl: base64String }));
      toast.success('Image uploaded successfully!');
    };
    reader.onerror = () => {
      toast.error('Failed to read image file');
    };
    reader.readAsDataURL(file);
  }, []);

  const removeImage = React.useCallback(() => {
    setImagePreview(null);
    setProductForm(prev => ({ ...prev, imageUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // ==================== INVOICE PDF GENERATOR ====================
  const generateInvoicePDF = (order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Application Theme Color Palette
    const primaryColor = [26, 32, 44];      // Deep Slate - hsl(222 47% 11%)
    const accentColor = [245, 158, 11];     // Warm Gold - hsl(38 92% 50%)
    const darkColor = [17, 24, 39];         // Text dark
    const grayColor = [107, 114, 128];      // Muted text
    const lightGray = [243, 244, 246];      // Light background
    const secondaryBg = [248, 250, 252];    // Secondary background

    // Header with Primary Background
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 55, 'F');

    // Company Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.text('MUWAS.IN', 20, 25);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Luxury Fragrances & Premium Scents', 20, 35);

    // TAX INVOICE Badge (right side)
    doc.setFillColor(255, 255, 255);
    const badgeWidth = 55;
    const badgeX = pageWidth - badgeWidth - 15; // 15 = margin
    doc.roundedRect(badgeX, 15, badgeWidth, 18, 3, 3, 'F');
    doc.setTextColor(...primaryColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TAX INVOICE', badgeX + (badgeWidth / 2), 27, { align: 'center' });

    // Invoice Details (right side, below badge)
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${order.orderNumber || order.id}`, pageWidth - 15, 42, { align: 'right' });
    doc.text(new Date(order.createdAt || Date.now()).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    }), pageWidth - 15, 48, { align: 'right' });

    // Company Contact Bar
    doc.setFillColor(...lightGray);
    doc.rect(15, 62, pageWidth - 30, 18, 'F');
    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.text('📍 No 3, Modi Ibrahim Street, Ambur, Tamil Nadu 635802', 18, 68);
    doc.text('📞 +91 9629004158', 18, 73);
    doc.text('✉ muwas2021@gmail.com', 18, 78);
    doc.text('🌐 www.muwas.com', pageWidth - 18, 68, { align: 'right' });
    doc.text('GSTIN: 33AAAAA0000A1Z5', pageWidth - 18, 73, { align: 'right' });
    doc.text('PAN: AAAAA0000A', pageWidth - 18, 78, { align: 'right' });

    // Bill To & Ship To Section
    let yPos = 95;

    // Bill To Box (left)
    doc.setFillColor(...secondaryBg);
    doc.roundedRect(15, yPos, (pageWidth - 35) / 2, 35, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240); // Border
    doc.setLineWidth(0.8);
    doc.roundedRect(15, yPos, (pageWidth - 35) / 2, 35, 3, 3, 'S');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('👤 BILL TO', 20, yPos + 7);

    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(order.customerName || order.user?.firstName || 'Customer', 20, yPos + 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    doc.text(order.user?.email || '', 20, yPos + 21);
    if (order.user?.phone) {
      doc.text(order.user.phone, 20, yPos + 27);
    }

    // Ship To Box (right)
    const shipToX = pageWidth / 2 + 2.5;
    doc.setFillColor(...secondaryBg);
    doc.roundedRect(shipToX, yPos, (pageWidth - 35) / 2, 35, 3, 3, 'F');
    doc.setDrawColor(226, 232, 240); // Border
    doc.roundedRect(shipToX, yPos, (pageWidth - 35) / 2, 35, 3, 3, 'S');

    doc.setTextColor(...accentColor);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('📦 SHIP TO', shipToX + 5, yPos + 7);

    doc.setTextColor(...darkColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    const shippingName = order.shippingName || order.customerName || 'Customer';
    doc.text(shippingName, shipToX + 5, yPos + 15);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...grayColor);
    if (order.shippingAddress) {
      doc.text(order.shippingAddress.substring(0, 35), shipToX + 5, yPos + 21);
    }
    if (order.shippingCity) {
      doc.text(`${order.shippingCity}, ${order.shippingCountry || 'India'}`, shipToX + 5, yPos + 27);
    }

    // Items Table
    yPos = 145;

    // Table Header with Primary Color
    doc.setFillColor(...primaryColor);
    doc.rect(15, yPos, pageWidth - 30, 12, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('#', 20, yPos + 8);
    doc.text('PRODUCT DETAILS', 30, yPos + 8);
    doc.text('QTY', 115, yPos + 8, { align: 'center' });
    doc.text('UNIT PRICE', 145, yPos + 8, { align: 'right' });
    doc.text('AMOUNT', pageWidth - 20, yPos + 8, { align: 'right' });

    // Table Items
    yPos += 18;
    doc.setTextColor(...darkColor);
    doc.setFont('helvetica', 'normal');

    const items = order.items || order.orderItems || [];
    let itemSubtotal = 0;

    if (items.length > 0) {
      items.forEach((item, index) => {
        const itemName = item.productName || item.product?.name || `Product ${index + 1}`;
        const qty = item.quantity || 1;
        const price = item.price || item.product?.price || 0;
        const total = qty * price;
        itemSubtotal += total;

        // Alternate row background
        if (index % 2 === 0) {
          doc.setFillColor(249, 250, 251);
          doc.rect(15, yPos - 5, pageWidth - 30, 10, 'F');
        }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...grayColor);
        doc.text(`${index + 1}`, 20, yPos + 2);

        doc.setTextColor(...darkColor);
        doc.setFont('helvetica', 'normal');
        doc.text(itemName.substring(0, 45), 30, yPos + 2);

        // Quantity Badge
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(108, yPos - 3, 14, 6, 2, 2, 'F');
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text(qty.toString(), 115, yPos + 2, { align: 'center' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`₹${price.toLocaleString('en-IN')}`, 145, yPos + 2, { align: 'right' });

        doc.setFont('helvetica', 'bold');
        doc.text(`₹${total.toLocaleString('en-IN')}`, pageWidth - 20, yPos + 2, { align: 'right' });

        yPos += 10;
      });
    } else {
      doc.text('1', 20, yPos + 2);
      doc.text('Order items', 30, yPos + 2);
      doc.text('1', 115, yPos + 2, { align: 'center' });
      const amount = order.totalAmount || 0;
      doc.text(`₹${amount.toLocaleString('en-IN')}`, 145, yPos + 2, { align: 'right' });
      doc.text(`₹${amount.toLocaleString('en-IN')}`, pageWidth - 20, yPos + 2, { align: 'right' });
      itemSubtotal = amount;
      yPos += 10;
    }

    // Summary Section
    yPos += 10;
    const summaryX = pageWidth - 95; // Adjusted for better alignment
    const summaryWidth = 90;

    // Summary Box
    doc.setFillColor(...lightGray);
    doc.roundedRect(summaryX - 5, yPos, summaryWidth, 45, 3, 3, 'F');
    doc.setDrawColor(209, 213, 219);
    doc.setLineWidth(0.5);
    doc.roundedRect(summaryX - 5, yPos, summaryWidth, 45, 3, 3, 'S');

    yPos += 8;

    const subtotal = itemSubtotal;
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const shipping = order.shippingCost || 0;
    const grandTotal = order.totalAmount || (subtotal + shipping);

    doc.setFontSize(9);
    doc.setTextColor(...grayColor);
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX, yPos);
    doc.setTextColor(...darkColor);
    doc.text(`₹${(subtotal - tax).toLocaleString('en-IN')}`, summaryX + summaryWidth - 5, yPos, { align: 'right' });

    yPos += 7;
    doc.setTextColor(...grayColor);
    doc.text('GST (18%):', summaryX, yPos);
    doc.setTextColor(...darkColor);
    doc.text(`₹${tax.toLocaleString('en-IN')}`, summaryX + summaryWidth - 5, yPos, { align: 'right' });

    yPos += 7;
    doc.setTextColor(...grayColor);
    doc.text('Shipping:', summaryX, yPos);
    doc.setTextColor(...darkColor);
    doc.text(shipping > 0 ? `₹${shipping.toLocaleString('en-IN')}` : 'FREE', summaryX + summaryWidth - 5, yPos, { align: 'right' });

    // Total Amount with Primary Color
    yPos += 12;
    doc.setFillColor(...primaryColor);
    doc.roundedRect(summaryX - 5, yPos - 5, summaryWidth, 12, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', summaryX, yPos + 3);
    doc.setFontSize(13);
    doc.text(`₹${grandTotal.toLocaleString('en-IN')}`, summaryX + summaryWidth - 5, yPos + 3, { align: 'right' });

    // Footer Section
    const footerY = pageHeight - 35;

    // Thank You Message
    doc.setFillColor(...lightGray);
    doc.roundedRect(15, footerY, pageWidth - 30, 25, 3, 3, 'F');

    doc.setTextColor(...primaryColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('🎉 Thank you for shopping with us!', pageWidth / 2, footerY + 8, { align: 'center' });

    doc.setTextColor(...grayColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('We appreciate your business and look forward to serving you again', pageWidth / 2, footerY + 14, { align: 'center' });
    doc.text('Need help? Contact us at muwas2021@yahoo.com or call +91 9894722186', pageWidth / 2, footerY + 19, { align: 'center' });

    // Save the PDF
    doc.save(`Invoice-${order.orderNumber || order.id}.pdf`);
    toast.success('Invoice downloaded successfully!');
  };

  // Memoized filtered data
  const filteredProducts = React.useMemo(() => {
    if (!searchQuery) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(p =>
      p.name?.toLowerCase().includes(query) ||
      p.category?.toLowerCase().includes(query) ||
      p.brand?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const filteredOrders = React.useMemo(() => {
    if (!searchQuery) return orders;
    const query = searchQuery.toLowerCase();
    return orders.filter(o =>
      o.id?.toString().includes(searchQuery) ||
      o.customerName?.toLowerCase().includes(query) ||
      o.status?.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  const filteredUsers = React.useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(u =>
      u.email?.toLowerCase().includes(query) ||
      u.firstName?.toLowerCase().includes(query) ||
      u.lastName?.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  // Generate notifications (memoized)
  const currentNotifications = React.useMemo(() => {
    const notifs = [];

    // Pending orders
    if (analytics.pendingOrders > 0) {
      notifs.push({
        id: 'pending-orders',
        type: 'warning',
        icon: '⏳',
        title: `${analytics.pendingOrders} Pending Order${analytics.pendingOrders > 1 ? 's' : ''}`,
        message: 'Orders awaiting confirmation',
        action: () => { setActiveTab('orders'); setSearchQuery('PENDING'); setShowNotifications(false); }
      });
    }

    // Processing orders
    if (analytics.processingOrders > 0) {
      notifs.push({
        id: 'processing-orders',
        type: 'info',
        icon: '📦',
        title: `${analytics.processingOrders} Processing`,
        message: 'Orders being prepared',
        action: () => { setActiveTab('orders'); setSearchQuery('PROCESSING'); setShowNotifications(false); }
      });
    }

    // Low stock products
    if (analytics.lowStockProducts.length > 0) {
      notifs.push({
        id: 'low-stock',
        type: 'warning',
        icon: '⚠️',
        title: `${analytics.lowStockProducts.length} Low Stock Items`,
        message: analytics.lowStockProducts.slice(0, 2).map(p => p.name).join(', ') +
          (analytics.lowStockProducts.length > 2 ? '...' : ''),
        action: () => { setActiveTab('products'); setShowNotifications(false); }
      });
    }

    // Out of stock products
    if (analytics.outOfStockProducts.length > 0) {
      notifs.push({
        id: 'out-of-stock',
        type: 'danger',
        icon: '🚫',
        title: `${analytics.outOfStockProducts.length} Out of Stock`,
        message: 'Products need restocking immediately',
        action: () => { setActiveTab('products'); setShowNotifications(false); }
      });
    }

    // Shipped orders
    if (analytics.shippedOrders > 0) {
      notifs.push({
        id: 'shipped',
        type: 'success',
        icon: '🚚',
        title: `${analytics.shippedOrders} Order${analytics.shippedOrders > 1 ? 's' : ''} Shipped`,
        message: 'On the way to customers',
        action: () => { setActiveTab('orders'); setSearchQuery('SHIPPED'); setShowNotifications(false); }
      });
    }

    // Today's performance
    if (analytics.todayOrders > 0) {
      notifs.push({
        id: 'today',
        type: 'success',
        icon: '📈',
        title: `${analytics.todayOrders} Orders Today`,
        message: `Revenue: ${formatINR(analytics.todayRevenue)}`,
        action: () => { setActiveTab('dashboard'); setShowNotifications(false); }
      });
    }

    return notifs;
  }, [analytics, formatINR]);

  const notificationCount = React.useMemo(() =>
    currentNotifications.filter(n => n.type === 'warning' || n.type === 'danger').length,
    [currentNotifications]
  );

  // Get search result count based on active tab
  const getSearchResultCount = () => {
    if (!searchQuery) return null;
    switch (activeTab) {
      case 'products': return filteredProducts.length;
      case 'orders': return filteredOrders.length;
      case 'users': return filteredUsers.length;
      default: return null;
    }
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
        <div className="sidebar-brand">
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="logo-icon" style={{ width: '32px', height: '32px', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/muwas-logo-nobg.png" alt="Muwas" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            {sidebarOpen && <span className="brand-text">Muwas.in</span>}
          </div>
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            {sidebarOpen && <span className="nav-section-title">Main Menu</span>}

            <button
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <BarChart3 size={20} />
              {sidebarOpen && <span>Dashboard</span>}
            </button>

            <button
              className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
              onClick={() => setActiveTab('products')}
            >
              <Package size={20} />
              {sidebarOpen && <span>Products</span>}
              {sidebarOpen && <span className="nav-badge">{products.length}</span>}
            </button>

            <button
              className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
              onClick={() => setActiveTab('orders')}
            >
              <ShoppingCart size={20} />
              {sidebarOpen && <span>Orders</span>}
              {analytics.pendingOrders > 0 && sidebarOpen && (
                <span className="nav-badge warning">{analytics.pendingOrders}</span>
              )}
            </button>

            <button
              className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <Users size={20} />
              {sidebarOpen && <span>Customers</span>}
            </button>

            <button
              className={`nav-item ${activeTab === 'coupons' ? 'active' : ''}`}
              onClick={() => setActiveTab('coupons')}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
                <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
                <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              {sidebarOpen && <span>Coupons</span>}
              {sidebarOpen && <span className="nav-badge">{coupons.length}</span>}
            </button>
          </div>

          <div className="nav-section">
            {sidebarOpen && <span className="nav-section-title">Settings</span>}

            <button
              className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <Settings size={20} />
              {sidebarOpen && <span>Settings</span>}
            </button>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="user-avatar">
              {user?.firstName?.charAt(0) || 'A'}
            </div>
            {sidebarOpen && (
              <div className="user-info">
                <span className="user-name">{user?.firstName || 'Admin'}</span>
                <span className="user-role">Administrator</span>
              </div>
            )}
          </div>
          <button className="nav-item logout" onClick={handleLogout}>
            <LogOut size={20} />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Top Bar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <h1 className="page-title">
              {activeTab === 'dashboard' && '📊 Dashboard'}
              {activeTab === 'products' && '📦 Products'}
              {activeTab === 'orders' && '🛒 Orders'}
              {activeTab === 'users' && '👥 Customers'}
              {activeTab === 'coupons' && '🎟️ Coupons'}
              {activeTab === 'settings' && '⚙️ Settings'}
            </h1>
          </div>
          <div className="topbar-right">
            {/* Enhanced Search Box */}
            <div className={`search-box ${searchQuery ? 'has-value' : ''}`}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <>
                  {getSearchResultCount() !== null && (
                    <span className="search-count">{getSearchResultCount()} found</span>
                  )}
                  <button className="search-clear" onClick={clearSearch} title="Clear search">
                    <XCircle size={16} />
                  </button>
                </>
              )}
            </div>

            {/* Notifications Bell */}
            <div className="notification-wrapper">
              <button
                className={`topbar-btn notification-btn ${showNotifications ? 'active' : ''}`}
                title="Notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={20} />
                {notificationCount > 0 && (
                  <span className="notification-badge">{notificationCount}</span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div className="notifications-header">
                    <h3>🔔 Notifications</h3>
                    <span className="notification-count-label">{currentNotifications.length} alerts</span>
                  </div>
                  <div className="notifications-list">
                    {currentNotifications.length === 0 ? (
                      <div className="notification-empty">
                        <span className="empty-icon">✨</span>
                        <span>All caught up!</span>
                        <span className="empty-sub">No pending notifications</span>
                      </div>
                    ) : (
                      currentNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`notification-item ${notif.type}`}
                          onClick={notif.action}
                        >
                          <span className="notif-icon">{notif.icon}</span>
                          <div className="notif-content">
                            <span className="notif-title">{notif.title}</span>
                            <span className="notif-message">{notif.message}</span>
                          </div>
                          <ArrowUpRight size={14} className="notif-arrow" />
                        </div>
                      ))
                    )}
                  </div>
                  <div className="notifications-footer">
                    <button onClick={() => { setActiveTab('dashboard'); setShowNotifications(false); }}>
                      View Dashboard
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button className="topbar-btn refresh" onClick={refreshAll} title="Refresh Data">
              <RefreshCw size={20} />
            </button>
          </div>
        </header>

        {/* Click outside to close notifications */}
        {showNotifications && (
          <div className="notification-overlay" onClick={() => setShowNotifications(false)}></div>
        )}

        {/* Content Area */}
        <div className="admin-content">
          {error && (
            <div className="alert alert-error">
              <AlertCircle size={18} />
              <span>{error}</span>
              <button onClick={() => setError(null)}>×</button>
            </div>
          )}

          {/* ==================== DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="dashboard">
              {/* Live Status Header */}
              <div className="dashboard-header">
                <div className="live-status">
                  <span className={`live-indicator ${isLive ? 'active' : ''}`}></span>
                  <span className="live-text">{isLive ? 'LIVE' : 'PAUSED'}</span>
                  <button
                    className={`live-toggle ${isLive ? 'active' : ''}`}
                    onClick={() => setIsLive(!isLive)}
                    title={isLive ? 'Pause auto-refresh' : 'Enable auto-refresh'}
                  >
                    {isLive ? '⏸' : '▶'}
                  </button>
                </div>
                <div className="last-updated">
                  Last updated: {lastUpdated.toLocaleTimeString('en-IN')}
                </div>
                <button
                  className="refresh-btn"
                  onClick={refreshStats}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => (e.target.style.backgroundColor = '#6d28d9')}
                  onMouseLeave={(e) => (e.target.style.backgroundColor = '#7c3aed')}
                >
                  <RefreshCw size={16} />
                  Refresh Stats
                </button>
              </div>

              {/* Main Stats Row */}
              <div className="stats-grid">
                <div className="stat-card gradient-purple">
                  <div className="stat-icon"><DollarSign size={28} /></div>
                  <div className="stat-content">
                    <span className="stat-label">Total Revenue</span>
                    <span className="stat-value">{formatINR(analytics.totalRevenue)}</span>
                    <span className="stat-change positive"><ArrowUpRight size={16} /> {orders.length} orders</span>
                  </div>
                </div>
                <div className="stat-card gradient-blue">
                  <div className="stat-icon"><ShoppingCart size={28} /></div>
                  <div className="stat-content">
                    <span className="stat-label">Total Orders</span>
                    <span className="stat-value">{orders.length}</span>
                    <span className="stat-change warning">{analytics.pendingOrders} pending</span>
                  </div>
                </div>
                <div className="stat-card gradient-green">
                  <div className="stat-icon"><Package size={28} /></div>
                  <div className="stat-content">
                    <span className="stat-label">Total Stock</span>
                    <span className="stat-value">{analytics.totalStock.toLocaleString()} units</span>
                    <span className="stat-change neutral">{products.length} products</span>
                  </div>
                </div>
                <div className="stat-card gradient-orange">
                  <div className="stat-icon"><Users size={28} /></div>
                  <div className="stat-content">
                    <span className="stat-label">Total Customers</span>
                    <span className="stat-value">{analytics.totalCustomers}</span>
                    <span className="stat-change positive">{analytics.activeCustomers} active</span>
                  </div>
                </div>
              </div>

              {/* Secondary Stats Row */}
              <div className="stats-grid secondary">
                <div className="stat-card-mini">
                  <div className="mini-icon success">✓</div>
                  <div className="mini-content">
                    <span className="mini-value">{analytics.deliveredOrders}</span>
                    <span className="mini-label">Delivered</span>
                  </div>
                </div>
                <div className="stat-card-mini">
                  <div className="mini-icon info">📦</div>
                  <div className="mini-content">
                    <span className="mini-value">{analytics.shippedOrders}</span>
                    <span className="mini-label">Shipped</span>
                  </div>
                </div>
                <div className="stat-card-mini">
                  <div className="mini-icon warning">⏳</div>
                  <div className="mini-content">
                    <span className="mini-value">{analytics.processingOrders}</span>
                    <span className="mini-label">Processing</span>
                  </div>
                </div>
                <div className="stat-card-mini">
                  <div className="mini-icon danger">⚠️</div>
                  <div className="mini-content">
                    <span className="mini-value">{analytics.lowStockProducts.length}</span>
                    <span className="mini-label">Low Stock</span>
                  </div>
                </div>
                <div className="stat-card-mini">
                  <div className="mini-icon purple">💰</div>
                  <div className="mini-content">
                    <span className="mini-value">{formatINR(analytics.avgOrderValue)}</span>
                    <span className="mini-label">Avg Order</span>
                  </div>
                </div>
                <div className="stat-card-mini">
                  <div className="mini-icon blue">📊</div>
                  <div className="mini-content">
                    <span className="mini-value">{formatINR(analytics.inventoryValue)}</span>
                    <span className="mini-label">Inventory Value</span>
                  </div>
                </div>
              </div>

              <div className="dashboard-grid">
                <div className="card">
                  <div className="card-header">
                    <h3>📋 Recent Orders</h3>
                    <button className="btn-link" onClick={() => setActiveTab('orders')}>View All</button>
                  </div>
                  <div className="card-body">
                    {orders.slice(0, 5).length > 0 ? (
                      <div className="recent-orders-list">
                        {orders.slice(0, 5).map(order => (
                          <div key={order.id} className="recent-order-item" onClick={() => openOrderModal(order)}>
                            <div className="order-info">
                              <span className="order-id">#{order.id}</span>
                              <span className="order-customer">{order.customerName || 'Customer'}</span>
                            </div>
                            <div className="order-meta">
                              <span className={`status-badge ${getStatusColor(order.status)}`}>
                                {order.status || 'Pending'}
                              </span>
                              <span className="order-amount">{formatINR(order.totalAmount)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <ShoppingCart size={48} />
                        <p>No orders yet</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>⚠️ Low Stock Alert</h3>
                    <button className="btn-link" onClick={() => setActiveTab('products')}>View All</button>
                  </div>
                  <div className="card-body">
                    {analytics.lowStockProducts.length > 0 ? (
                      <div className="low-stock-list">
                        {analytics.lowStockProducts.slice(0, 5).map(product => (
                          <div key={product.id} className="low-stock-item">
                            <div className="product-info">
                              <span className="product-name">{product.name}</span>
                              <span className="product-brand">{product.brand}</span>
                            </div>
                            <span className={`stock-count ${product.stock <= 5 ? 'critical' : 'warning'}`}>
                              {product.stock} left
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <Check size={48} />
                        <p>All products well stocked!</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>⚡ Quick Actions</h3>
                  </div>
                  <div className="card-body">
                    <div className="quick-actions">
                      <button className="quick-action-btn" onClick={openAddProductModal}>
                        <Plus size={20} />
                        <span>Add Product</span>
                      </button>
                      <button className="quick-action-btn" onClick={() => setActiveTab('orders')}>
                        <Eye size={20} />
                        <span>View Orders</span>
                      </button>
                      <button className="quick-action-btn" onClick={() => setActiveTab('users')}>
                        <Users size={20} />
                        <span>Manage Users</span>
                      </button>
                      <button className="quick-action-btn" onClick={() => setActiveTab('settings')}>
                        <Settings size={20} />
                        <span>Settings</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3>🏆 Top Products</h3>
                    <button className="btn-link" onClick={() => setActiveTab('products')}>View All</button>
                  </div>
                  <div className="card-body">
                    {products.slice(0, 5).length > 0 ? (
                      <div className="top-products-list">
                        {products.slice(0, 5).map((product, idx) => (
                          <div key={product.id} className="top-product-item" onClick={() => openEditProductModal(product)}>
                            <span className="rank">#{idx + 1}</span>
                            <div className="product-info">
                              <span className="product-name">{product.name}</span>
                              <span className="product-category">{product.category}</span>
                            </div>
                            <span className="product-price">{formatINR(product.price)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <Package size={48} />
                        <p>No products yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PRODUCTS ==================== */}
          {activeTab === 'products' && (
            <div className="section">
              <div className="section-header">
                <div className="section-title">
                  <h2>Product Catalog</h2>
                  <span className="subtitle">{filteredProducts.length} products found</span>
                </div>
                <button className="btn btn-primary" onClick={openAddProductModal}>
                  <Plus size={18} />
                  Add New Product
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading products...</p>
                </div>
              ) : filteredProducts.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Rating</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map(product => (
                        <tr key={product.id}>
                          <td>
                            <div className="product-cell">
                              <div className="product-thumb">
                                {product.imageUrl ? (
                                  <img src={product.imageUrl} alt={product.name} />
                                ) : (
                                  <Package size={24} />
                                )}
                              </div>
                              <div className="product-details">
                                <span className="product-name">{product.name}</span>
                                <span className="product-id">{product.brand || `ID: ${product.id}`}</span>
                              </div>
                            </div>
                          </td>
                          <td><span className="category-badge">{product.category}</span></td>
                          <td className="price">{formatINR(product.price)}</td>
                          <td>
                            <span className={`stock-badge ${product.stock < 10 ? 'low' : 'ok'}`}>
                              {product.stock} units
                            </span>
                          </td>
                          <td>
                            <div className="rating">
                              <span className="star">⭐</span>
                              <span>{product.rating?.toFixed(1) || 'N/A'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="action-btn edit" title="Edit" onClick={() => openEditProductModal(product)}>
                                <Edit size={16} />
                              </button>
                              <button className="action-btn delete" title="Delete" onClick={() => confirmDeleteProduct(product)}>
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state large">
                  <Package size={64} />
                  <h3>No Products Found</h3>
                  <p>Start by adding your first product</p>
                  <button className="btn btn-primary" onClick={openAddProductModal}>
                    <Plus size={18} /> Add Product
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== ORDERS ==================== */}
          {activeTab === 'orders' && (
            <div className="section">
              <div className="section-header">
                <div className="section-title">
                  <h2>Order Management</h2>
                  <span className="subtitle">{filteredOrders.length} total orders</span>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading orders...</p>
                </div>
              ) : filteredOrders.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(order => (
                        <tr key={order.id}>
                          <td className="order-id">#{order.id}</td>
                          <td>
                            <div className="customer-cell">
                              <div className="customer-avatar">
                                {(order.customerName || 'C').charAt(0)}
                              </div>
                              <span>{order.customerName || order.user?.firstName || 'Customer'}</span>
                            </div>
                          </td>
                          <td className="date">
                            <Calendar size={14} />
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="price">{formatINR(order.totalAmount)}</td>
                          <td>
                            <select
                              className={`status-select ${getStatusColor(order.status)}`}
                              value={order.status || 'PLACED'}
                              onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                            >
                              {orderStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="action-btn view" title="View Details" onClick={() => openOrderModal(order)}>
                                <Eye size={16} />
                              </button>
                              <button className="action-btn invoice" title="Download Invoice" onClick={() => generateInvoicePDF(order)}>
                                <FileText size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state large">
                  <ShoppingCart size={64} />
                  <h3>No Orders Yet</h3>
                  <p>Orders will appear here when customers make purchases</p>
                </div>
              )}
            </div>
          )}

          {/* ==================== USERS ==================== */}
          {activeTab === 'users' && (
            <div className="section">
              <div className="section-header">
                <div className="section-title">
                  <h2>Customer Management</h2>
                  <span className="subtitle">{filteredUsers.length} registered users</span>
                </div>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map(u => (
                        <tr key={u.id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar-sm">
                                {(u.firstName || 'U').charAt(0)}
                              </div>
                              <span>{u.firstName} {u.lastName}</span>
                            </div>
                          </td>
                          <td className="email">{u.email}</td>
                          <td>
                            <span className={`role-badge ${u.role?.toLowerCase()}`}>
                              {u.role}
                            </span>
                          </td>
                          <td>
                            <button
                              className={`status-toggle ${u.active ? 'active' : 'inactive'}`}
                              onClick={() => handleToggleUserStatus(u.id, u.active)}
                            >
                              {u.active ? <Check size={14} /> : <XCircle size={14} />}
                              {u.active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button className="action-btn view" title="View Profile" onClick={() => openUserModal(u)}>
                                <Eye size={16} />
                              </button>
                              <button className="action-btn edit" title="Edit User" onClick={() => openUserModal(u)}>
                                <Edit size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state large">
                  <Users size={64} />
                  <h3>No Users Found</h3>
                  <p>Users will appear here when they register</p>
                </div>
              )}
            </div>
          )}

          {/* ==================== COUPONS ==================== */}
          {activeTab === 'coupons' && (
            <div className="section">
              <div className="section-header">
                <div className="section-title">
                  <h2>Discount Coupons</h2>
                  <span className="subtitle">{coupons.length} total coupons</span>
                </div>
                <button
                  onClick={openAddCouponModal}
                  className="btn btn-primary"
                >
                  <Plus size={18} />
                  Add Coupon
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading coupons...</p>
                </div>
              ) : coupons.length > 0 ? (
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Description</th>
                        <th>Discount</th>
                        <th>Usage</th>
                        <th>Valid Period</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map(coupon => {
                        const isExpired = new Date(coupon.validUntil) < new Date();
                        const isUsedUp = coupon.usedCount >= coupon.usageLimit;
                        const isActive = coupon.active && !isExpired && !isUsedUp;

                        return (
                          <tr key={coupon.id} className={!isActive ? 'inactive-row' : ''}>
                            <td>
                              <span className="coupon-code">{coupon.code}</span>
                            </td>
                            <td className="description-cell">{coupon.description}</td>
                            <td>
                              <span className="discount-badge">
                                {coupon.discountType === 'PERCENTAGE'
                                  ? `${coupon.discountValue}% OFF`
                                  : `₹${coupon.discountValue} OFF`
                                }
                              </span>
                            </td>
                            <td>
                              <div className="usage-info">
                                <span className={`usage-count ${isUsedUp ? 'used-up' : ''}`}>
                                  {coupon.usedCount}/{coupon.usageLimit}
                                </span>
                                {coupon.remainingUses > 0 && (
                                  <span className="remaining">{coupon.remainingUses} left</span>
                                )}
                              </div>
                            </td>
                            <td className="date-cell">
                              <div className="date-range">
                                <span>{new Date(coupon.validFrom).toLocaleDateString('en-IN')}</span>
                                <span>to</span>
                                <span className={isExpired ? 'expired' : ''}>
                                  {new Date(coupon.validUntil).toLocaleDateString('en-IN')}
                                </span>
                              </div>
                            </td>
                            <td>
                              <button
                                className={`status-toggle ${isActive ? 'active' : 'inactive'}`}
                                onClick={() => handleToggleCouponStatus(coupon.id)}
                                disabled={isExpired || isUsedUp}
                              >
                                {isExpired ? (
                                  <>
                                    <XCircle size={14} />
                                    Expired
                                  </>
                                ) : isUsedUp ? (
                                  <>
                                    <XCircle size={14} />
                                    Used Up
                                  </>
                                ) : coupon.active ? (
                                  <>
                                    <Check size={14} />
                                    Active
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={14} />
                                    Inactive
                                  </>
                                )}
                              </button>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button
                                  className="action-btn edit"
                                  title="Edit Coupon"
                                  onClick={() => openEditCouponModal(coupon)}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="action-btn delete"
                                  title="Delete Coupon"
                                  onClick={() => confirmDeleteCoupon(coupon)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state">
                  <Package size={48} className="text-gray-300 mb-4 mx-auto" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Coupons Created</h3>
                  <p className="text-gray-500 mb-6">Create your first discount coupon to offer special deals to customers</p>
                  <button
                    onClick={openAddCouponModal}
                    className="btn btn-primary"
                  >
                    <Plus size={18} />
                    Create First Coupon
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ==================== SETTINGS ==================== */}
          {activeTab === 'settings' && (
            <div className="section settings-section">
              <div className="section-header">
                <div className="section-title">
                  <h2>Store Settings</h2>
                  <span className="subtitle">Manage your store configuration</span>
                </div>
              </div>

              <div className="settings-grid">
                <div className="settings-card">
                  <h3>🏪 General Settings</h3>
                  <div className="form-group">
                    <label>Store Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={settingsForm.storeName}
                      onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Store Email</label>
                    <input
                      type="email"
                      className="form-input"
                      value={settingsForm.storeEmail}
                      onChange={(e) => setSettingsForm({ ...settingsForm, storeEmail: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Support Phone</label>
                    <input
                      type="tel"
                      className="form-input"
                      value={settingsForm.supportPhone}
                      onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-card">
                  <h3>💳 Payment Settings</h3>
                  <div className="form-group">
                    <label>Currency</label>
                    <select
                      className="form-input"
                      value={settingsForm.currency}
                      onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tax Rate (%)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={settingsForm.taxRate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, taxRate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="settings-card">
                  <h3>📦 Shipping Settings</h3>
                  <div className="form-group">
                    <label>Free Shipping Threshold ($)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={settingsForm.freeShippingThreshold}
                      onChange={(e) => setSettingsForm({ ...settingsForm, freeShippingThreshold: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Default Shipping Cost ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      value={settingsForm.defaultShippingCost}
                      onChange={(e) => setSettingsForm({ ...settingsForm, defaultShippingCost: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="settings-actions">
                <button className="btn btn-secondary" onClick={() => {
                  const savedSettings = localStorage.getItem('storeSettings');
                  if (savedSettings) setSettingsForm(JSON.parse(savedSettings));
                }}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleSaveSettings}>
                  <Save size={18} />
                  Save Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </main >

      {/* ==================== PRODUCT MODAL ==================== */}
      {
        showProductModal && (
          <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'add' ? '➕ Add New Product' : '✏️ Edit Product'}</h2>
                <button className="modal-close" onClick={() => setShowProductModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleProductSubmit} className="modal-form">
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Product Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Brand</label>
                      <input
                        type="text"
                        className="form-input"
                        value={productForm.brand}
                        onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="product-description">Description</label>
                    <textarea
                      id="product-description"
                      name="description"
                      className="form-input"
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    />
                  </div>

                  {/* Product Variants Section */}
                  <div className="form-group">

                    <div className="variants-container" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {productVariants.map((variant, index) => (
                        <div key={variant.id} className="variant-item" style={{
                          border: productVariants.length > 1 ? '1px solid #ddd' : 'none',
                          borderRadius: '8px',
                          padding: productVariants.length > 1 ? '16px' : '0',
                          backgroundColor: productVariants.length > 1 ? '#f9f9f9' : 'transparent'
                        }}>
                          {productVariants.length > 1 && (
                            <div className="flex items-center justify-between mb-2">
                              <span style={{ fontWeight: '600', color: '#333' }}>Variant {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeVariant(variant.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: '#dc3545',
                                  cursor: 'pointer',
                                  padding: '4px'
                                }}
                                title="Remove variant"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Size (ml)</label>
                              <input
                                type="number"
                                className="form-input"
                                value={variant.size}
                                onChange={(e) => updateVariant(variant.id, 'size', parseInt(e.target.value) || 0)}
                                min="1"
                                required
                                style={{ width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Price (₹)</label>
                              <input
                                type="number"
                                step="0.01"
                                className="form-input"
                                value={variant.price}
                                onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                                min="0"
                                required
                                style={{ width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '13px', marginBottom: '4px', display: 'block' }}>Stock</label>
                              <input
                                type="number"
                                className="form-input"
                                value={variant.stock}
                                onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)}
                                min="0"
                                required
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="btn-link mt-2"
                      onClick={addVariant}
                      style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Plus size={14} />
                      Add another size
                    </button>
                    <p style={{ fontSize: '13px', color: '#666', marginTop: '8px' }}>
                      Add different sizes for this product. Each size can have its own price and stock level.
                    </p>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category *</label>
                      <select
                        className="form-input"
                        value={productForm.category}
                        onChange={(e) => {
                          const newCategory = e.target.value;
                          let defaultSize = '30ml'; // perfume default
                          if (newCategory === 'attar') defaultSize = '6ml';
                          else if (newCategory === 'aroma chemicals') defaultSize = '50ml';
                          setProductForm({ ...productForm, category: newCategory, size: defaultSize });
                        }}
                        required
                      >
                        {categories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        className="form-input"
                        value={productForm.type}
                        onChange={(e) => setProductForm({ ...productForm, type: e.target.value })}
                      >
                        <option value="Eau de Parfum">Eau de Parfum</option>
                        <option value="Eau de Toilette">Eau de Toilette</option>
                        <option value="Eau de Cologne">Eau de Cologne</option>
                        <option value="Parfum">Parfum</option>
                        <option value="Eau Fraiche">Eau Fraiche</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Status</label>
                      <select
                        className="form-input"
                        value={productForm.active ? 'active' : 'inactive'}
                        onChange={(e) => setProductForm({ ...productForm, active: e.target.value === 'active' })}
                      >
                        <option value="active">✓ Active</option>
                        <option value="inactive">✗ Inactive</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Product Image</label>

                    {/* Upload Method Toggle */}
                    <div className="upload-toggle">
                      <button
                        type="button"
                        className={`toggle-btn ${uploadMethod === 'upload' ? 'active' : ''}`}
                        onClick={() => setUploadMethod('upload')}
                      >
                        <Upload size={16} />
                        Upload Image
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${uploadMethod === 'url' ? 'active' : ''}`}
                        onClick={() => setUploadMethod('url')}
                      >
                        <ImageIcon size={16} />
                        Image URL
                      </button>
                    </div>

                    {uploadMethod === 'upload' ? (
                      <div className="image-upload-area">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="file-input-hidden"
                          id="product-image-upload"
                        />
                        {!imagePreview && !productForm.imageUrl ? (
                          <label htmlFor="product-image-upload" className="upload-dropzone">
                            <Upload size={40} />
                            <span className="upload-text">Click to upload image</span>
                            <span className="upload-hint">PNG, JPG, WEBP up to 5MB</span>
                          </label>
                        ) : (
                          <div className="uploaded-image-preview">
                            <img
                              src={imagePreview || productForm.imageUrl}
                              alt="Preview"
                            />
                            <div className="image-overlay">
                              <button type="button" className="remove-image-btn" onClick={removeImage}>
                                <XCircle size={20} />
                                Remove
                              </button>
                              <label htmlFor="product-image-upload" className="change-image-btn">
                                <RefreshCw size={20} />
                                Change
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="https://example.com/image.jpg"
                          value={productForm.imageUrl}
                          onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                        />
                        {productForm.imageUrl && (
                          <div className="image-preview">
                            <img
                              src={productForm.imageUrl}
                              alt="Preview"
                              onError={(e) => e.target.style.display = 'none'}
                              onLoad={(e) => e.target.style.display = 'block'}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowProductModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (modalMode === 'add' ? 'Create Product' : 'Update Product')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* ==================== ORDER MODAL ==================== */}
      {
        showOrderModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowOrderModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📦 Order #{selectedItem.id}</h2>
                <button className="modal-close" onClick={() => setShowOrderModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="order-details">
                  <div className="detail-row">
                    <span className="label">Customer:</span>
                    <span className="value">
                      {selectedItem.customerName ||
                        (selectedItem.user ? `${selectedItem.user.firstName} ${selectedItem.user.lastName || ''}` : 'N/A')}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">
                      {selectedItem.customerEmail || selectedItem.user?.email || 'N/A'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Ship To:</span>
                    <span className="value">
                      {selectedItem.shippingRecipientName ||
                        selectedItem.customerName ||
                        (selectedItem.user ? `${selectedItem.user.firstName} ${selectedItem.user.lastName || ''}` : 'N/A')}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Date:</span>
                    <span className="value">{selectedItem.createdAt ? new Date(selectedItem.createdAt).toLocaleString() : 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Total:</span>
                    <span className="value price">{formatINR(selectedItem.totalAmount)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <select
                      className={`status-select ${getStatusColor(selectedItem.status)}`}
                      value={selectedItem.status || 'PENDING'}
                      onChange={(e) => handleUpdateOrderStatus(selectedItem.id, e.target.value)}
                    >
                      {orderStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>
                  {selectedItem.shippingAddress && (
                    <div className="detail-row" style={{ alignItems: 'flex-start' }}>
                      <span className="label">Shipping:</span>
                      <span className="value">
                        {selectedItem.shippingAddress}<br />
                        {selectedItem.shippingCity}, {selectedItem.shippingCountry} - {selectedItem.shippingZipCode}<br />
                        {selectedItem.shippingPhone && (
                          <span className="text-muted-foreground text-sm block mt-1">
                            Phone: {selectedItem.shippingPhone}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                {selectedItem.items && selectedItem.items.length > 0 && (
                  <div className="order-items">
                    <h4>Order Items</h4>
                    <table className="mini-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Qty</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.productName || item.product?.name || 'Product'}</td>
                            <td>{item.quantity}</td>
                            <td>{formatINR(item.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>
                  Close
                </button>
                <button className="invoice-download-btn" onClick={() => generateInvoicePDF(selectedItem)}>
                  <Download size={18} />
                  Download Invoice
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ==================== USER MODAL ==================== */}
      {
        showUserModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>👤 User Details</h2>
                <button className="modal-close" onClick={() => setShowUserModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="user-profile-card">
                  <div className="profile-avatar">
                    {(selectedItem.firstName || 'U').charAt(0)}
                  </div>
                  <div className="profile-info">
                    <h3>{selectedItem.firstName} {selectedItem.lastName}</h3>
                    <p>{selectedItem.email}</p>
                  </div>
                </div>

                <div className="order-details">
                  <div className="detail-row">
                    <span className="label">User ID:</span>
                    <span className="value">#{selectedItem.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Phone:</span>
                    <span className="value">{selectedItem.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Address:</span>
                    <span className="value">{selectedItem.address || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">City:</span>
                    <span className="value">{selectedItem.city || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Role:</span>
                    <select
                      className="form-input"
                      value={selectedItem.role || 'CUSTOMER'}
                      onChange={(e) => handleChangeUserRole(selectedItem.id, e.target.value)}
                    >
                      <option value="CUSTOMER">CUSTOMER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div className="detail-row">
                    <span className="label">Status:</span>
                    <button
                      className={`status-toggle ${selectedItem.active ? 'active' : 'inactive'}`}
                      onClick={() => {
                        handleToggleUserStatus(selectedItem.id, selectedItem.active);
                        setSelectedItem({ ...selectedItem, active: !selectedItem.active });
                      }}
                    >
                      {selectedItem.active ? <Check size={14} /> : <XCircle size={14} />}
                      {selectedItem.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowUserModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* ==================== COUPON MODAL ==================== */}
      {
        showCouponModal && (
          <div className="modal-overlay" onClick={() => setShowCouponModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{modalMode === 'add' ? '➕ Create Discount Coupon' : '✏️ Edit Coupon'}</h2>
                <button className="modal-close" onClick={() => setShowCouponModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCouponSubmit} className="modal-form">
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Coupon Code *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={couponForm.code}
                        onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g., WELCOME10"
                        pattern="[A-Z0-9_\\-]+"
                        title="Only uppercase letters, numbers, hyphens, and underscores"
                        required
                        style={{ textTransform: 'uppercase' }}
                      />
                      <small className="form-hint">Uppercase letters, numbers, - and _ only</small>
                    </div>
                    <div className="form-group">
                      <label>Total Usage Limit</label>
                      <input
                        type="number"
                        className="form-input"
                        value={couponForm.usageLimit}
                        onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value })}
                        min="1"
                        required
                      />
                      <small className="form-text text-muted">Total number of times this coupon can be used by all users combined.</small>
                    </div>
                    <div className="form-group">
                      <label>Limit Per User</label>
                      <input
                        type="number"
                        className="form-input"
                        value={couponForm.usageLimitPerUser}
                        onChange={(e) => setCouponForm({ ...couponForm, usageLimitPerUser: e.target.value })}
                        min="1"
                        placeholder="e.g. 1"
                      />
                      <small className="form-text text-muted">Max uses per single customer account.</small>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description *</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      value={couponForm.description}
                      onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                      placeholder="e.g., 10% off for new customers"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Discount Type *</label>
                      <select
                        className="form-input"
                        value={couponForm.discountType}
                        onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                        required
                      >
                        <option value="PERCENTAGE">Percentage (%)</option>
                        <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>
                        Discount Value *
                        {couponForm.discountType === 'PERCENTAGE' ? ' (%)' : ' (₹)'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={couponForm.discountType === 'PERCENTAGE' ? '100' : undefined}
                        className="form-input"
                        value={couponForm.discountValue}
                        onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Min Order Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        value={couponForm.minOrderAmount}
                        onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                        placeholder="Optional"
                      />
                      <small className="form-hint">Leave empty for no minimum</small>
                    </div>
                    <div className="form-group">
                      <label>Max Discount Amount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        value={couponForm.maxDiscountAmount}
                        onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })}
                        placeholder="Optional"
                      />
                      <small className="form-hint">Leave empty for no cap</small>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Valid From *</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={couponForm.validFrom}
                        onChange={(e) => setCouponForm({ ...couponForm, validFrom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Valid Until *</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={couponForm.validUntil}
                        onChange={(e) => setCouponForm({ ...couponForm, validUntil: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={couponForm.active}
                        onChange={(e) => setCouponForm({ ...couponForm, active: e.target.checked })}
                      />
                      <span>Active (coupon can be used)</span>
                    </label>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={() => setShowCouponModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Saving...' : (modalMode === 'add' ? 'Create Coupon' : 'Update Coupon')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
      }

      {/* ==================== DELETE CONFIRMATION ==================== */}
      {
        showDeleteConfirm && (
          <div className="confirm-modal" onClick={() => setShowDeleteConfirm(false)}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="icon-danger">
                <AlertCircle size={32} />
              </div>
              <h3>Delete {selectedItem?.code ? 'Coupon' : 'Product'}?</h3>
              <p>
                Are you sure you want to delete <strong>"{selectedItem?.name || selectedItem?.code}"</strong>?
                This action cannot be undone.
              </p>
              <div className="confirm-actions">
                <button className="btn-cancel" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button
                  className="btn-danger"
                  onClick={selectedItem?.code ? handleDeleteCoupon : handleDeleteProduct}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
