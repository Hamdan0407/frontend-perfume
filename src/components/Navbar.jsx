import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Package, Shield, Heart, Search, BarChart3, ChevronDown, Menu, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useEffect, useState } from 'react';
import api from '../api/axios';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from './ui/sheet';
import { CATEGORY_LIST } from '../constants/productCategories';
import BulkInquiryModal from './BulkInquiryModal';

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
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          {/* Left Side: Mobile Menu & Logo */}
          <div className="flex items-center gap-2 md:gap-4">
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
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Collections</p>
                      {CATEGORY_LIST.map(cat => (
                        <Link
                          key={cat.value}
                          to={cat.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block pl-4 py-2 text-base hover:bg-accent/10 rounded-md transition-colors"
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

            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5 ml-1 sm:ml-0">
              <div className="flex items-center gap-2">
                <img src="/muwas-logo-nobg.png" alt="Muwas Logo" className="h-10 w-auto" />
              </div>
              <span className="text-[8px] sm:text-[10px] font-bold text-accent border border-accent/30 px-1 rounded opacity-60 hidden xs:inline">v2.1</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 ml-8">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Home
            </Link>

            {/* Collections Dropdown */}
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Collections
                <ChevronDown className="h-4 w-4" />
              </button>
              <div className="absolute left-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                {CATEGORY_LIST.filter(cat => cat.value !== 'aroma chemicals').map(cat => (
                  <Link
                    key={cat.value}
                    to={cat.path}
                    className="block px-4 py-2 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    {cat.label}
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/products?category=aroma chemicals"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Aroma Chemicals
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <form onSubmit={handleSearch} className="hidden lg:block flex-1 max-w-lg mx-8 relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="search-desktop"
                name="search"
                type="text"
                placeholder="Search perfumes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                autoComplete="off"
                className="w-full pl-10 pr-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && (searchQuery.length >= 2) && (
              <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-lg shadow-xl mt-1 z-50 overflow-hidden">
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
                        }}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors"
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
                          <div className="flex items-center gap-2 mt-0.5">
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
                    <button
                      onClick={handleSearch}
                      className="w-full px-4 py-2 text-xs text-center text-primary font-medium hover:bg-gray-50 dark:hover:bg-slate-900 border-t"
                    >
                      View all results
                    </button>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No products found</div>
                )}
              </div>
            )}
          </form>

          {/* Right Side Icons */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            >
              <Search className="h-5 w-5" />
            </Button>

            {/* Theme Toggle removed for static light theme */}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setBulkInquiryOpen(true)}
              className="hidden md:inline-flex border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              Bulk Enquiry
            </Button>

            {isAuthenticated ? (
              <>
                {/* Cart */}
                <Link to="/cart" className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-accent">
                        {itemCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* Desktop User Profile Dropdown */}
                <div className="relative hidden sm:block">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="relative"
                    title="Account Menu"
                  >
                    <User className="h-5 w-5" />
                  </Button>

                  {dropdownOpen && (
                    <div className="absolute -right-2 top-12 w-56 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 rounded-lg shadow-xl z-[9999]">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                        <p className="text-sm font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                      </div>

                      <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>

                      <Link to="/orders" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <Package className="h-4 w-4" />
                        My Orders
                      </Link>

                      <Link to="/wishlist" className="flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                        <Heart className="h-4 w-4" />
                        Wishlist
                      </Link>

                      {user?.role === 'ADMIN' && (
                        <>
                          <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>
                          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm text-blue-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                            <BarChart3 className="h-4 w-4" />
                            Dashboard
                          </Link>
                          <Link to="/admin" className="flex items-center gap-3 px-4 py-3 text-sm text-orange-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors" onClick={() => setDropdownOpen(false)}>
                            <Shield className="h-4 w-4" />
                            Admin Panel
                          </Link>
                        </>
                      )}

                      <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>

                      <button onClick={() => { logout(); setDropdownOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-left">
                        <LogOut className="h-4 w-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">Login</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/register">Sign Up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search Bar (Collapsible) */}
        {mobileSearchOpen && (
          <div className="lg:hidden pb-4 px-2 animate-in slide-in-from-top-2 relative">
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
