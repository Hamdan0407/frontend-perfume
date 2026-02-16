import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Star, Minus, Plus, ShoppingCart, Package, Tag } from 'lucide-react';
import api from '../api/axios';
import reviewAPI from '../api/reviewAPI';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import StarRating from '../components/StarRating';
import StockBadge from '../components/StockBadge';
import RelatedProducts from '../components/RelatedProducts';
import { cn } from '../lib/utils';

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
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);

  // Scroll to top on mount/route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    if (isAuthenticated) {
      checkPurchaseStatus();
    }
  }, [id, isAuthenticated]);

  const checkPurchaseStatus = async () => {
    try {
      const { data } = await api.get('/orders/my-orders');
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
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      setSelectedImage(data.imageUrl);
      // Auto-select first available variant if variants exist
      if (data.variants && data.variants.length > 0) {
        const firstAvailable = data.variants.find(v => v.active && v.stock > 0) || data.variants[0];
        setSelectedVariant(firstAvailable);
      }
    } catch (error) {
      console.error('Failed to load product:', error);
      const status = error.response?.status;
      if (status === 404 || status === 500) {
        // Product doesn't exist - redirect to products page
        setTimeout(() => {
          toast.error('Product not found. Redirecting to products...');
          navigate('/products');
        }, 1500);
      } else {
        toast.error('Failed to load product');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data } = await api.get(`/reviews/product/${id}`);
      setReviews(data.content);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      navigate('/login');
      return;
    }

    try {
      const requestData = {
        productId: product.id,
        quantity
      };

      // Include variantId if a variant is selected
      if (selectedVariant) {
        requestData.variantId = selectedVariant.id;
      }

      const { data } = await api.post('/cart/items', requestData);
      setCart(data);
      toast.success(`Added ${selectedVariant ? `${selectedVariant.size}ml` : ''} to cart!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.info('Please login to submit a review');
      navigate('/login');
      return;
    }

    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewAPI.createReview(product.id, reviewRating, reviewComment);
      toast.success('Review submitted successfully!');
      setReviewRating(0);
      setReviewComment('');
      fetchReviews();
      fetchProduct(); // Refresh product to update rating
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <Skeleton className="w-full aspect-square rounded-lg" />
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
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
    ? (selectedVariant.discountPrice || selectedVariant.price)
    : (product.discountPrice || product.price);
  const originalPrice = selectedVariant ? selectedVariant.price : product.price;
  const hasDiscount = selectedVariant
    ? (selectedVariant.discountPrice && selectedVariant.discountPrice < selectedVariant.price)
    : (product.discountPrice && product.discountPrice < product.price);
  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg border border-border bg-muted">
              <img
                src={selectedImage || 'https://placehold.co/600x600?text=Perfume'}
                alt={product.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://placehold.co/600x600?text=No+Image';
                }}
                className="w-full h-full object-cover"
              />
            </div>
            {product.additionalImages?.length > 0 && (
              <div className="grid grid-cols-4 gap-4">
                <button
                  onClick={() => setSelectedImage(product.imageUrl)}
                  className={cn(
                    "aspect-square overflow-hidden rounded-md border-2 transition-colors",
                    selectedImage === product.imageUrl ? "border-primary" : "border-border hover:border-muted-foreground"
                  )}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://placehold.co/150x150?text=No+Image';
                    }}
                    className="w-full h-full object-cover"
                  />
                </button>
                {product.additionalImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(img)}
                    className={cn(
                      "aspect-square overflow-hidden rounded-md border-2 transition-colors",
                      selectedImage === img ? "border-primary" : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${idx + 2}`}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://placehold.co/150x150?text=No+Image';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
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
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-5 w-5",
                        i < Math.floor(product.rating)
                          ? "fill-accent text-accent"
                          : "fill-muted text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviewCount} reviews)</span>
              </div>
            </div>

            <div className="flex items-baseline gap-3">
              {hasDiscount && (
                <span className="text-2xl text-muted-foreground line-through">
                  ₹{product.price.toFixed(2)}
                </span>
              )}
              <span className="text-4xl font-bold text-foreground">
                ₹{displayPrice.toFixed(2)}
              </span>
              {hasDiscount && (
                <Badge variant="destructive">
                  Save {Math.round(((product.price - product.discountPrice) / product.price) * 100)}%
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground leading-relaxed">{product.description}</p>

            <Card>
              <CardContent className="grid grid-cols-2 gap-4 p-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Category</p>
                  <p className="font-medium text-foreground">{product.category}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Type</p>
                  <p className="font-medium text-foreground">{product.type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Volume</p>
                  <p className="font-medium text-foreground">{product.volume} ml</p>
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
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Select Size</h3>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.active || variant.stock === 0}
                      className={cn(
                        "relative px-6 py-3 rounded-full border transition-all text-sm font-bold min-w-[90px]",
                        "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100",
                        selectedVariant?.id === variant.id
                          ? "bg-slate-900 text-white border-slate-900 shadow-md transform scale-105"
                          : "bg-white text-slate-900 border-slate-200 hover:border-slate-400 hover:bg-slate-50"
                      )}
                    >
                      {variant.size}ml
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

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {currentStock > 0 && (
                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 text-center border-x border-border py-2 bg-background focus:outline-none"
                    min="1"
                    max={currentStock}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                    disabled={quantity >= currentStock}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <Button
                onClick={handleAddToCart}
                disabled={currentStock === 0}
                className="flex-1"
                size="lg"
                variant={currentStock === 0 ? "secondary" : "default"}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
              </Button>
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
          </div>

          {/* Reviews Section */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground">Customer Reviews</h2>
            <div className="flex items-center gap-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-5 w-5",
                      i < Math.round(product.rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-none text-gray-300"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating.toFixed(1)} ({product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'})
              </span>
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
          {reviews.length > 0 ? (
            <div className="grid gap-6">
              {reviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-medium text-foreground">{review.userName}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "h-4 w-4",
                                  i < review.rating
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-none text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
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

      {/* Related Products Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <RelatedProducts productId={id} />
      </div>
    </div>
  );
}
