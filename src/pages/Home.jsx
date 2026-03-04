import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import productAPI from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import ProductQuickView from '../components/ProductQuickView';
import RecentlyViewed from '../components/RecentlyViewed';
import { groupProducts } from '../utils/productUtils';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { LoadingSpinner } from '../components/ui/spinner';
import PurchaseNotification from '../components/PurchaseNotification';
import LoginSuccessAnimation from '../components/LoginSuccessAnimation';
import CountUp from '../components/ui/CountUp';
import { useToast } from '../context/ToastContext';
import { Sparkles, ArrowRight, CheckCircle, ChevronLeft, ChevronRight, ShieldCheck, Truck, Award, Users, Package, MapPin } from 'lucide-react';
import { CATEGORY_LIST } from '../constants/productCategories';

import '../styles/HomeTheme.css';

// Memory flag to track intro animation per session (reset on reload)
// let hasViewedIntro = false; // Intentionally disabled as intro is removed

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const toast = useToast();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  // Removed handleIntroComplete as intro is removed

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('[Home] Fetching featured products...');
      const data = await productAPI.getFeaturedProducts(8);
      console.log('[Home] Featured products response received:', data);

      // Backend returns a direct List<ProductResponse> for featured products
      const productsList = Array.isArray(data) ? data : (Array.isArray(data?.content) ? data.content : []);
      console.log('[Home] Raw products list size:', productsList.length);

      const grouped = groupProducts(productsList);
      console.log('[Home] Grouped products size:', grouped.length);

      setFeaturedProducts(grouped);
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to load featured products';
      setError(message);
      console.error('Failed to fetch featured products:', err);

      // Only show toast for unexpected errors, not validation errors
      if (err.response?.status !== 400) {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchFeaturedProducts();
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen theme-home">
      {showLoginSuccess && <LoginSuccessAnimation onComplete={() => setShowLoginSuccess(false)} />}
      {/* Hero Section */}
      {/* Hero Section - Split Layout */}
      <section className="relative bg-gradient-to-br from-primary via-slate-800 to-slate-900 text-white overflow-hidden min-h-[85vh] flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNEgxNHYtMjFoMjJ2MjF6bTAgMTlIMTR2LTIxaDIydjIxeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-12 items-center">

            {/* Content - Text centered */}
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-backwards text-center order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20 mx-auto">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>Premium Fragrances Collection</span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight px-2">
                Discover Your <br />
                <span className="text-accent underline decoration-accent/30 underline-offset-8">Signature Scent</span>
              </h1>

              <p className="text-base sm:text-xl text-slate-300 max-w-2xl mx-auto font-light tracking-wide px-4">
                Exquisite luxury fragrances crafted for elegance. Experience the essence of true sophistication this season.
              </p>

              <div className="pt-4 flex justify-center">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white h-14 px-10 text-lg shadow-lg hover:shadow-accent/50 transition-all duration-300 hover:scale-105">
                  <Link to="/products" className="flex items-center gap-2">
                    Explore Collection
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Our Collections</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find the perfect fragrance tailored to your style
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
            {CATEGORY_LIST.map((cat, idx) => {
              // Map old metadata to new categories
              const metadata = {
                'parfum': { subtitle: 'Luxury Scents', accent: '#c9a96e' },
                'premium attars': { subtitle: 'Pure Essence', accent: '#a78bfa' },
                'oud reserve': { subtitle: 'Exotic Woods', accent: '#f59e0b' },
                'bakhoor': { subtitle: 'Sacred Smoke', accent: '#ef4444' },
                'aroma chemicals': { subtitle: 'Raw Ingredients', accent: '#38bdf8' }
              }[cat.value] || { subtitle: 'Explore', accent: '#c9a96e' };

              const cardContent = (
                <>
                  {/* Black gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900 transition-all duration-500" />

                  {/* Subtle pattern overlay */}
                  <div className="absolute inset-0 opacity-[0.04]" style={{
                    backgroundImage: `radial-gradient(circle at 25% 25%, ${metadata.accent} 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                  }} />

                  {/* Animated glow border on hover */}
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      boxShadow: `inset 0 0 30px ${metadata.accent}15, 0 0 20px ${metadata.accent}10`
                    }}
                  />

                  {/* Top accent line */}
                  <div
                    className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-3/4 transition-all duration-500 ease-out rounded-full"
                    style={{ backgroundColor: metadata.accent }}
                  />

                  {/* Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
                    {/* Decorative top element */}
                    <div
                      className="w-8 h-[1px] mb-4 opacity-40 group-hover:w-12 group-hover:opacity-80 transition-all duration-500"
                      style={{ backgroundColor: metadata.accent }}
                    />

                    {/* Subtitle */}
                    <span
                      className="text-[10px] sm:text-xs tracking-[0.25em] uppercase font-light mb-2 opacity-50 group-hover:opacity-80 transition-opacity duration-300"
                      style={{ color: metadata.accent }}
                    >
                      {metadata.subtitle}
                    </span>

                    {/* Category Name */}
                    <h3
                      className="text-white text-base sm:text-lg lg:text-xl font-bold tracking-wide group-hover:tracking-wider transition-all duration-500 leading-tight"
                      style={{
                        textShadow: `0 0 20px ${metadata.accent}30`
                      }}
                    >
                      {cat.label}
                    </h3>

                    {/* Decorative bottom element */}
                    <div
                      className="w-8 h-[1px] mt-4 opacity-40 group-hover:w-12 group-hover:opacity-80 transition-all duration-500"
                      style={{ backgroundColor: metadata.accent }}
                    />

                    {/* Explore / Coming Soon Link */}
                    <span className="mt-4 text-[10px] sm:text-xs text-white/40 group-hover:text-white/80 tracking-widest uppercase transition-all duration-300 flex items-center gap-1">
                        <>
                          Explore
                          <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform duration-300" />
                        </>
                    </span>
                  </div>

                  {/* Bottom accent line */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-3/4 transition-all duration-500 ease-out rounded-full"
                    style={{ backgroundColor: metadata.accent }}
                  />
                </>
              );

              return (
                <Link
                  key={cat.value}
                  to={cat.path}
                  className="group relative overflow-hidden rounded-2xl aspect-[3/4] cursor-pointer"
                  style={{
                    animationDelay: `${idx * 100}ms`,
                  }}
                >
                  {cardContent}
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-secondary/30 py-16 sm:py-20 lg:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12 sm:mb-16">
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Featured Collection</h2>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Handpicked selections from our premium collection
              </p>
            </div>
            {/* Scroll Buttons (Visible only when horizontal scroll is active - up to xl) */}
            <div className="flex gap-2 xl:hidden">
              <Button variant="outline" size="icon" onClick={scrollLeft} className="rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary">
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button variant="outline" size="icon" onClick={scrollRight} className="rounded-full border-primary/20 hover:bg-primary/10 hover:text-primary">
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-64 sm:h-72 w-full rounded-lg" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : error ? (
            <Alert variant="destructive" className="max-w-2xl mx-auto">
              <AlertDescription className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <span>{error}</span>
                <Button onClick={handleRetry} variant="outline" size="sm">
                  Try Again
                </Button>
              </AlertDescription>
            </Alert>
          ) : (Array.isArray(featuredProducts) && featuredProducts.length > 0) ? (
            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto pb-6 -mx-4 px-4 gap-4 snap-x snap-mandatory xl:grid xl:grid-cols-4 xl:gap-8 xl:overflow-visible xl:pb-0 xl:mx-0 xl:px-0 scrollbar-hide"
            >
              {featuredProducts.map((product) => (
                <div key={product.id} className="min-w-[260px] max-w-[260px] xl:min-w-0 xl:max-w-none snap-center">
                  <ProductCard
                    product={product}
                    onQuickView={(product) => {
                      setQuickViewProduct(product);
                      setIsQuickViewOpen(true);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-6">No featured products available at the moment.</p>
              <Button asChild variant="outline">
                <Link to="/products">
                  Browse All Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Recently Viewed Section */}
      <RecentlyViewed />

      {/* Stats / Numbers Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why Choose MUWAS?</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Numbers that speak for our commitment to quality
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {[
              {
                icon: Package,
                to: 50,
                suffix: '+',
                label: 'Premium Products',
                color: '#c9a96e',
              },
              {
                icon: Award,
                to: 100,
                suffix: '%',
                label: 'Authentic & Genuine',
                color: '#a78bfa',
              },
              {
                icon: Users,
                to: (() => {
                  // Base count on a fixed start date, increasing ~3-4 per day
                  const baseDate = new Date('2026-03-04');
                  const baseCount = 246;
                  const daysSince = Math.floor((Date.now() - baseDate.getTime()) / 86400000);
                  // Average 3 per day
                  return baseCount + (daysSince * 3);
                })(),
                suffix: '+',
                label: 'Happy Customers',
                color: '#38bdf8',
              },
              {
                icon: MapPin,
                to: 28,
                suffix: '+',
                label: 'States Delivered',
                color: '#f59e0b',
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="group relative bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sm:p-8 text-center hover:border-slate-600/80 transition-all duration-500 hover:bg-slate-800/60"
              >
                {/* Top accent line */}
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-0 group-hover:w-2/3 transition-all duration-500 rounded-full"
                  style={{ backgroundColor: stat.color }}
                />

                {/* Icon */}
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ backgroundColor: `${stat.color}15` }}
                >
                  <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>

                {/* Count */}
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 tabular-nums">
                  <CountUp
                    from={0}
                    to={stat.to}
                    duration={2.5}
                    delay={idx * 0.15}
                    separator=","
                    className="inline-block"
                  />
                  <span style={{ color: stat.color }}>{stat.suffix}</span>
                </div>

                {/* Label */}
                <p className="text-slate-400 text-sm sm:text-base font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                <CheckCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Authentic Products</h3>
              <p className="text-muted-foreground">100% Genuine Luxury Fragrance, Proudly Manufactured In-House</p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Fast Delivery</h3>
              <p className="text-muted-foreground">Pan-India delivery in 6 business days</p>
            </div>

            <div className="text-center space-y-4 sm:col-span-2 lg:col-span-1">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Secure Payment</h3>
              <p className="text-muted-foreground">Safe and encrypted transactions with Razorpay</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Curiosity didn't kill the cat - it just brought you here! You got questions. We've got answers. 💡
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                question: "What makes your fragrances different?",
                answer: "Our fragrances are carefully curated from premium international brands. Each scent is selected for its exceptional quality, longevity, and unique character. We ensure 100% authenticity with certifications from all brands."
              },
              {
                question: "Are your perfumes original and long-lasting?",
                answer: "Absolutely! All our perfumes are 100% original with authentic certificates. Most of our fragrances last 6-10 hours depending on skin chemistry. Eau de Parfum concentrations last longer than Eau de Toilette."
              },
              {
                question: "How long does delivery take?",
                answer: "Standard delivery takes about 6 business days across India. All orders are carefully packed to ensure the fragrance arrives in perfect condition."
              },
              {
                question: "Can I return or exchange a product?",
                answer: "Our products are non-returnable. However, if you receive a damaged product, you can request an exchange within 7 days of delivery. Simply contact our customer support with your order details and photos of the damage."
              },
              {
                question: "Do you offer samples or trial sizes?",
                answer: "Yes! We have a trial pack collection starting at just ₹299. It's perfect for exploring different fragrances before committing to a full-size bottle. Each trial pack includes 3-5 premium samples."
              },
              {
                question: "How do I choose the right fragrance for me?",
                answer: "Our AI Shopping Assistant Sophia is here to help! Chat with her to get personalized recommendations based on your preferences, occasion, and budget. You can also browse by category (Men, Women, Unisex) or visit our store for expert guidance."
              },
              {
                question: "Is my payment secure?",
                answer: "Completely secure! We use Razorpay - India's most trusted payment gateway. All transactions are encrypted and PCI-DSS compliant. We accept cards, UPI, wallets, and bank transfers."
              },
              {
                question: "Do you ship internationally?",
                answer: "Currently, we deliver across India. International shipping is coming soon! Subscribe to our newsletter to get notified when international delivery becomes available."
              }
            ].map((faq, idx) => (
              <FAQItem key={idx} question={faq.question} answer={faq.answer} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* Premium Offer Section - Risk Free Trial */}
      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Offer Details */}
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Try Our Fragrances
                <span className="block text-amber-400">Risk Free</span>
              </h2>

              <p className="text-lg text-slate-300">
                Discover your perfect scent with our premium trial collection. Quality guaranteed or your money back!
              </p>

              <div>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold px-8 py-4 rounded-lg transition-colors text-lg"
                >
                  Try Now
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
                <p className="text-sm text-slate-400 mt-3">*Terms & Conditions Apply</p>
              </div>
            </div>

            {/* Right Side - 4 Features */}
            <div className="grid grid-cols-2 gap-6">
              {[
                {
                  step: "1",
                  title: "Choose Your Scent",
                  desc: "Browse our curated collection of premium fragrances"
                },
                {
                  step: "2",
                  title: "Get Premium Quality",
                  desc: "100% authentic luxury fragrances guaranteed"
                },
                {
                  step: "3",
                  title: "7-Day Exchange",
                  desc: "Exchange within 7 days of delivery if product is damaged"
                },
                {
                  step: "4",
                  title: "Fast Delivery",
                  desc: "Non-returnable product. Pan-India delivery in 6 business days"
                }
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-800/50 border border-amber-600/30 rounded-lg p-6 hover:bg-slate-800/70 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg">
                      {item.step}
                    </div>
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-300 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Quick View Modal */}
      <ProductQuickView
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
      />

      {/* Purchase Notifications - Only on Home Page */}
      <PurchaseNotification />
    </div>
  );
}

function FAQItem({ question, answer, index }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="border border-slate-700 rounded-lg overflow-hidden bg-slate-800/50 hover:bg-slate-800/70 transition-colors"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 sm:py-5 flex items-center justify-between text-left hover:bg-slate-700/50 transition-colors"
      >
        <span className="font-semibold text-white text-base sm:text-lg pr-4">{question}</span>
        <span className={`flex-shrink-0 text-accent text-xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="px-6 py-4 sm:py-5 border-t border-slate-700 bg-slate-900/50">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
