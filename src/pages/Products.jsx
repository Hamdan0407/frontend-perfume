import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, X, Search } from 'lucide-react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import ProductQuickView from '../components/ProductQuickView';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { Label } from '../components/ui/label';
import { Checkbox } from '../components/ui/checkbox';

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
  const search = searchParams.get('search') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortDir = searchParams.get('sortDir') || 'DESC';

  useEffect(() => {
    fetchProducts();
    fetchBrands();
  }, [category, brand, search, page, sortBy, sortDir, minPrice, maxPrice, inStockOnly]);

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
      } else {
        url = `/products?${params.toString()}`;
      }

      const { data } = await api.get(url);
      
      // Filter by stock if checkbox is checked
      let filteredProducts = data.content;
      if (inStockOnly) {
        filteredProducts = filteredProducts.filter(p => p.stockQuantity > 0);
      }
      
      setProducts(filteredProducts);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await api.get('/products/brands');
      setBrands(data);
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
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            {category ? `${category}'s Fragrances` : search ? 'Search Results' : 'All Products'}
          </h1>
          {search && (
            <p className="text-muted-foreground">
              Showing results for "{search}"
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Category Filter */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">All Categories</option>
                    <option value="perfume">Perfume</option>
                    <option value="attar">Attar</option>
                    <option value="aroma chemicals">Aroma Chemicals</option>
                  </select>
                </div>

                {/* Brand Filter */}
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
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

                {/* Sort Filter */}
                <div className="space-y-2">
                  <Label htmlFor="sort">Sort By</Label>
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
                  <Label>Price Range (₹)</Label>
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
                    className="w-full" 
                    onClick={handlePriceFilter}
                    disabled={!minPrice && !maxPrice}
                  >
                    Apply
                  </Button>
                </div>

                {/* Stock Availability Filter */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="inStock"
                    checked={inStockOnly}
                    onCheckedChange={setInStockOnly}
                  />
                  <Label
                    htmlFor="inStock"
                    className="text-sm font-normal cursor-pointer"
                  >
                    In Stock Only
                  </Label>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={clearAllFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="space-y-4">
                    <Skeleton className="h-80 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
      
      {/* Quick View Modal */}
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
