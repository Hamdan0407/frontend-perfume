import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Shield, Heart, Search, BarChart3, ChevronDown, Menu, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import BulkInquiryModal from './BulkInquiryModal';

// Navbar-specific categories — curated display order for navigation dropdown
const NAVBAR_CATEGORIES = [
  { label: 'Premium Oil', value: 'premium attars', path: '/products?category=premium attars' },
  { label: 'Bakhoor', value: 'bakhoor', path: '/products?category=bakhoor' },
];

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { itemCount, setCart } = useCartStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bulkInquiryOpen, setBulkInquiryOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const { data } = await api.get('cart');
      setCart(data);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        fetchSuggestions();
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`products?search=${encodeURIComponent(searchQuery)}&size=5`);
      setSuggestions(data.content || []);
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileSearchOpen(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Row 1: Hamburger (mobile) | Logo (center) | Search + Login + Profile/Cart (right) */}
        <div className="relative flex items-center justify-between h-[72px]">

          {/* Left: Hamburger menu (mobile only) */}
          <div className="flex items-center">
            {/* Mobile Menu Trigger */}
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <img src="/muwas-logo-nobg.png" alt="Muwas Logo" className="h-10 w-auto" />
                      </div>
                    </SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-4 mt-8">
                    <Link to="/" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium hover:text-accent transition-colors">
                      Home
                    </Link>
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.2em] mb-3">Collections</p>
                      {NAVBAR_CATEGORIES.map(cat => (
                          <Link
                            key={cat.value}
                            to={cat.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="block pl-4 py-2.5 text-[15px] tracking-wide hover:bg-accent/10 rounded-md transition-all duration-200"
                            id={`nav-category-${cat.value}`}
                          >
                            {cat.label}
                          </Link>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        setBulkInquiryOpen(true);
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-2 py-2 text-base text-amber-600 font-medium w-full text-left"
                    >
                      <TrendingUp className="h-4 w-4" /> Bulk Enquiry
                    </button>

                    {isAuthenticated ? (
                      <div className="space-y-2 pt-4 border-t">
                        <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-base hover:text-accent">
                          <User className="h-4 w-4" /> My Profile
                        </Link>
                        <Link to="/orders" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-base hover:text-accent">
                          <Package className="h-4 w-4" /> My Orders
                        </Link>
                        <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-base hover:text-accent">
                          <Heart className="h-4 w-4" /> Wishlist
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <>
                            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-base text-blue-600 font-semibold">
                              <BarChart3 className="h-4 w-4" /> Dashboard
                            </Link>
                            <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-base text-orange-600 font-semibold">
                              <Shield className="h-4 w-4" /> Admin Panel
                            </Link>
                          </>
                        )}
                        <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 py-2 text-base text-red-600 w-full text-left">
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-4 border-t">
                        <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-base hover:text-accent font-medium">
                          <User className="h-4 w-4" /> Login
                        </Link>
                        <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-base hover:text-accent font-medium">
                          <TrendingUp className="h-4 w-4" /> Create Account
                        </Link>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Center: Logo */}
          <div className="flex items-center justify-center justify-self-center">
            <Link to="/" className="flex items-center">
              <img src="/muwas-logo-nobg.png" alt="Muwas Logo" className="h-11 w-auto" />
            </Link>
          </div>

          {/* Right: Search → Login/Profile → Cart */}
          <div className="flex items-center gap-3 justify-self-end">
            {/* Search Icon */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors duration-300"
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px] stroke-[1.5]" />
            </button>

            {/* Desktop: Auth + Cart */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated ? (
                <>
                  {/* User Profile Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors duration-300"
                      title="Account Menu"
                    >
                      <User className="h-[18px] w-[18px] stroke-[1.5]" />
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-[9999]">
                        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                          <p className="text-sm font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </div>
                        <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <User className="h-4 w-4" /> My Profile
                        </Link>
                        <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <Package className="h-4 w-4" /> My Orders
                        </Link>
                        <Link to="/wishlist" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                          <Heart className="h-4 w-4" /> Wishlist
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <>
                            <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                              <BarChart3 className="h-4 w-4" /> Dashboard
                            </Link>
                            <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-orange-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                              <Shield className="h-4 w-4" /> Admin Panel
                            </Link>
                          </>
                        )}
                        <div className="border-t border-gray-100 dark:border-slate-700 my-1"></div>
                        <button onClick={() => { logout(); setDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-left">
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Cart */}
                  <Link to="/cart" className="relative flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors duration-300">
                    <ShoppingCart className="h-[18px] w-[18px] stroke-[1.5]" />
                    {itemCount > 0 && (
                      <Badge className="absolute -top-0.5 -right-0.5 h-[18px] w-[18px] p-0 flex items-center justify-center text-[9px] bg-accent">
                        {itemCount}
                      </Badge>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  {/* Login text */}
                  <Link to="/login" className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors duration-300 tracking-wide">
                    Login
                  </Link>
                  {/* Profile/Register icon */}
                  <Link to="/register" className="flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors duration-300" title="Create Account">
                    <User className="h-[18px] w-[18px] stroke-[1.5]" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile: Cart icon (always visible on mobile when authenticated) */}
            {isAuthenticated && (
              <div className="md:hidden">
                <Link to="/cart" className="relative flex items-center justify-center w-10 h-10 text-muted-foreground hover:text-foreground transition-colors duration-300">
                  <ShoppingCart className="h-[18px] w-[18px] stroke-[1.5]" />
                  {itemCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-[18px] w-[18px] p-0 flex items-center justify-center text-[9px] bg-accent">
                      {itemCount}
                    </Badge>
                  )}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Desktop Navigation Links */}
        <div className="hidden md:flex items-center justify-center gap-10 h-11 border-t border-border/30">
          <Link to="/" className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground after:transition-all after:duration-300 hover:after:w-full">
            Home
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-1.5 text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground after:transition-all after:duration-300 group-hover:after:w-full">
              Collections
              <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-3 w-52 bg-white border border-gray-100 rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 ease-out translate-y-2 group-hover:translate-y-0 z-50 py-2">
              {NAVBAR_CATEGORIES.map(cat => (
                <Link key={cat.value} to={cat.path} className="block px-5 py-2.5 text-[13px] tracking-wide text-gray-500 hover:text-foreground hover:bg-gray-50 transition-all duration-200 hover:pl-6" id={`nav-desktop-category-${cat.value}`}>
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
          <Link to="/products?category=aroma chemicals" className="text-[13px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors duration-300 relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-[1.5px] after:bg-foreground after:transition-all after:duration-300 hover:after:w-full">
            Aroma Chemicals
          </Link>
          <button onClick={() => setBulkInquiryOpen(true)} className="text-[13px] font-medium uppercase tracking-[0.12em] text-amber-600 hover:text-amber-700 transition-colors duration-300">
            Bulk Enquiry
          </button>
        </div>

        {/* Search Bar (Collapsible - used on all screen sizes) */}
        {mobileSearchOpen && (
          <div className="pb-4 px-2 animate-in slide-in-from-top-2 relative border-t border-border/30">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="search-mobile"
                  name="search"
                  type="text"
                  placeholder="Search perfumes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  autoFocus
                  autoComplete="off"
                  className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring shadow-sm"
                />
              </div>
            </form>

            {/* Mobile Suggestions Dropdown */}
            {showSuggestions && (searchQuery.length >= 2) && (
              <div className="absolute top-full left-0 right-0 mx-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg shadow-xl mt-1 z-50 overflow-hidden">
                {loading ? (
                  <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                ) : suggestions.length > 0 ? (
                  <div className="py-1">
                    {suggestions.map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        onClick={() => {
                          setSearchQuery('');
                          setShowSuggestions(false);
                          setMobileSearchOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors"
                      >
                        <div className="h-10 w-10 rounded bg-gray-50 flex-shrink-0">
                          <img
                            src={product.imageUrl || '/placeholder-perfume.png'}
                            alt={product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{product.name} {product.size ? `(${product.size}${product.unit || (product.category === 'aroma chemicals' ? 'g' : 'ml')})` : ''}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">₹{Math.round(product.price)}</span>
                            {product.stock > 0 ? (
                              <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded leading-none">In Stock</span>
                            ) : (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded leading-none">Out of Stock</span>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No products found</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <BulkInquiryModal isOpen={bulkInquiryOpen} onOpenChange={setBulkInquiryOpen} />
    </nav>
  );
}
