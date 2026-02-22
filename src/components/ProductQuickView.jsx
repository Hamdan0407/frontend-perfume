import { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, Star, Minus, Plus, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useCartStore } from '../store/cartStore';
import api from '../api/axios';

export default function ProductQuickView({ product, isOpen, onClose }) {
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // Use variant pricing if selected, otherwise use product pricing
  const displayPrice = selectedVariant
    ? (selectedVariant.discountPrice || selectedVariant.price)
    : (product?.discountPrice || product?.price || 0);
  const originalPrice = selectedVariant ? selectedVariant.price : (product?.price || 0);
  const hasDiscount = selectedVariant
    ? (selectedVariant.discountPrice && selectedVariant.discountPrice < selectedVariant.price)
    : (product?.discountPrice && product?.discountPrice < product?.price);
  const currentStock = selectedVariant ? selectedVariant.stock : (product?.stock || 0);
  const variantsToDisplay = product?.allVariants || product?.variants || [];
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100)
    : 0;

  // Auto-select first available variant when product changes
  useEffect(() => {
    const vars = product?.allVariants || product?.variants || [];
    if (vars.length > 0 && !selectedVariant) {
      const firstAvailable = vars.find(v => v.active && v.stock > 0) || vars[0];
      setSelectedVariant(firstAvailable);
    }
  }, [product]);

  // Handle body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleAddToCart = async () => {
    if (!product) return;

    setLoading(true);
    try {
      const requestData = {
        productId: selectedVariant?.productId || product.id,
        quantity: quantity
      };

      // Include variantId if a variant is selected
      if (selectedVariant) {
        requestData.variantId = selectedVariant.id;
      }

      const { data } = await api.post('cart/items', requestData);

      addItem(data);
      toast.success(`Added ${quantity} ${product.name}${selectedVariant ? ` (${selectedVariant.size}ml)` : ''} to cart`);
    } catch (error) {
      console.error('Add to cart error:', error);
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = () => {
    if (!product) return;
    document.body.style.overflow = 'unset';
    onClose();
    // Scroll to top before navigating
    window.scrollTo({ top: 0, behavior: 'instant' });
    navigate(`/products/${product.id}`);
  };

  const handleClose = () => {
    document.body.style.overflow = 'unset';
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-muted transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="grid md:grid-cols-2 gap-6 p-6 overflow-y-auto max-h-[90vh]">
          {/* Left: Image */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-muted">
              <img
                src={product.imageUrl || 'https://placehold.co/600x400?text=Perfume'}
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x400?text=No+Image';
                }}
                className="h-full w-full object-cover"
              />
              {currentStock === 0 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="bg-white px-5 py-3 rounded-lg shadow-lg">
                    <p className="text-sm font-semibold text-red-700">Out of Stock</p>
                  </div>
                </div>
              )}
              {/* Badges */}
              <div className="absolute top-3 right-3 flex flex-col gap-2">
                {hasDiscount && (
                  <Badge variant="destructive" className="shadow-lg">
                    -{discountPercent}%
                  </Badge>
                )}
                {product.featured && (
                  <Badge className="bg-accent text-white shadow-lg">
                    Featured
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Right: Details */}
          <div className="space-y-4">
            {/* Brand */}
            {product.brand && (
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                {product.brand}
              </p>
            )}

            {/* Title */}
            <h2 className="text-2xl font-bold text-foreground">
              {product.name}
            </h2>

            {/* Rating */}
            {product.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.floor(product.rating)
                          ? "fill-accent text-accent"
                          : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {product.rating.toFixed(1)}
                  {product.reviewCount > 0 && ` (${product.reviewCount} reviews)`}
                </span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-foreground">
                ₹{displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <>
                  <span className="text-xl text-muted-foreground line-through">
                    ₹{product.price.toFixed(2)}
                  </span>
                  <Badge variant="destructive">
                    Save ₹{(product.price - product.discountPrice).toFixed(2)}
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Description</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {product.description}
                </p>
              </div>
            )}

            {/* Details */}
            <div className="space-y-2">
              {/* Variant Selector */}
              {variantsToDisplay.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Select Size</h3>
                  <div className="flex flex-wrap gap-3">
                    {variantsToDisplay.map((variant) => (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariant(variant)}
                        disabled={!variant.active || variant.stock === 0}
                        className={cn(
                          "relative px-4 py-2 rounded-full border transition-all text-xs font-bold min-w-[70px]",
                          "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100",
                          selectedVariant?.id === variant.id
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm transform scale-105"
                            : "bg-white text-slate-900 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                        )}
                      >
                        {variant.size}ml
                        {variant.stock === 0 && (
                          <span className="absolute -top-1.5 -right-1 bg-red-500 text-white text-[9px] px-1 py-0.5 rounded-full">
                            Out
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {selectedVariant && selectedVariant.stock === 0 && (
                    <p className="text-xs text-red-600 mt-2 font-medium">Selected size is out of stock</p>
                  )}
                </div>
              )}

              {product.volume && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Volume</span>
                  <span className="font-medium">{product.volume}ml</span>
                </div>
              )}
              {product.gender && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Gender</span>
                  <Badge variant="secondary">{product.gender}</Badge>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Stock Status</span>
                <div className="flex items-center gap-2">
                  <Package className={cn(
                    "h-4 w-4",
                    currentStock > 10 ? "text-green-600" : currentStock > 0 ? "text-amber-600" : "text-red-600"
                  )} />
                  <span className={cn(
                    "font-medium",
                    currentStock > 10 ? "text-green-600" : currentStock > 0 ? "text-amber-600" : "text-red-600"
                  )}>
                    {currentStock > 10 ? 'In Stock' : currentStock > 0 ? `Only ${currentStock} left` : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            {currentStock > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Quantity</label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-semibold w-12 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    disabled={quantity >= currentStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    ({currentStock} available)
                  </span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={loading || currentStock === 0}
                className="w-full h-12"
                size="lg"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </>
                )}
              </Button>
              <Button
                onClick={handleViewDetails}
                variant="outline"
                className="w-full"
                size="lg"
              >
                View Full Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
