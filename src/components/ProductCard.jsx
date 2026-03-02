import { Link } from 'react-router-dom';
import { Star, ShoppingCart, Eye } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { cn } from '../lib/utils';
import WishlistButton from './WishlistButton';
import StarRating from './StarRating';
import StockBadge from './StockBadge';

export default function ProductCard({ product, onQuickView }) {
  const displayPrice = product.discountPrice || product.price || 0;
  const hasDiscount = product.discountPrice && product.discountPrice < product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  console.log(`[ProductCard] Rendering product: ${product.id} - ${product.name}`);
  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50 group h-full flex flex-col shadow-sm">
      <Link to={`/products/${product.id}`} className="block flex-1 flex flex-col" onClick={() => console.log(`[ProductCard] Clicking product ID: ${product.id}`)}>
        <div className="relative aspect-[3/4] overflow-hidden bg-muted sm:aspect-[3/4]">
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
              <StockBadge stock={product.stock} className="shadow-sm scale-90 sm:scale-100 origin-top-right" />
            )}
          </div>

          {/* Quick View Button - Responsive behavior */}
          <div className="absolute inset-x-0 bottom-0 p-2 sm:p-4 translate-y-full group-hover:translate-y-0 md:group-hover:translate-y-0 transition-transform duration-300 md:translate-y-full">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onQuickView?.(product);
              }}
              className="w-full bg-white/95 hover:bg-white text-foreground backdrop-blur-sm shadow-md text-[10px] sm:text-xs h-8 sm:h-10"
              size="sm"
            >
              <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
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

        <div className="p-4 flex flex-col flex-1 space-y-3">
          {product.brand && (
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {product.brand}
            </p>
          )}

          <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-2 group-hover:text-primary transition-colors min-h-[2.5rem] sm:min-h-[3rem]">
            {product.name}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1 sm:line-clamp-2 min-h-[1rem] sm:min-h-[2.5rem] hidden xs:block">
            {product.description || "Premium fragrance experience."}
          </p>

          <div className="mt-auto pt-2">
            {product.rating > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <StarRating value={product.rating} readOnly={true} size="sm" />
                <span className="text-xs text-muted-foreground">
                  ({product.reviewCount})
                </span>
              </div>
            )}

            {(() => {
              const displayVolume = product.size || product.volume || (product.variants && product.variants.length > 0 ? product.variants[0].size : null);
              if (!displayVolume) return null;

              const currentCat = (product.category || '').toLowerCase().replace(/_/g, ' ');
              const displayUnit = product.unit || (product.variants && product.variants.length > 0 ? product.variants[0].unit : (currentCat === 'aroma chemicals' ? 'g' : 'ml'));
              return (
                <div className="mb-2">
                  <span className="text-[10px] sm:text-xs font-semibold bg-secondary/80 px-2 py-0.5 rounded text-secondary-foreground">
                    {displayVolume} {displayUnit}
                  </span>
                </div>
              );
            })()}

            <div className="flex items-baseline justify-between flex-wrap gap-1">
              <div className="flex items-baseline gap-1.5 sm:gap-2">
                <span className="text-base sm:text-lg font-bold text-foreground">
                  {product.allVariants?.length > 1 && <span className="text-[10px] sm:text-sm font-medium text-muted-foreground mr-0.5">From</span>}
                  ₹{(displayPrice || 0).toFixed(0)}
                </span>
                {hasDiscount && (
                  <span className="text-[10px] sm:text-sm text-muted-foreground line-through">
                    ₹{(product.price || 0).toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  );
}
