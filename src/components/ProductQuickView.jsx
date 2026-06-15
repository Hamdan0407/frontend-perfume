import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingCart, Minus, Plus, ArrowRight, Package, Info, Check } from 'lucide-react';
import toast from '../utils/toast';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn, formatCategory } from '../lib/utils';
import { useCartStore } from '../store/cartStore';
import api from '../api/axios';

export default function ProductQuickView({ product, isOpen, onClose }) {
  const navigate = useNavigate();
  const { setCart } = useCartStore();
  const [fullProduct, setFullProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [variantQuantities, setVariantQuantities] = useState({}); // { variantId: quantity }
  const [addingToCart, setAddingToCart] = useState(false);

  // Cache for product details to avoid repeated fetches
  const [productCache, setProductCache] = useState({});

  const fetchProductDetails = useCallback(async (id) => {
    if (productCache[id]) {
      setFullProduct(productCache[id]);
      setSelectedImage(productCache[id].imageUrl);
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get(`products/${id}`);
      setFullProduct(data);
      setSelectedImage(data.imageUrl);
      setProductCache(prev => ({ ...prev, [id]: data }));
      
      // Initialize quantities for variants
      const initialQuantities = {};
      if (data.variants && data.variants.length > 0) {
        data.variants.forEach(v => {
          if (v.active && v.stock > 0) {
            initialQuantities[v.id] = 0;
          }
        });
      } else {
        initialQuantities['base'] = 0;
      }
      setVariantQuantities(initialQuantities);
    } catch (error) {
      console.error('Failed to fetch product details for QuickView:', error);
      toast.error('Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [productCache]);

  useEffect(() => {
    if (isOpen && product?.id) {
      fetchProductDetails(product.id);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, product?.id, fetchProductDetails]);

  // Handle ESC key to close
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const updateQuantity = (variantId, delta, stock) => {
    setVariantQuantities(prev => {
      const current = prev[variantId] || 0;
      const next = Math.max(0, Math.min(stock, current + delta));
      return { ...prev, [variantId]: next };
    });
  };

  const calculateTotals = () => {
    if (!fullProduct) return { subtotal: 0, count: 0 };
    
    let subtotal = 0;
    let count = 0;

    if (fullProduct.variants && fullProduct.variants.length > 0) {
      fullProduct.variants.forEach(v => {
        const qty = variantQuantities[v.id] || 0;
        if (qty > 0) {
          subtotal += (v.discountPrice || v.price) * qty;
          count += qty;
        }
      });
    } else {
      const qty = variantQuantities['base'] || 0;
      if (qty > 0) {
        subtotal += (fullProduct.discountPrice || fullProduct.price) * qty;
        count += qty;
      }
    }

    return { subtotal, count };
  };

  const handleAddToCart = async () => {
    // 1. Final validation check
    const { subtotal: currentSubtotal, count: currentCount } = calculateTotals();
    
    if (currentCount === 0) {
      toast.error('Please select at least one item');
      return;
    }

    if (!fullProduct || !fullProduct.id) {
      toast.error('Product details are still loading. Please try again in a moment.');
      return;
    }

    setAddingToCart(true);
    
    try {
      // 2. Collect items from the latest state
      const itemsToAdd = [];
      if (fullProduct.variants && fullProduct.variants.length > 0) {
        fullProduct.variants.forEach(v => {
          const qty = variantQuantities[v.id] || 0;
          if (qty > 0) {
            itemsToAdd.push({ 
              productId: fullProduct.id, 
              variantId: v.id, 
              quantity: qty 
            });
          }
        });
      } else {
        const qty = variantQuantities['base'] || 0;
        if (qty > 0) {
          itemsToAdd.push({ 
            productId: fullProduct.id, 
            quantity: qty 
          });
        }
      }

      // 3. Prevent execution if somehow empty despite count check
      if (itemsToAdd.length === 0) {
        setAddingToCart(false);
        return;
      }

      // 4. Fire requests sequentially to ensure cart synchronization on backend
      // Using a for...of loop for reliable async execution
      let finalCartData = null;
      for (const item of itemsToAdd) {
        const response = await api.post('cart/items', item);
        finalCartData = response.data;
      }

      // 5. Update store only once with the final state
      if (finalCartData) {
        setCart(finalCartData);
      }

      toast.success(`Successfully added ${currentCount} item(s) to your cart`);
      
      // Delay closing slightly for better UX/feedback
      setTimeout(() => {
        onClose();
      }, 500);

    } catch (error) {
      console.error('[QuickView] Add to cart error:', error);
      const errorMessage = error.response?.data?.message || 'Unable to add items. Please ensure you are logged in.';
      toast.error(errorMessage);
    } finally {
      setAddingToCart(false);
    }
  };

  if (!isOpen || !product) return null;

  const { subtotal, count } = calculateTotals();
  const allImages = fullProduct ? [fullProduct.imageUrl, ...(fullProduct.additionalImages || [])].filter(Boolean) : [product.imageUrl];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 ease-out border border-white/20">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-20 p-2.5 rounded-full bg-white/80 backdrop-blur-sm border border-slate-100 text-slate-500 hover:text-slate-900 hover:bg-white hover:shadow-lg transition-all duration-300 active:scale-90"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-12 min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin" />
              <p className="text-sm font-medium text-slate-400 animate-pulse">Refining details...</p>
            </div>
          </div>
        ) : fullProduct && (
          <>
            {/* Left Column: Visuals */}
            <div className="w-full md:w-[45%] bg-slate-50/50 p-6 sm:p-8 flex flex-col border-r border-slate-100">
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-100 group">
                  <img
                    src={selectedImage}
                    alt={fullProduct.name}
                    className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-105"
                  />
                  {fullProduct.discountPrice < fullProduct.price && (
                    <Badge className="absolute top-4 left-4 bg-red-500 text-white font-bold px-3 py-1 border-none">
                      -{Math.round(((fullProduct.price - fullProduct.discountPrice) / fullProduct.price) * 100)}%
                    </Badge>
                  )}
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-3 mt-6 pb-2 overflow-x-auto no-scrollbar w-full justify-center">
                    {allImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(img)}
                        className={cn(
                          "w-16 h-16 rounded-xl border-2 transition-all duration-300 overflow-hidden bg-white p-1 flex-shrink-0",
                          selectedImage === img 
                            ? "border-slate-900 shadow-md scale-105" 
                            : "border-transparent opacity-60 hover:opacity-100"
                        )}
                      >
                        <img src={img} alt="" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* View Full Details Link */}
              <Link
                to={`/products/${fullProduct.slug || fullProduct.id}`}
                onClick={onClose}
                className="mt-8 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-slate-900 transition-colors group"
              >
                View Full Details 
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Right Column: Information & Selection */}
            <div className="flex-1 flex flex-col p-6 sm:p-8 overflow-y-auto no-scrollbar bg-white">
              {/* Header Info */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {fullProduct.brand && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                      {fullProduct.brand}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-300">•</span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                    {formatCategory(fullProduct.category)}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3">{fullProduct.name}</h2>
                <p className="text-sm text-slate-500 leading-relaxed line-clamp-3 italic">{fullProduct.description}</p>
              </div>

              {/* Variant Selection Table */}
              <div className="flex-1 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900">Selection</h3>
                  <Badge variant="outline" className="text-[10px] font-bold border-slate-200 text-slate-500">
                    {formatCategory(fullProduct.category)}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {fullProduct.variants && fullProduct.variants.length > 0 ? (
                    fullProduct.variants.map((v) => (
                      <div 
                        key={v.id}
                        className={cn(
                          "group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                          (variantQuantities[v.id] > 0) 
                            ? "border-slate-900 bg-slate-900/[0.02] shadow-sm" 
                            : "border-slate-100 hover:border-slate-300"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">{v.size}{v.unit || 'ml'}</span>
                          <span className="text-xs font-medium text-slate-400">
                            {v.stock === 0 ? (
                              <span className="text-red-400">Sold Out</span>
                            ) : (
                              `₹${(v.discountPrice || v.price).toFixed(0)} / unit`
                            )}
                          </span>
                        </div>

                        <div className="flex items-center gap-4">
                          {v.stock > 0 ? (
                            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                              <button
                                onClick={() => updateQuantity(v.id, -1, v.stock)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-slate-900">
                                {variantQuantities[v.id] || 0}
                              </span>
                              <button
                                onClick={() => updateQuantity(v.id, 1, v.stock)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="px-3 py-1.5 rounded-full bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Out
                            </div>
                          )}
                          
                          <div className="w-20 text-right">
                            <span className={cn(
                              "text-sm font-bold transition-colors",
                              (variantQuantities[v.id] > 0) ? "text-slate-900" : "text-slate-300"
                            )}>
                              ₹{((v.discountPrice || v.price) * (variantQuantities[v.id] || 0)).toFixed(0)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    /* Fallback for products without variants */
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900">Standard Size</span>
                        <span className="text-xs font-medium text-slate-400">₹{(fullProduct.discountPrice || fullProduct.price).toFixed(0)} per unit</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-full p-1 shadow-sm">
                          <button
                            onClick={() => updateQuantity('base', -1, fullProduct.stock)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-900">
                            {variantQuantities['base'] || 0}
                          </span>
                          <button
                            onClick={() => updateQuantity('base', 1, fullProduct.stock)}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="w-20 text-right">
                          <span className="text-sm font-bold text-slate-900">
                            ₹{((fullProduct.discountPrice || fullProduct.price) * (variantQuantities['base'] || 0)).toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Footer in Modal */}
              <div className="mt-auto pt-6 border-t border-slate-100">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Selection</span>
                    <span className="text-sm font-bold text-slate-900">{count} Item{count !== 1 ? 's' : ''} Selected</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Grand Total</span>
                    <span className="text-xl font-bold text-slate-900">₹{subtotal.toFixed(0)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      onClose();
                      navigate('/cart');
                    }}
                    variant="outline"
                    className="h-14 rounded-full border-slate-200 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all duration-300"
                  >
                    View Cart
                  </Button>
                  <Button
                    onClick={handleAddToCart}
                    disabled={count === 0 || addingToCart}
                    className="h-14 rounded-full bg-slate-900 hover:bg-black text-white font-bold shadow-xl shadow-slate-900/10 transition-all duration-300 disabled:opacity-40 active:scale-[0.98]"
                  >
                    {addingToCart ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        <span>Add Selection to Cart</span>
                      </div>
                    )}
                  </Button>
                </div>

                <p className="text-[10px] text-center text-slate-400 mt-4 uppercase tracking-[0.1em] font-medium">
                  Tax included. Shipping cost calculated at checkout.
                </p>

              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
