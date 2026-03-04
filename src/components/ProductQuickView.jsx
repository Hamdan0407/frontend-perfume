import { useState, useEffect } from 'react';
import { X, ShoppingCart, Heart, Star, Minus, Plus, Package } from 'lucide-react';
import toast from '../utils/toast';
import { useNavigate } from 'react-router-dom';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import { useCartStore } from '../store/cartStore';
import api from '../api/axios';

export default function ProductQuickView({ product, isOpen, onClose }) {
  const navigate = useNavigate();
  const { setCart } = useCartStore();
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

      setCart(data);
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
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6 overflow-y-auto max-h-[90vh]">
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

            <div className="flex items-baseline gap-3">
              <span className="text-2xl sm:text-3xl font-bold text-foreground">
                ₹{displayPrice.toFixed(0)}
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

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button
                onClick={handleViewDetails}
                variant="default"
                className="w-full h-12"
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
