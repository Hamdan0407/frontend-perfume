import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import ProductQuickView from '../components/ProductQuickView';
import ProductSort from '../components/ProductSort';
import { groupProducts } from '../utils/productUtils';
import { sortProducts } from '../utils/sortUtils';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '../components/ui/sheet';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [brands, setBrands] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const brand = searchParams.get('brand') || '';
  const type = searchParams.get('type') || '';
  const search = searchParams.get('search') || '';

  // Derive sortType from either new 'sort' parameter or legacy 'sortBy/sortDir'
  const sortType = useMemo(() => {
    const sortParam = searchParams.get('sort');
    if (sortParam) return sortParam;

    const legacySortBy = searchParams.get('sortBy');
    const legacySortDir = searchParams.get('sortDir');
    if (legacySortBy && legacySortDir) {
      if (legacySortBy === 'price' && legacySortDir === 'ASC') return 'price-asc';
      if (legacySortBy === 'price' && legacySortDir === 'DESC') return 'price-desc';
      if (legacySortBy === 'name' && legacySortDir === 'ASC') return 'name-asc';
      if (legacySortBy === 'rating' && legacySortDir === 'DESC') return 'rating-desc';
      if (legacySortBy === 'createdAt' && legacySortDir === 'DESC') return 'newest';
    }
    return 'featured';
  }, [searchParams]);

  // Map sortType to backend sorting fields
  const [backendSortBy, backendSortDir] = useMemo(() => {
    switch (sortType) {
      case 'featured':
        return ['featured', 'DESC'];
      case 'newest':
        return ['createdAt', 'DESC'];
      case 'price-asc':
        return ['price', 'ASC'];
      case 'price-desc':
        return ['price', 'DESC'];
      case 'name-asc':
        return ['name', 'ASC'];
      case 'rating-desc':
        return ['rating', 'DESC'];
      default:
        return ['createdAt', 'DESC'];
    }
  }, [sortType]);

  // Premium Client-Side Sorting on the final rendered products array
  const finalProducts = useMemo(() => {
    return sortProducts(products, sortType);
  }, [products, sortType]);

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, [category, brand, type, search, page, sortType, minPrice, maxPrice, inStockOnly]);

  const fetchProducts = async () => {
    setLoading(true);
    setProducts([]); // Clear existing products
    try {
      // Build request params with backend-supported sort fields
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', 12);
      params.append('sortBy', backendSortBy);
      params.append('sortDir', backendSortDir);

      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

      let url;
      if (search) {
        url = `/products/search?query=${search}&${params.toString()}`;
      } else if (category) {
        url = `/products/category/${category}?${params.toString()}`;
      } else if (brand) {
        url = `/products/brand/${brand}?${params.toString()}`;
      } else if (type) {
        url = `/products/type/${type}?${params.toString()}`;
      } else {
        url = `/products?${params.toString()}`;
      }

      console.log(`[Products] Requesting: ${url}`);
      const { data } = await api.get(url);

      // Standardize response content
      let content = data.content || (Array.isArray(data) ? data : []);

      // Filter by stock if checked
      if (inStockOnly) {
        content = content.filter(p => p.stock > 0);
      }

      // Group variants
      const grouped = groupProducts(content);

      setProducts(grouped);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('products/brands');
      setBrands(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch brands:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
    setPage(0);
  };

  const handlePriceFilter = () => {
    setPage(0);
    fetchProducts();
  };

  const clearAllFilters = () => {
    setSearchParams({});
    setPage(0);
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="mb-8 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2 capitalize">
            {category ? category : search ? 'Search Results' : 'All Products'}
          </h1>
          {search && (
            <p className="text-muted-foreground">
              Showing results for "{search}"
            </p>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar (Desktop) */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <Card className="sticky top-24 border-slate-100 shadow-sm">
              <FiltersContent
                category={category}
                brand={brand}
                brands={brands}
                minPrice={minPrice}
                maxPrice={maxPrice}
                inStockOnly={inStockOnly}
                setMinPrice={setMinPrice}
                setMaxPrice={setMaxPrice}
                setInStockOnly={setInStockOnly}
                handleFilterChange={handleFilterChange}
                handlePriceFilter={handlePriceFilter}
                clearAllFilters={clearAllFilters}
              />
            </Card>
          </div>

          {/* Products Grid Column */}
          <div className="flex-1">
            {/* Custom Premium Actions Bar (Unified for Desktop and Mobile) */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
              <div className="text-sm font-semibold text-slate-800 tracking-tight">
                {finalProducts.length} {finalProducts.length === 1 ? 'Product' : 'Products'}
              </div>
              
              <div className="flex items-center gap-3">
                {/* Mobile Filter Button */}
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden gap-2 border-slate-200 rounded-full px-4 h-10 text-sm font-medium">
                      <SlidersHorizontal className="h-4 w-4" />
                      Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] overflow-y-auto">
                    <SheetHeader className="text-left mb-4">
                      <SheetTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                      </SheetTitle>
                    </SheetHeader>
                    <FiltersContent
                      category={category}
                      brand={brand}
                      brands={brands}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      inStockOnly={inStockOnly}
                      setMinPrice={setMinPrice}
                      setMaxPrice={setMaxPrice}
                      setInStockOnly={setInStockOnly}
                      handleFilterChange={handleFilterChange}
                      handlePriceFilter={handlePriceFilter}
                      clearAllFilters={clearAllFilters}
                    />
                  </SheetContent>
                </Sheet>

                {/* Custom premium dropdown */}
                <ProductSort currentSort={sortType} onSortChange={(val) => handleFilterChange('sort', val)} />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-64 sm:h-80 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (Array.isArray(finalProducts) && finalProducts.length > 0) ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {finalProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickView={(product) => {
                        setQuickViewProduct(product);
                        setIsQuickViewOpen(true);
                      }}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-12">
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground px-4">
                      Page {page + 1} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page === totalPages - 1}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <p className="text-lg text-muted-foreground mb-4">No products found</p>
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                  >
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ProductQuickView
        product={quickViewProduct}
        isOpen={isQuickViewOpen}
        onClose={() => {
          setIsQuickViewOpen(false);
          setQuickViewProduct(null);
        }}
      />
    </div>
  );
}

function FiltersContent({
  category,
  brand,
  brands,
  minPrice,
  maxPrice,
  inStockOnly,
  setMinPrice,
  setMaxPrice,
  setInStockOnly,
  handleFilterChange,
  handlePriceFilter,
  clearAllFilters
}) {
  return (
    <>
      <CardHeader className="pb-3 border-b lg:border-none">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category" className="text-sm font-semibold">Category</Label>
          <select
            id="category"
            value={category ? category.toUpperCase().replace(/ /g, '_').replace(/-/g, '_') : ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Categories</option>
            <option value="PREMIUM_OIL">Premium Oil</option>
            <option value="BAKHOOR">Bakhoor</option>
            <option value="BOOSTERS_AND_BASES">Booster & Bases</option>
            <option value="AROMA_CHEMICALS">Aroma Chemicals</option>
            <option value="INCENSE">Incense</option>
          </select>
        </div>

        {/* Brand Filter */}
        <div className="space-y-2">
          <Label htmlFor="brand" className="text-sm font-semibold">Brand</Label>
          <select
            id="brand"
            value={brand}
            onChange={(e) => handleFilterChange('brand', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {/* Price Range Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Price Range (₹)</Label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button
            size="sm"
            className="w-full mt-2"
            onClick={handlePriceFilter}
            disabled={!minPrice && !maxPrice}
          >
            Apply
          </Button>
        </div>

        {/* Stock Availability Filter */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="inStock"
            checked={inStockOnly}
            onCheckedChange={setInStockOnly}
          />
          <Label
            htmlFor="inStock"
            className="text-sm font-medium cursor-pointer"
          >
            In Stock Only
          </Label>
        </div>

        <div className="pt-4 border-t">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={clearAllFilters}
          >
            <X className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        </div>
      </CardContent>
    </>
  );
}

