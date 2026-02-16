import { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useNavigate } from 'react-router-dom';
import wishlistAPI from '../api/wishlist';
import { toast } from 'react-toastify';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

export default function Wishlist() {
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { removeFromWishlist } = useWishlistStore();
  const { addToCart } = useCartStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const data = await wishlistAPI.getWishlist();
      const products = data.map(item => item.product);
      setWishlistProducts(products);
    } catch (error) {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (productId) => {
    await removeFromWishlist(productId);
    setWishlistProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    toast.success('Added to cart!');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (wishlistProducts.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="h-24 w-24 mx-auto text-muted-foreground/30 mb-6" />
          <h1 className="text-3xl font-bold mb-4">Your Wishlist is Empty</h1>
          <p className="text-muted-foreground mb-8">
            Start adding products you love to your wishlist
          </p>
          <Button onClick={() => navigate('/products')} size="lg">
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-muted-foreground">
          {wishlistProducts.length} {wishlistProducts.length === 1 ? 'item' : 'items'} saved
        </p>
      </div>

      {/* Wishlist Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistProducts.map((product) => {
          const hasDiscount = product.discountedPrice && product.discountedPrice < product.price;
          const discountPercent = hasDiscount
            ? Math.round(((product.price - product.discountedPrice) / product.price) * 100)
            : 0;
          const displayPrice = product.discountedPrice || product.price;

          return (
            <Card key={product.id} className="overflow-hidden group">
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/400x500?text=Perfume'}
                  alt={product.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                  onClick={() => navigate(`/products/${product.id}`)}
                />
                
                {/* Remove Button */}
                <button
                  onClick={() => handleRemove(product.id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-red-50 rounded-full transition-colors group/btn"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4 text-slate-600 group-hover/btn:text-red-500" />
                </button>

                {hasDiscount && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="destructive" className="shadow-sm">
                      -{discountPercent}%
                    </Badge>
                  </div>
                )}

                {product.stockQuantity === 0 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="bg-white px-4 py-2 rounded-md text-sm font-semibold">
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 space-y-3">
                {product.brand && (
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {product.brand}
                  </p>
                )}

                <h3
                  className="font-semibold line-clamp-2 cursor-pointer hover:text-primary transition-colors"
                  onClick={() => navigate(`/products/${product.id}`)}
                >
                  {product.name}
                </h3>

                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-primary">
                    ₹{displayPrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.price.toLocaleString()}
                    </span>
                  )}
                </div>

                <Button
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="w-full"
                  disabled={product.stockQuantity === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {product.stockQuantity === 0 ? 'Out of Stock' : 'View Product'}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
