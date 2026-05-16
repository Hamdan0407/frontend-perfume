import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from '../utils/toast';
import { Star, Minus, Plus, ShoppingCart, Package, Tag, ChevronDown, MapPin, Truck, TrendingUp } from 'lucide-react';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import StarRating from '../components/StarRating';
import StockBadge from '../components/StockBadge';
import RelatedProducts from '../components/RelatedProducts';
import { cn, formatCategory, sortVariants } from '../lib/utils';
import { useCartStore } from '../store/cartStore';

// Premium Skeleton Component for Luxury Feel
const ProductSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 animate-pulse">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
      <div className="lg:col-span-7 flex flex-col md:flex-row gap-6">
        <div className="hidden md:flex flex-col gap-4 w-24 shrink-0">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-square rounded-xl bg-slate-100" />
          ))}
        </div>
        <div className="flex-1 aspect-square rounded-3xl bg-slate-100 shadow-sm" />
      </div>
      <div className="lg:col-span-5 space-y-8">
        <div className="space-y-4">
          <div className="h-4 w-24 bg-slate-100 rounded-full" />
          <div className="h-10 w-full bg-slate-100 rounded-lg" />
          <div className="h-4 w-48 bg-slate-100 rounded-full" />
        </div>
        <div className="h-12 w-32 bg-slate-100 rounded-lg" />
        <div className="space-y-4">
          <div className="h-4 w-32 bg-slate-100 rounded-full" />
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 w-20 bg-slate-100 rounded-full" />
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-4 w-24 bg-slate-100 rounded-full" />
          <div className="flex gap-4">
            <div className="h-14 w-32 bg-slate-100 rounded-full" />
            <div className="h-14 flex-1 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { setCart } = useCartStore();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState('');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mergedVariants, setMergedVariants] = useState([]);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [totalReviews, setTotalReviews] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [reviewPage, setReviewPage] = useState(0);
  const [hasMoreReviews, setHasMoreReviews] = useState(false);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  // Delivery estimation states
  const [deliveryPincode, setDeliveryPincode] = useState('');
  const [checkingPincode, setCheckingPincode] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState(null); // { estimatedDays, city, state }
  const [deliveryError, setDeliveryError] = useState('');
  const [deliveryPercent] = useState(84);

  // Scroll to top on mount/route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    // Reset state and scroll to top
    window.scrollTo(0, 0);
    setReviews([]);
    setTotalReviews(0);
    setAverageRating(0);
    setReviewPage(0);
    setHasMoreReviews(false);
    
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProduct(),
        fetchReviews(0, false),
        isAuthenticated ? checkPurchaseStatus() : Promise.resolve()
      ]);
      setLoading(false);
    };

    loadData();

    return () => {
      const existingLink = document.getElementById('hero-image-preload');
      if (existingLink) existingLink.remove();
    };
  }, [id, isAuthenticated]);

  const checkPurchaseStatus = async () => {
    try {
      const { data } = await api.get('orders/my-orders');
      const purchased = data.some(order =>
        order.items.some(item => item.product.id === parseInt(id))
      );
      setHasPurchased(purchased);
    } catch (error) {
      console.error('Failed to check purchase status:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const { data } = await api.get(`products/${id}`);
      setProduct(data);
      setSelectedImage(data.imageUrl);

      // Preload the main hero image for LCP optimization
      const link = document.createElement('link');
      link.id = 'hero-image-preload';
      link.rel = 'preload';
      link.as = 'image';
      link.href = data.imageUrl;
      document.head.appendChild(link);

      // Fetch related products to merge variants
      try {
        const { data: relatedData } = await api.get(`products/search?query=${encodeURIComponent(data.name)}&brand=${encodeURIComponent(data.brand)}&size=50`);
        const relatedProducts = relatedData.content || relatedData || [];

        let allVariants = [];
        relatedProducts.forEach(p => {
          if (p.name && data.name && String(p.name).toLowerCase() === String(data.name).toLowerCase() &&
            ((!p.brand && !data.brand) || (p.brand && data.brand && String(p.brand).toLowerCase() === String(data.brand).toLowerCase()))) {
            
            if (p.variants && p.variants.length > 0) {
              p.variants.forEach(v => {
                if (!allVariants.find(ev => ev.size === v.size)) allVariants.push(v);
              });
            } else if (p.volume) {
              if (!allVariants.find(ev => ev.size === p.volume)) {
                allVariants.push({
                  id: `v_${p.id}`,
                  productId: p.id,
                  size: p.volume,
                  price: p.price,
                  discountPrice: p.discountPrice,
                  stock: p.stock,
                  active: p.active
                });
              }
            }
          }
        });

        const sortedVariants = sortVariants(allVariants);
        setMergedVariants(sortedVariants);
        const firstAvailable = sortedVariants.find(v => v.active && v.stock > 0) || sortedVariants[0];
        setSelectedVariant(firstAvailable);
      } catch (err) {
        if (data.variants && data.variants.length > 0) {
          const sortedV = sortVariants(data.variants);
          setSelectedVariant(sortedV.find(v => v.active && v.stock > 0) || sortedV[0]);
          setMergedVariants(sortedV);
        } else if (data.volume) {
          const virtualV = { id: `v_${data.id}`, productId: data.id, size: data.volume, price: data.price, discountPrice: data.discountPrice, stock: data.stock, active: data.active };
          setSelectedVariant(virtualV);
          setMergedVariants([virtualV]);
        }
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      if (error.response?.status === 404) {
        toast.error('Product not found');
        navigate('/products');
      }
    }
  };

  const fetchReviews = async (page = 0, append = false) => {
    try {
      if (page > 0) setLoadingMoreReviews(true);
      const { data } = await api.get(`products/${id}/reviews?page=${page}&size=10`);
      if (append) {
        setReviews(prev => [...prev, ...(data.reviews || [])]);
      } else {
        setReviews(data.reviews || []);
      }
      setTotalReviews(data.totalReviews || 0);
      setAverageRating(data.averageRating || 0);
      setHasMoreReviews(data.hasMore || false);
      setReviewPage(page);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoadingMoreReviews(false);
    }
  };

  const handleLoadMoreReviews = () => {
    fetchReviews(reviewPage + 1, true);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast('Please login to add items to cart', { icon: 'ℹ️' });
      navigate('/login');
      return;
    }

    try {
      // For virtual variants (created from related products), use the product ID from the variant
      const isVirtualVariant = selectedVariant && String(selectedVariant.id).startsWith('v_');
      const targetProductId = isVirtualVariant && selectedVariant.productId
        ? selectedVariant.productId
        : product.id;

      const requestData = {
        productId: targetProductId,
        quantity
      };

      // Include variantId only for real database variants (not virtual ones)
      if (selectedVariant && !isVirtualVariant) {
        requestData.variantId = selectedVariant.id;
      }

      const { data } = await api.post('cart/items', requestData);
      setCart(data);
      toast.success(`Added ${selectedVariant ? `${selectedVariant.size}${selectedVariant.unit || 'ml'}` : ''} to cart!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleBuyItNow = async () => {
    if (!product) return;

    if (!isAuthenticated) {
      toast('Please login to continue', { icon: 'ℹ️' });
      navigate('/login');
      return;
    }

    try {
      const isVirtualVariant = selectedVariant?.id && String(selectedVariant.id).startsWith('v_');
      const targetProductId = isVirtualVariant ? product.id : (selectedVariant?.productId || product.id);

      const requestData = {
        productId: targetProductId,
        quantity
      };

      if (selectedVariant && !isVirtualVariant) {
        requestData.variantId = selectedVariant.id;
      }

      const { data } = await api.post('cart/items', requestData);
      setCart(data);
      navigate('/checkout');
    } catch (error) {
      console.error('Buy It Now error:', error);
      toast.error(error.response?.data?.message || 'Failed to proceed to checkout');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast('Please login to submit a review', { icon: 'ℹ️' });
      navigate('/login');
      return;
    }

    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      await api.post(`products/${product.id}/reviews`, {
        rating: reviewRating,
        comment: reviewComment
      });
      toast.success('Review submitted successfully!');
      setReviewRating(0);
      setReviewComment('');
      fetchReviews(0, false);
      fetchProduct(); // Refresh product to update rating
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCheckDelivery = async () => {
    const pin = deliveryPincode.trim();
    if (!pin || !/^[1-9][0-9]{5}$/.test(pin)) {
      setDeliveryError('Please enter a valid 6-digit pincode');
      setDeliveryInfo(null);
      return;
    }
    setCheckingPincode(true);
    setDeliveryError('');
    setDeliveryInfo(null);
    try {
      const { data } = await api.get(`shipping/validate-pincode?pincode=${pin}`);
      if (data.valid && data.serviceable) {
        const etd = data.estimatedDeliveryDays || 5;
        setDeliveryInfo({
          estimatedDays: etd,
          city: data.city,
          state: data.state,
        });
      } else {
        setDeliveryError(data.error || 'Delivery not available to this pincode');
      }
    } catch (err) {
      setDeliveryError('Unable to check delivery. Please try again.');
    } finally {
      setCheckingPincode(false);
    }
  };

  if (loading) {
    return <ProductSkeleton />;
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground mb-6">Product not found</p>
            <button
              onClick={() => navigate('/products')}
              className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Products
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Use variant pricing if selected, otherwise use product pricing
  const displayPrice = selectedVariant
    ? (selectedVariant.discountPrice || selectedVariant.price || 0)
    : (product.discountPrice || product.price || 0);
  const originalPrice = selectedVariant ? (selectedVariant.price || 0) : (product.price || 0);
  const hasDiscount = selectedVariant
    ? (selectedVariant.discountPrice && selectedVariant.discountPrice < selectedVariant.price)
    : (product.discountPrice && product.discountPrice < product.price);
  const currentStock = selectedVariant ? (selectedVariant.stock || 0) : (product.stock || 0);

  const allImages = [product.imageUrl, ...(product.additionalImages || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          {/* Product Images Section */}
          <div className="lg:col-span-7 flex flex-col md:flex-row gap-6">
            {/* Desktop Side Thumbnails */}
            <div className="hidden md:flex flex-col gap-4 w-24 shrink-0 order-1">
              {allImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={cn(
                    "aspect-square rounded-xl border bg-white p-2 transition-all duration-500 overflow-hidden group",
                    selectedImage === img
                      ? "border-primary/60 shadow-lg ring-1 ring-primary/20 scale-105"
                      : "border-border/40 hover:border-border opacity-70 hover:opacity-100"
                  )}
                >
                  <img 
                    src={img} 
                    alt={`${product.name} ${idx + 1}`}
                    loading="lazy"
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" 
                  />
                </button>
              ))}
            </div>

            {/* Main Product Image Container */}
            <div className="flex-1 order-2">
              <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/30 bg-gradient-to-br from-white via-[#FAFAFA] to-[#F5F5F5] flex items-center justify-center p-8 sm:p-16 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] transition-all duration-700 group">
                {/* Subtle Radial Shine */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.8),transparent)] pointer-events-none" />
                
                <img
                  src={selectedImage || 'https://placehold.co/600x600?text=Perfume'}
                  alt={product.name}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://placehold.co/600x600?text=No+Image';
                  }}
                  className="max-w-full max-h-full w-auto h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.12)] transition-all duration-1000 ease-out group-hover:scale-[1.08] relative z-10"
                />

                {/* Badge/Tag overlay if needed */}
                {hasDiscount && (
                  <div className="absolute top-6 right-6 z-20">
                    <Badge variant="destructive" className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest shadow-xl rounded-full">
                      -{Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                    </Badge>
                  </div>
                )}
              </div>

              {/* Mobile Thumbnails */}
              <div className="flex md:hidden gap-3 mt-6 pb-2 overflow-x-auto no-scrollbar">
                {allImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "w-20 aspect-square shrink-0 rounded-xl border bg-white p-2 transition-all duration-300",
                      selectedImage === img
                        ? "border-primary shadow-md scale-105"
                        : "border-border/50"
                    )}
                  >
                    <img src={img} alt="" loading="lazy" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Product Info Section */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
              {product.brand && (
                <Badge variant="secondary" className="mb-3">
                  {product.brand}
                </Badge>
              )}
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">{product.name}</h1>

              {/* Stock Indicator Badge */}
              <div className="mb-4">
                <StockBadge stock={product.stock} />
              </div>

              <div className="flex items-center gap-2 mb-6">
                <StarRating value={averageRating || product.rating} readOnly={true} size="md" />
                <span className="text-sm text-muted-foreground">({totalReviews || product.reviewCount} reviews)</span>
              </div>
            </div>

            </div>

            <div className="flex items-baseline gap-4">
              <span className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">
                ₹{(displayPrice || 0).toFixed(0)}
              </span>
              {hasDiscount && (
                <span className="text-2xl text-muted-foreground line-through decoration-slate-400/40">
                  ₹{product.price.toFixed(0)}
                </span>
              )}
            </div>

            {/* Subtle Social Proof */}
            <div className="flex items-center gap-2.5 py-1 animate-in fade-in duration-700">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-50 border border-slate-100">
                <TrendingUp className="w-3 h-3 text-slate-400" />
              </div>
              <p className="text-[13px] text-slate-500 font-light tracking-wide italic">
                Frequently chosen by fragrance enthusiasts
              </p>
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            <Card>
              <CardContent className="grid grid-cols-2 gap-4 p-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-medium text-foreground">{formatCategory(product.category)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <p className="font-medium text-foreground">{product.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{['aroma chemicals', 'bakhoor'].includes(product.category) ? 'Weight' : 'Volume'}</p>
                  <p className="font-medium text-foreground">
                    {selectedVariant
                      ? `${selectedVariant.size}${selectedVariant.unit || (product?.category === 'aroma chemicals' ? 'g' : 'ml')}`
                      : (product.volume
                        ? `${product.volume}${product.unit || (product.category === 'aroma chemicals' ? 'g' : 'ml')}`
                        : 'N/A')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Availability</p>
                  <StockBadge stock={product.stock} variant="dot" />
                </div>
              </CardContent>
            </Card>

            {product.fragranceNotes?.length > 0 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Fragrance Notes</h3>
                <div className="flex flex-wrap gap-2">
                  {product.fragranceNotes.map((note, idx) => (
                    <Badge key={idx} variant="secondary">
                      {note}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Variant Selector */}
            {mergedVariants && mergedVariants.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">
                  {String(product?.category || '').toLowerCase().replace(/_/g, ' ') === 'aroma chemicals' ? 'Select Weight' : 'Select Size'}
                </p>
                <div className="flex flex-wrap gap-3">
                  {mergedVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.active || variant.stock === 0}
                      className={cn(
                        "relative px-4 sm:px-6 py-2 sm:py-3 rounded-full border transition-all text-xs sm:text-sm font-bold min-w-[70px] sm:min-w-[90px]",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100",
                        selectedVariant?.id === variant.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105"
                          : "bg-white text-slate-900 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {variant.size}{variant.unit || (String(product?.category || '').toLowerCase().replace(/_/g, ' ') === 'aroma chemicals' ? 'g' : 'ml')}
                      {variant.stock === 0 && (
                        <span className="absolute -top-2 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          Out
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-8 pt-6">
              {currentStock > 0 ? (
                <div className="space-y-8">
                  {/* Quantity Section - Row 1 */}
                  <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-widest text-slate-500">Quantity</p>
                    <div className="flex items-center justify-between w-full sm:w-[180px] h-14 bg-slate-50 border border-slate-200 rounded-full px-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 hover:bg-white rounded-full transition-all duration-300"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="text-base font-bold text-slate-900">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 hover:bg-white rounded-full transition-all duration-300"
                        onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                        disabled={quantity >= currentStock}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Action Buttons - Row 2 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      onClick={handleAddToCart}
                      variant="outline"
                      className="h-14 rounded-full text-base font-bold border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all duration-300 active:scale-95"
                      size="lg"
                    >
                      <ShoppingCart className="h-5 w-5 mr-3" />
                      Add to Cart
                    </Button>
                    <Button
                      onClick={handleBuyItNow}
                      className="h-14 rounded-full text-base font-bold bg-[#0A1128] hover:bg-[#000814] text-white shadow-2xl shadow-slate-900/20 transition-all duration-300 active:scale-95 border border-[#0A1128]"
                      size="lg"
                    >
                      Buy It Now
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pt-4">
                  <Button
                    disabled
                    variant="secondary"
                    className="w-full h-14 rounded-full text-lg font-bold opacity-60"
                    size="lg"
                  >
                    Out of Stock
                  </Button>
                </div>
              )}
            </div>

            {/* Low Stock Warning */}
            {currentStock > 0 && currentStock < 10 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-700 font-medium flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                  Hurry! Only {currentStock} {currentStock === 1 ? 'item' : 'items'} left in stock
                </p>
              </div>
            )}

            {/* ==================== PINCODE DELIVERY CHECKER ==================== */}
            <div className="mt-2 rounded-xl border border-border bg-background p-5 space-y-4">
              {/* Dynamic delivery headline */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-foreground">
                  <span className="text-green-600">{deliveryPercent}%</span> orders get delivered <span className="text-green-600">on time</span>
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">Get estimated delivery date</p>
              </div>

              {/* Pincode Input */}
              <div className="flex items-center rounded-lg border border-border bg-white overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary transition-all">
                <div className="flex items-center pl-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter delivery pincode"
                  value={deliveryPincode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setDeliveryPincode(val);
                    if (deliveryError) setDeliveryError('');
                    if (deliveryInfo) setDeliveryInfo(null);
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleCheckDelivery()}
                  className="flex-1 px-3 py-2.5 text-sm bg-transparent focus:outline-none placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleCheckDelivery}
                  disabled={checkingPincode}
                  className="px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 border-l border-border"
                >
                  {checkingPincode ? (
                    <span className="inline-block h-4 w-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : 'Check'}
                </button>
              </div>

              {/* Delivery Result — serviceable */}
              {deliveryInfo && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <Truck className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">
                      Expected Delivery in {deliveryInfo.estimatedDays}–{deliveryInfo.estimatedDays + 2} Days
                    </p>
                    {deliveryInfo.city && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {deliveryInfo.city}{deliveryInfo.state ? `, ${deliveryInfo.state}` : ''}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Error — not deliverable or invalid */}
              {deliveryError && (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
                  <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-600 font-medium">{deliveryError}</p>
                </div>
              )}

              {/* Divider */}
              <div className="border-t border-border" />

              {/* Free Shipping Banner */}
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">FREE Shipping in India</p>
                  <p className="text-xs text-muted-foreground">on orders above ₹999</p>
                </div>
              </div>
            </div>
          </div>

        {/* ==================== REVIEWS SECTION ==================== */}
        <div className="col-span-full mt-8">
          {/* Reviews Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Customer Reviews</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-foreground">{(averageRating || product.rating || 0).toFixed(1)}</span>
                <div>
                  <StarRating value={averageRating || product.rating} readOnly={true} size="md" />
                  <span className="text-sm text-muted-foreground">
                    {totalReviews || product.reviewCount} reviews
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Write Review Form */}
          {isAuthenticated && hasPurchased && (
            <Card className="mb-8">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
                <form onSubmit={handleSubmitReview} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Your Rating</label>
                    <StarRating value={reviewRating} onChange={setReviewRating} size="lg" />
                  </div>
                  <div>
                    <label htmlFor="comment" className="block text-sm font-medium mb-2">
                      Your Review (Optional)
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      rows={4}
                      maxLength={1000}
                      placeholder="Share your experience with this product..."
                      className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {reviewComment.length}/1000 characters
                    </p>
                  </div>
                  <Button type="submit" disabled={submittingReview || reviewRating === 0}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Message for users who haven't purchased */}
          {isAuthenticated && !hasPurchased && (
            <Card className="mb-8 border-muted">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  Purchase this product to write a review
                </p>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          {reviews && reviews.length > 0 ? (
            <div className="space-y-4">
              <div className="grid gap-4">
                {reviews.map((review) => (
                  <Card key={review.id} className="border border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-semibold text-primary">
                                {review.userName?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <span className="font-medium text-foreground">{review.userName}</span>
                            <StarRating value={review.rating} readOnly={true} size="sm" />
                          </div>
                          {review.comment && (
                            <p className="text-muted-foreground leading-relaxed ml-11">{review.comment}</p>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {new Date(review.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {hasMoreReviews && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={handleLoadMoreReviews}
                    disabled={loadingMoreReviews}
                    className="min-w-[200px]"
                  >
                    {loadingMoreReviews ? (
                      'Loading...'
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4 mr-2" />
                        Load More Reviews
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Star className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground mb-2">No reviews yet</p>
                <p className="text-sm text-muted-foreground">
                  {isAuthenticated ? 'Be the first to review this product!' : 'Login to write a review'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      </div>

      {/* Related Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <RelatedProducts productId={id} />
      </div>
    </div>
  );
}
