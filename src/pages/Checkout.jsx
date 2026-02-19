import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { CreditCard, Lock, MapPin, ShoppingBag, AlertCircle, CheckCircle2, Package, Tag, X } from 'lucide-react';
import api from '../api/axios';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { LoadingSpinner } from '../components/ui/spinner';
import { Alert, AlertDescription } from '../components/ui/alert';

/**
 * Razorpay payment form component
 * Integrates Razorpay payment gateway for secure checkout
 * Supports demo mode for testing without real Razorpay credentials
 */
function RazorpayPaymentForm({ razorpayOrderResponse, onPaymentSuccess }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { clearCart } = useCartStore();

  // Check if we're in demo mode
  const isDemoMode = razorpayOrderResponse.razorpayKeyId === 'rzp_test_demo_mode';

  useEffect(() => {
    // Only load Razorpay script if not in demo mode
    if (!isDemoMode) {
      console.log('📥 Loading Razorpay script from CDN...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        console.log('✅ Razorpay script loaded successfully');
        console.log('window.Razorpay available:', typeof window.Razorpay !== 'undefined');
      };

      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script from CDN');
        toast.error('Failed to load payment gateway. Please try again.');
      };

      document.body.appendChild(script);

      return () => {
        console.log('🧹 Cleaning up Razorpay script');
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      };
    } else {
      console.log('🧪 DEMO MODE: Skipping Razorpay script load, using local demo payment form');
    }
  }, [isDemoMode]);

  // Demo mode payment handler - simulates successful payment
  const handleDemoPayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      // In demo mode, directly confirm the order
      await api.post('/orders/verify-payment', {
        razorpayOrderId: razorpayOrderResponse.razorpayOrderId,
        razorpayPaymentId: 'demo_payment_' + Date.now(),
        razorpaySignature: 'demo_signature',
      });

      toast.success('Demo payment successful! Your order is confirmed.');
      clearCart();

      // Navigate to order details page
      setTimeout(() => {
        navigate(`/orders/${razorpayOrderResponse.orderId}`);
      }, 1500);

    } catch (error) {
      console.error('Demo payment failed:', error);
      toast.error('Demo payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('💳 RAZORPAY PAYMENT INITIATED');
      console.log('razorpayOrderResponse:', razorpayOrderResponse);
      console.log('Razorpay Key ID:', razorpayOrderResponse.razorpayKeyId);
      console.log('Amount (paise):', razorpayOrderResponse.amount);
      console.log('window.Razorpay exists?', typeof window.Razorpay !== 'undefined');

      const options = {
        key: razorpayOrderResponse.razorpayKeyId, // Razorpay Public Key
        amount: razorpayOrderResponse.amount, // Amount in paise
        currency: razorpayOrderResponse.currency,
        order_id: razorpayOrderResponse.razorpayOrderId, // Razorpay Order ID
        name: 'Perfume Shop',
        description: `Order #${razorpayOrderResponse.orderNumber}`,

        // Customer details
        prefill: {
          name: razorpayOrderResponse.customerName || '',
          email: razorpayOrderResponse.customerEmail || '',
          contact: razorpayOrderResponse.customerPhone || '',
        },

        // Callback handlers
        handler: async function (response) {
          console.log('✅ PAYMENT SUCCESS - Response:', response);
          // Payment successful, now verify signature on backend
          try {
            setLoading(true);
            toast.info('Verifying payment...');

            const verificationResult = await api.post('/orders/verify-payment', {
              razorpayOrderId: options.order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            console.log('✅ PAYMENT VERIFIED:', verificationResult.data);
            toast.success('Payment successful! Your order is confirmed.');

            // Navigate to order details page
            setTimeout(() => {
              navigate(`/orders/${razorpayOrderResponse.orderId}`);
            }, 1500);

          } catch (error) {
            console.error('❌ Payment verification failed:', error);

            // Check if it's a network error or server error
            if (error.code === 'NETWORK_ERROR' || !error.response) {
              toast.warning('Payment completed but verification is pending. Please check your order status.');

              // Still navigate to order page - webhook might process it
              setTimeout(() => {
                navigate(`/orders/${razorpayOrderResponse.orderId}`);
              }, 2000);
            } else {
              toast.error('Payment verification failed. Please contact support with payment ID: ' + response.razorpay_payment_id);
            }
          } finally {
            setLoading(false);
          }
        },

        // Error handler for payment failures
        modal: {
          ondismiss: function () {
            console.warn('⚠️  PAYMENT CANCELLED by user');
            setLoading(false);
            toast.error('Payment cancelled. Order remains pending.');
          },
          escape: true,
          animation: true,
          backdropclose: false,
          confirm_close: true,
          handleback: true
        },
      };

      console.log('📋 RAZORPAY OPTIONS:', options);
      console.log('🔍 Checking window.Razorpay:', window.Razorpay);

      // Open Razorpay checkout modal
      if (window.Razorpay) {
        console.log('✓ Razorpay SDK loaded, opening modal...');
        const razorpay = new window.Razorpay(options);
        console.log('🎯 Calling razorpay.open()...');
        razorpay.open();
        console.log('✓ razorpay.open() called successfully');
      } else {
        console.error('❌ window.Razorpay is NOT defined! Script did not load.');
        throw new Error('Razorpay SDK not loaded');
      }

    } catch (error) {
      console.error('❌ Payment initiation error:', error);
      console.error('Error stack:', error.stack);
      toast.error('Failed to initiate payment. Check console for details: ' + error.message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={isDemoMode ? handleDemoPayment : handlePayment} className="space-y-6">
      {/* Demo Mode Alert - PROMINENT */}
      {isDemoMode && (
        <Alert className="border-2 border-amber-500 bg-gradient-to-r from-amber-50 to-yellow-50 shadow-lg">
          <AlertCircle className="h-5 w-5 text-amber-700 animate-pulse" />
          <AlertDescription className="ml-2">
            <p className="font-bold text-lg text-amber-900">🧪 DEMO MODE - SIMULATED PAYMENT</p>
            <p className="text-sm text-amber-800 mt-2 font-medium">
              ✓ No real payment will be processed
            </p>
            <p className="text-sm text-amber-800 font-medium">
              ✓ This simulates a successful transaction for testing
            </p>
            <p className="text-sm text-amber-800 mt-2 font-medium">
              👇 Click the "Complete Demo Payment" button below to continue
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Amount Summary */}
      <Card className="border-2 border-primary/30 bg-primary/5 shadow-md">
        <CardContent className="p-4 sm:p-6 space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-border">
            <span className="text-sm text-muted-foreground font-medium">Total Amount</span>
            <span className="text-3xl font-bold text-foreground">
              ₹{(razorpayOrderResponse.amount / 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Order Number</span>
            <span className="font-mono text-foreground font-medium">
              {razorpayOrderResponse.orderNumber || razorpayOrderResponse.razorpayOrderId}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Button - LARGE & PROMINENT */}
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 sm:h-16 text-lg sm:text-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
        size="lg"
      >
        {loading ? (
          <>
            <div className="h-5 w-5 mr-3 border-3 border-white border-t-transparent rounded-full animate-spin" />
            Processing Demo Payment...
          </>
        ) : (
          <>
            <Lock className="h-6 w-6 mr-3" />
            {isDemoMode ? '✓ COMPLETE DEMO PAYMENT' : 'Pay Securely with Razorpay'}
          </>
        )}
      </Button>

      {/* Security Info */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground font-medium bg-muted/50 p-3 rounded-lg">
        <CheckCircle2 className="h-5 w-5 text-green-600" />
        <span>
          {isDemoMode
            ? '✓ Demo mode - No actual payment required'
            : '✓ SSL Encrypted & Secured by Razorpay'}
        </span>
      </div>
    </form>
  );
}

/**
 * Main Checkout Page Component
 * Handles shipping information and payment flow
 */
export default function Checkout() {
  const navigate = useNavigate();
  const { cart, setCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [cartLoading, setCartLoading] = useState(true);
  const [razorpayOrderResponse, setRazorpayOrderResponse] = useState(null);
  const [errors, setErrors] = useState({});
  const [shippingInfo, setShippingInfo] = useState({
    recipientName: '',
    shippingAddress: '',
    shippingCity: '',
    shippingCountry: 'India',
    shippingZipCode: '',
    shippingPhone: ''
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [discount, setDiscount] = useState(0);

  // Fetch cart on mount to ensure we have the latest data
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const { data } = await api.get('/cart');
        setCart(data);
      } catch (error) {
        toast.error('Failed to load cart. Please try again.');
      }
    };

    // Load user profile to pre-fill shipping info
    const fetchUserProfile = async () => {
      try {
        const { data } = await api.get('/users/profile');
        // Pre-fill shipping with user's saved profile
        setShippingInfo(prev => ({
          ...prev,
          recipientName: (data.firstName || '') + (data.lastName ? ' ' + data.lastName : ''),
          shippingAddress: data.address || '',
          shippingCity: data.city || '',
          shippingCountry: data.country || 'India',
          shippingZipCode: data.zipCode || '',
          shippingPhone: data.phoneNumber || ''
        }));
      } catch (error) {
        console.log('Could not load profile for pre-fill:', error);
        // If profile fails, continue with empty form
      } finally {
        setCartLoading(false);
      }
    };

    fetchCart();
    fetchUserProfile();
  }, [setCart]);

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!shippingInfo.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }

    if (!shippingInfo.shippingAddress.trim()) {
      newErrors.shippingAddress = 'Address is required';
    } else if (shippingInfo.shippingAddress.trim().length < 10) {
      newErrors.shippingAddress = 'Please enter a complete address';
    }

    if (!shippingInfo.shippingCity.trim()) {
      newErrors.shippingCity = 'City is required';
    }

    if (!shippingInfo.shippingCountry.trim()) {
      newErrors.shippingCountry = 'Country is required';
    }

    if (!shippingInfo.shippingZipCode.trim()) {
      newErrors.shippingZipCode = 'Zip code is required';
    } else if (!/^\d{5,6}$/.test(shippingInfo.shippingZipCode.trim())) {
      newErrors.shippingZipCode = 'Please enter a valid zip code';
    }

    if (!shippingInfo.shippingPhone.trim()) {
      newErrors.shippingPhone = 'Phone number is required';
    } else if (!/^\+?[\d\s-]{10,}$/.test(shippingInfo.shippingPhone.trim())) {
      newErrors.shippingPhone = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Apply coupon code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', {
        code: couponCode.trim(),
        orderAmount: cart?.subtotal || 0
      });

      if (data.valid) {
        setAppliedCoupon(data);
        setDiscount(data.discountAmount);
        toast.success(`Coupon applied! You saved ₹${data.discountAmount.toFixed(2)}`);
      } else {
        toast.error(data.message || 'Invalid coupon code');
      }
    } catch (error) {
      console.error('Coupon validation error:', error);
      toast.error(error.response?.data?.message || 'Failed to apply coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  // Remove applied coupon
  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setDiscount(0);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  // Calculate final total with discount
  const finalTotal = () => {
    const baseTotal = cart?.total || 0;
    return Math.max(0, baseTotal - discount);
  };

  // Show loading while cart is being fetched
  if (cartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner text="Loading your cart..." />
        </div>
      </div>
    );
  }

  // Redirect if cart is empty (after loading is complete)
  if (!cart || !cart.items || cart.items.length === 0) {
    navigate('/cart');
    return null;
  }

  /**
   * Handle shipping information submission
   * Creates order on backend and initializes Razorpay order
   */
  const handleShippingSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    console.log('Submitting shipping info:', shippingInfo);
    setLoading(true);
    setErrors({});

    try {
      // Create order on backend (stock validation, price locking)
      console.log('Calling /orders/checkout API...');
      const checkoutPayload = {
        ...shippingInfo,
        couponCode: appliedCoupon?.coupon?.code || null
      };
      const { data } = await api.post('/orders/checkout', checkoutPayload);
      console.log('Checkout response:', data);

      // Set Razorpay order response for payment form
      setRazorpayOrderResponse(data);

      toast.success('Order created successfully! Proceed to payment.');
    } catch (error) {
      console.error('Order creation error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);

      // Handle specific error cases
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error;
        if (errorMsg?.toLowerCase().includes('stock')) {
          toast.error('Some items in your cart are out of stock. Please update your cart.');
          setTimeout(() => navigate('/cart'), 2000);
        } else {
          toast.error(errorMsg || 'Please check your information and try again.');
        }
      } else if (error.response?.status === 401) {
        toast.error('Please login to continue with checkout.');
        setTimeout(() => navigate('/login'), 1500);
      } else if (error.response?.status === 500) {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Server error occurred';
        toast.error(`Server error: ${errorMsg}`);
        console.error('Server returned 500:', error.response?.data);
      } else if (!error.response) {
        toast.error('Network error. Please check your connection and try again.');
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to create order';
        toast.error(`${errorMsg}. Please try again.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Callback when payment is verified
    toast.success('Order confirmed!');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Progress Indicator */}
      <div className="bg-muted/30 border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${!razorpayOrderResponse ? 'bg-primary text-primary-foreground' : 'bg-primary/20 text-primary'
                }`}>
                {!razorpayOrderResponse ? '1' : <CheckCircle2 className="h-4 w-4" />}
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Shipping</span>
            </div>
            <div className="h-0.5 w-8 sm:w-16 bg-border" />
            <div className="flex items-center gap-2">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium ${razorpayOrderResponse ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-medium hidden sm:inline">Payment</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            Secure Checkout
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {!razorpayOrderResponse
              ? 'Enter your shipping details to continue'
              : 'Complete your payment to confirm order'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {!razorpayOrderResponse ? (
              // Shipping Information Form
              <Card>
                <CardHeader className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg sm:text-xl">Shipping Information</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        We'll deliver your order to this address
                      </CardDescription>
                    </div>
                  </div>
                  <Alert className="mt-4 border-blue-200 bg-blue-50">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="text-xs sm:text-sm text-blue-900">
                        <p className="font-semibold">💡 Tip: Save your default address</p>
                        <p className="text-blue-800 mt-1">
                          Go to your <Link to="/profile" className="font-semibold hover:underline">Profile</Link> to save your address and phone number. Next time, they'll auto-fill here!
                        </p>
                      </div>
                    </div>
                  </Alert>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className="space-y-5">
                    {/* Recipient Name Field */}
                    <div className="space-y-2">
                      <Label htmlFor="recipient-name" className="text-sm font-medium">
                        Recipient Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="recipient-name"
                        type="text"
                        required
                        value={shippingInfo.recipientName}
                        onChange={(e) => {
                          setShippingInfo({ ...shippingInfo, recipientName: e.target.value });
                          if (errors.recipientName) setErrors({ ...errors, recipientName: '' });
                        }}
                        placeholder="Full name of person receiving the package"
                        className={errors.recipientName ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      {errors.recipientName && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.recipientName}
                        </p>
                      )}
                    </div>

                    {/* Address Field */}
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-sm font-medium">
                        Street Address <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        required
                        value={shippingInfo.shippingAddress}
                        onChange={(e) => {
                          setShippingInfo({ ...shippingInfo, shippingAddress: e.target.value });
                          if (errors.shippingAddress) setErrors({ ...errors, shippingAddress: '' });
                        }}
                        placeholder="House number, street name, apartment"
                        className={errors.shippingAddress ? 'border-destructive focus-visible:ring-destructive' : ''}
                      />
                      {errors.shippingAddress && (
                        <p className="text-xs text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.shippingAddress}
                        </p>
                      )}
                    </div>

                    {/* City and Country */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-sm font-medium">
                          City <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="city"
                          type="text"
                          required
                          value={shippingInfo.shippingCity}
                          onChange={(e) => {
                            setShippingInfo({ ...shippingInfo, shippingCity: e.target.value });
                            if (errors.shippingCity) setErrors({ ...errors, shippingCity: '' });
                          }}
                          placeholder="e.g., Mumbai"
                          className={errors.shippingCity ? 'border-destructive' : ''}
                        />
                        {errors.shippingCity && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.shippingCity}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country" className="text-sm font-medium">
                          Country <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="country"
                          type="text"
                          required
                          value={shippingInfo.shippingCountry}
                          onChange={(e) => {
                            setShippingInfo({ ...shippingInfo, shippingCountry: e.target.value });
                            if (errors.shippingCountry) setErrors({ ...errors, shippingCountry: '' });
                          }}
                          placeholder="e.g., India"
                          className={errors.shippingCountry ? 'border-destructive' : ''}
                        />
                        {errors.shippingCountry && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.shippingCountry}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Zip Code and Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zipcode" className="text-sm font-medium">
                          Zip Code <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="zipcode"
                          type="text"
                          required
                          value={shippingInfo.shippingZipCode}
                          onChange={(e) => {
                            setShippingInfo({ ...shippingInfo, shippingZipCode: e.target.value });
                            if (errors.shippingZipCode) setErrors({ ...errors, shippingZipCode: '' });
                          }}
                          placeholder="e.g., 400001"
                          maxLength="6"
                          className={errors.shippingZipCode ? 'border-destructive' : ''}
                        />
                        {errors.shippingZipCode && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.shippingZipCode}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-medium">
                          Phone Number <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={shippingInfo.shippingPhone}
                          onChange={(e) => {
                            setShippingInfo({ ...shippingInfo, shippingPhone: e.target.value });
                            if (errors.shippingPhone) setErrors({ ...errors, shippingPhone: '' });
                          }}
                          placeholder="+91 98765 43210"
                          className={errors.shippingPhone ? 'border-destructive' : ''}
                        />
                        {errors.shippingPhone && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.shippingPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 sm:h-12 text-base font-semibold"
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <div className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Validating...
                          </>
                        ) : (
                          <>
                            Continue to Payment
                            <Lock className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            ) : (
              // Razorpay Payment Form
              <Card className="border-2 border-primary shadow-xl">
                <CardHeader className="space-y-1 bg-gradient-to-r from-primary/10 to-primary/5 border-b-2">
                  <div className="flex items-center gap-2">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl sm:text-3xl">⚡ Payment Details</CardTitle>
                      <CardDescription className="text-sm sm:text-base">
                        Complete your purchase securely - Demo Mode Active
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  {/* Shipping Address Summary */}
                  <div className="bg-muted/50 rounded-lg p-4 space-y-2 border-l-4 border-primary/50">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                      📍 Delivering to
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {shippingInfo.recipientName}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {shippingInfo.shippingAddress}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      {shippingInfo.shippingCity}, {shippingInfo.shippingCountry} - {shippingInfo.shippingZipCode}
                    </p>
                    <p className="text-sm text-muted-foreground font-medium">
                      📱 {shippingInfo.shippingPhone}
                    </p>
                  </div>

                  <RazorpayPaymentForm
                    razorpayOrderResponse={razorpayOrderResponse}
                    onPaymentSuccess={handlePaymentSuccess}
                  />

                  <Button
                    variant="outline"
                    onClick={() => setRazorpayOrderResponse(null)}
                    className="w-full text-base"
                  >
                    ← Change Shipping Address
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Cart Items */}
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart?.items?.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="h-16 w-16 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        {item.product?.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product?.name}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.product?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                        <p className="text-sm font-semibold text-foreground mt-1">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">₹{cart?.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax (18% GST)</span>
                    <span className="font-medium">₹{cart?.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium">₹{cart?.shippingCost?.toFixed(2) || '0.00'}</span>
                  </div>

                  {/* Discount Row */}
                  {discount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="font-medium">Discount</span>
                      <span className="font-medium">-₹{discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-base font-bold pt-2 border-t">
                    <span>Total</span>
                    <span className="text-lg">₹{razorpayOrderResponse ? (razorpayOrderResponse.amount / 100).toFixed(2) : finalTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Coupon Code Section */}
                <div className="border-t pt-4">
                  {!appliedCoupon ? (
                    <div className="space-y-2">
                      <Label htmlFor="coupon" className="text-sm font-medium flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Have a coupon code?
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="coupon"
                          type="text"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Enter code"
                          className="flex-1"
                          disabled={couponLoading || razorpayOrderResponse}
                          onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                        />
                        <Button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponCode.trim() || razorpayOrderResponse}
                          variant="secondary"
                          size="sm"
                        >
                          {couponLoading ? (
                            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            'Apply'
                          )}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag className="h-4 w-4 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-green-900 dark:text-green-100">
                              {appliedCoupon.couponCode}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              {appliedCoupon.message}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          onClick={handleRemoveCoupon}
                          disabled={razorpayOrderResponse}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Security Badge */}
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    <span>Secure checkout with SSL encryption</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
