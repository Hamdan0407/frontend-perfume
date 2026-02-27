package com.perfume.shop.controller;

import com.perfume.shop.dto.ProductFilterRequest;
import com.perfume.shop.dto.ProductResponse;
import com.perfume.shop.entity.enums.Category;
import com.perfume.shop.entity.User;
import com.perfume.shop.service.ProductService;
import com.perfume.shop.service.ProductViewService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

/**
 * Product Controller - Public endpoints for product catalog.
 * 
 * All endpoints return only active products unless otherwise specified.
 * Supports pagination, sorting, filtering, and search functionality.
 */
@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;
    private final ProductViewService productViewService;

    /**
     * Create pageable with sort configuration.
     * 
     * @param page    Page number (0-indexed)
     * @param size    Page size
     * @param sortBy  Field to sort by
     * @param sortDir Sort direction (ASC or DESC)
     * @return Configured Pageable
     */
    private Pageable createPageable(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("ASC")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        return PageRequest.of(page, size, sort);
    }

    /**
     * Get all active products with pagination and sorting.
     * 
     * @param page    Page number (default: 0)
     * @param size    Page size (default: 12)
     * @param sortBy  Sort field (default: createdAt)
     * @param sortDir Sort direction (default: DESC)
     * @return Page of products
     */
    @GetMapping
    public ResponseEntity<Page<ProductResponse>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        return ResponseEntity.ok(productService.getAllProducts(pageable));
    }

    /**
     * Get single product by ID.
     * Also tracks the product view for recently viewed feature.
     * 
     * @param id      Product ID
     * @param user    Authenticated user (optional)
     * @param session HTTP session for guest tracking
     * @return Product details
     */
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponse> getProductById(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            HttpSession session) {
        // Track product view asynchronously
        String sessionId = session.getId();
        productViewService.trackProductView(id, user, sessionId);

        return ResponseEntity.ok(productService.getProductById(id));
    }

    /**
     * Get products by category with pagination.
     * 
     * @param category Category name
     * @param page     Page number
     * @param size     Page size
     * @param sortBy   Sort field
     * @param sortDir  Sort direction
     * @return Page of products in category
     */
    @GetMapping("/category/{category}")
    public ResponseEntity<Page<ProductResponse>> getProductsByCategory(
            @PathVariable Category category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        return ResponseEntity.ok(productService.getProductsByCategory(category, pageable));
    }

    /**
     * Get products by brand with pagination.
     * 
     * @param brand   Brand name
     * @param page    Page number
     * @param size    Page size
     * @param sortBy  Sort field
     * @param sortDir Sort direction
     * @return Page of products by brand
     */
    @GetMapping("/brand/{brand}")
    public ResponseEntity<Page<ProductResponse>> getProductsByBrand(
            @PathVariable String brand,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        return ResponseEntity.ok(productService.getProductsByBrand(brand, pageable));
    }

    /**
     * Get featured products (no pagination).
     * 
     * @return List of featured products
     */
    @GetMapping("/featured")
    public ResponseEntity<List<ProductResponse>> getFeaturedProducts() {
        return ResponseEntity.ok(productService.getFeaturedProducts());
    }

    /**
     * Search products by query string.
     * Searches in product name, description, brand, and category.
     * 
     * @param query   Search query
     * @param page    Page number
     * @param size    Page size
     * @param sortBy  Sort field
     * @param sortDir Sort direction
     * @return Page of matching products
     */
    @GetMapping("/search")
    public ResponseEntity<Page<ProductResponse>> searchProducts(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir) {
        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        return ResponseEntity.ok(productService.searchProducts(query, pageable));
    }

    /**
     * Get products by price range.
     * 
     * @param minPrice Minimum price (inclusive)
     * @param maxPrice Maximum price (inclusive)
     * @param page     Page number
     * @param size     Page size
     * @param sortBy   Sort field
     * @param sortDir  Sort direction
     * @return Page of products in price range
     */
    @GetMapping("/price-range")
    public ResponseEntity<Page<ProductResponse>> getProductsByPriceRange(
            @RequestParam BigDecimal minPrice,
            @RequestParam BigDecimal maxPrice,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size,
            @RequestParam(defaultValue = "price") String sortBy,
            @RequestParam(defaultValue = "ASC") String sortDir) {
        Pageable pageable = createPageable(page, size, sortBy, sortDir);
        return ResponseEntity.ok(productService.getProductsByPriceRange(minPrice, maxPrice, pageable));
    }

    /**
     * Advanced filtering with multiple criteria.
     * Supports filtering by category, brand, price range, and more.
     * 
     * @param filter Filter criteria
     * @return Page of filtered products
     */
    @PostMapping("/filter")
    public ResponseEntity<Page<ProductResponse>> filterProducts(
            @RequestBody ProductFilterRequest filter) {
        return ResponseEntity.ok(productService.filterProducts(filter));
    }

    /**
     * Get all available brands.
     * 
     * @return List of unique brand names
     */
    @GetMapping("/brands")
    public ResponseEntity<List<String>> getAllBrands() {
        return ResponseEntity.ok(productService.getAllBrands());
    }

    /**
     * Get all available categories.
     * 
     * @return List of unique category names
     */
    @GetMapping("/categories")
    public ResponseEntity<List<Category>> getAllCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }

    /**
     * Get related products based on category and brand.
     * 
     * @param id    Product ID to find related products for
     * @param limit Maximum number of related products to return (default: 4)
     * @return List of related products
     */
    @GetMapping("/{id}/related")
    public ResponseEntity<List<ProductResponse>> getRelatedProducts(
            @PathVariable Long id,
            @RequestParam(defaultValue = "4") int limit) {
        return ResponseEntity.ok(productService.getRelatedProducts(id, limit));
    }

    /**
     * Get recently viewed products for current user/session.
     * Returns products the user has recently viewed.
     * 
     * @param user    Authenticated user (optional)
     * @param session HTTP session for guest tracking
     * @param limit   Maximum number of products to return (default: 10)
     * @return List of recently viewed products
     */
    @GetMapping("/recently-viewed")
    public ResponseEntity<List<ProductResponse>> getRecentlyViewed(
            @AuthenticationPrincipal User user,
            HttpSession session,
            @RequestParam(defaultValue = "10") int limit) {
        String sessionId = user == null ? session.getId() : null;
        return ResponseEntity.ok(productViewService.getRecentlyViewed(user, sessionId, limit));
    }
}
