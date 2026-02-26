import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Search, ChevronDown, SlidersHorizontal } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import ProductQuickView from '../components/ProductQuickView';
import { groupProducts } from '../utils/productUtils';
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
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDir = searchParams.get('sortDir') || 'DESC';


  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, [category, brand, type, search, page, sortBy, sortDir, minPrice, maxPrice, inStockOnly]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/products?page=${page}&size=12&sortBy=${sortBy}&sortDir=${sortDir}`;

      // Add price range if specified
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('size', 12);
      params.append('sortBy', sortBy);
      params.append('sortDir', sortDir);

      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);

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

      const { data } = await api.get(url);

      // Standardize response content - handle both paginated content and direct list
      let content = data.content || (Array.isArray(data) ? data : []);

      // Filter by stock if checkbox is checked
      if (inStockOnly) {
        content = content.filter(p => p.stock > 0);
      }

      setProducts(groupProducts(content));
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
          {/* Mobile Filters Trigger */}
          <div className="lg:hidden flex items-center justify-between gap-4 mb-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="flex-1 gap-2 border-slate-200">
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
                  sortBy={sortBy}
                  sortDir={sortDir}
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

            <div className="flex-1">
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [newSortBy, newSortDir] = e.target.value.split('-');
                  handleFilterChange('sortBy', newSortBy);
                  handleFilterChange('sortDir', newSortDir);
                }}
                className="w-full h-10 rounded-md border border-slate-200 bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring"
              >
                <option value="createdAt-DESC">Newest</option>
                <option value="price-ASC">Price: Low</option>
                <option value="price-DESC">Price: High</option>
                <option value="name-ASC">Name: A-Z</option>
                <option value="rating-DESC">Rating</option>
              </select>
            </div>
          </div>

          {/* Filters Sidebar (Desktop) */}
          <div className="hidden lg:block lg:w-64 flex-shrink-0">
            <Card className="sticky top-24 border-slate-100 shadow-sm">
              <FiltersContent
                category={category}
                brand={brand}
                brands={brands}
                sortBy={sortBy}
                sortDir={sortDir}
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

          {/* Products Grid */}
          <div className="flex-1">
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
            ) : (Array.isArray(products) && products.length > 0) ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                  {products.map((product) => (
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
  sortBy,
  sortDir,
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
            value={category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Categories</option>
            <option value="perfume">Parfum</option>
            <option value="premium attars">Premium Attars</option>
            <option value="oud reserve">Oud Reserve</option>
            <option value="bakhoor">Bakhoor</option>
            <option value="aroma chemicals">Aroma Chemicals</option>
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

        {/* Sort Filter (Desktop Only) */}
        <div className="hidden lg:block space-y-2">
          <Label htmlFor="sort" className="text-sm font-semibold">Sort By</Label>
          <select
            id="sort"
            value={`${sortBy}-${sortDir}`}
            onChange={(e) => {
              const [newSortBy, newSortDir] = e.target.value.split('-');
              handleFilterChange('sortBy', newSortBy);
              handleFilterChange('sortDir', newSortDir);
            }}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="createdAt-DESC">Newest First</option>
            <option value="price-ASC">Price: Low to High</option>
            <option value="price-DESC">Price: High to Low</option>
            <option value="name-ASC">Name: A to Z</option>
            <option value="rating-DESC">Highest Rated</option>
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

