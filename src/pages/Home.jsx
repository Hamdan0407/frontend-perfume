import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { ShieldCheck, Truck, CheckCircle, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import productAPI from '../api/productAPI';
import ProductCard from '../components/ProductCard';
import ProductQuickView from '../components/ProductQuickView';
import RecentlyViewed from '../components/RecentlyViewed';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Skeleton } from '../components/ui/skeleton';
import { LoadingSpinner } from '../components/ui/spinner';
import PurchaseNotification from '../components/PurchaseNotification';
import DemoIntro from '../components/DemoIntro';
import LoginSuccessAnimation from '../components/LoginSuccessAnimation';

import '../styles/HomeTheme.css';

// Memory flag to track intro animation per session (reset on reload)
let hasViewedIntro = false;

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    const shouldShow = sessionStorage.getItem('showIntroOnNextLoad');
    if (shouldShow) {
      sessionStorage.removeItem('showIntroOnNextLoad');
      hasViewedIntro = false;
      return true;
    }
    return !hasViewedIntro;
  });
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const toast = useToast();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const handleIntroComplete = () => {
    setShowIntro(false);
    hasViewedIntro = true;
    // Trigger custom login animation after intro
    setShowLoginSuccess(true);
  };

  const fetchFeaturedProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await productAPI.getFeaturedProducts(8);
      setFeaturedProducts(Array.isArray(data.content) ? data.content : []);
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
      {showIntro && <DemoIntro onComplete={handleIntroComplete} />}
      {showLoginSuccess && <LoginSuccessAnimation onComplete={() => setShowLoginSuccess(false)} />}
      {/* Hero Section */}
      {/* Hero Section - Split Layout */}
      <section className="relative bg-gradient-to-br from-primary via-slate-800 to-slate-900 text-white overflow-hidden min-h-[85vh] flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDEzNEgxNHYtMjFoMjJ2MjF6bTAgMTlIMTR2LTIxaDIydjIxeiIvPjwvZz48L2c+PC9zdmc+')] opacity-10"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Left Content - Text */}
            <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000 fill-mode-backwards text-center lg:text-left order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm font-medium border border-white/20 mx-auto lg:mx-0">
                <Sparkles className="h-4 w-4 text-accent" />
                <span>Premium Fragrances Collection</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
                Discover Your <br className="hidden lg:block" />
                <span className="text-accent">Signature Scent</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto lg:mx-0 font-light tracking-wide">
                Exquisite luxury fragrances crafted for elegance. Experience the essence of true sophistication this season.
              </p>

              <div className="pt-4 flex justify-center lg:justify-start">
                <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-white h-14 px-10 text-lg shadow-lg hover:shadow-accent/50 transition-all duration-300 hover:scale-105">
                  <Link to="/products" className="flex items-center gap-2">
                    Explore Collection
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Content - Image */}
            <div className="relative animate-in fade-in slide-in-from-right-8 duration-1000 delay-200 fill-mode-backwards order-1 lg:order-2 flex justify-center">
              <div className="relative w-full max-w-lg lg:max-w-xl aspect-square lg:aspect-auto">
                <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full opacity-30 animate-pulse"></div>
                <img
                  src="/hero-main.jpg"
                  alt="Muwas Premium Oud"
                  className="relative w-full h-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-700 ease-out z-10 rounded-2xl"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Shop by Category</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find the perfect fragrance tailored to your style
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {['Perfume', 'Attar', 'Aroma Chemicals'].map((category, idx) => {
              const images = {
                'Perfume': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500', // Classic Perfume Bottle
                'Attar': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=500',   // Dark/Premium Bottle for Attar
                'Aroma Chemicals': 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=500' // Clean/Scientific looking bottle
              };
              return (
                <Link
                  key={category}
                  to={`/products?category=${category}`}
                  className="group relative overflow-hidden rounded-xl aspect-[4/5] sm:aspect-square lg:aspect-[4/5]"
                >
                  <img
                    src={images[category]}
                    alt={`${category}'s Fragrances`}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                  <div className="absolute inset-0 flex flex-col items-center justify-end p-6 sm:p-8">
                    <h3 className="text-white text-2xl sm:text-3xl font-bold mb-2">{category}</h3>
                    <span className="text-white/90 text-sm group-hover:underline">Explore →</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-secondary/30 py-16 sm:py-20 lg:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12 sm:mb-16">
            <div className="text-left">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Featured Fragrances</h2>
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
          ) : featuredProducts.length > 0 ? (
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

      {/* Features */}
      <section className="py-16 sm:py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                <CheckCircle className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Authentic Products</h3>
              <p className="text-muted-foreground">100% genuine luxury fragrances from authorized distributors</p>
            </div>

            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground">Fast Delivery</h3>
              <p className="text-muted-foreground">Free shipping on orders over ₹899 • 3-5 business days</p>
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
                answer: "Standard delivery takes 3-5 business days across India. Express delivery (1-2 days) is available for selected locations. All orders are carefully packed to ensure the fragrance arrives in perfect condition. Free shipping on orders above ₹899."
              },
              {
                question: "Can I return or exchange a product?",
                answer: "Yes! We offer 30-day returns on unopened products. If a fragrance doesn't suit you, we can help you exchange it for another. Simply contact our customer support with your order details."
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
                  to="/products?category=Featured"
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
                  title: "30-Day Returns",
                  desc: "Try risk-free. Return or exchange within 30 days"
                },
                {
                  step: "4",
                  title: "Fast Delivery",
                  desc: "Free shipping on orders above ₹899"
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
      {/* <PurchaseNotification /> */}
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
