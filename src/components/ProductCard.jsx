import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import WishlistButton from './WishlistButton';
import StockBadge from './StockBadge';

export default function ProductCard({ product, onQuickView }) {
  const displayPrice = product.discountPrice || product.price || 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50 group">
      <Link to={`/products/${product.id}`} className="block">
        <div className="relative aspect-[3/4] overflow-hidden bg-muted">
          <img
            src={product.imageUrl || 'https://placehold.co/600x400?text=Perfume'}
            alt={product.name}
            onError={(e) => {
              e.target.onerror = null; // Prevent infinite loop
              e.target.src = 'https://placehold.co/600x400?text=No+Image';
            }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-3 left-3">
            <WishlistButton productId={product.id} />
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-2">
            {hasDiscount && (
              <Badge variant="destructive" className="shadow-sm">
                -{discountPercent}%
              </Badge>
            )}
            {product.featured && (
              <Badge className="bg-accent text-white shadow-sm">
                Featured
              </Badge>
            )}
            {product.stock < 10 && (
              <StockBadge stock={product.stock} className="shadow-sm" />
            )}
          </div>

          {/* Quick View Button - Shows on hover */}
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView?.(product);
              }}
              className="w-full bg-white/95 hover:bg-white text-foreground backdrop-blur-sm shadow-lg"
              size="sm"
            >
              <Eye className="h-4 w-4 mr-2" />
              Quick View
            </Button>
          </div>

          {product.stock === 0 && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="bg-white px-5 py-3 rounded-lg shadow-lg">
                <p className="text-sm font-semibold text-red-700">Out of Stock</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 space-y-3">
          {product.brand && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {product.brand}
            </p>
          )}

          <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem]">
            {product.name}
          </h3>

          {product.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          )}

          {product.volume && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs font-medium">
                {product.volume}ml
              </Badge>
            </div>
          )}

          {product.rating > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3.5 w-3.5",
                      i < Math.floor(product.rating)
                        ? "fill-accent text-accent"
                        : "fill-muted text-muted"
                    )}
                  />
                ))}
              </div>
              {product.reviewCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount})
                </span>
              )}
            </div>
          )}

          <div className="flex items-baseline justify-between pt-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">
                ₹{(displayPrice || 0).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  ₹{(product.price || 0).toFixed(2)}
                </span>
              )}
            </div>
          </div>

        </div>
      </Link>
    </Card>
  );
}
