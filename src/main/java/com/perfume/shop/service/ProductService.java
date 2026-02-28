package com.perfume.shop.service;

import com.perfume.shop.dto.ProductFilterRequest;
import com.perfume.shop.dto.ProductRequest;
import com.perfume.shop.dto.ProductResponse;
import com.perfume.shop.dto.ProductVariantRequest;
import com.perfume.shop.entity.Product;
import com.perfume.shop.entity.ProductVariant;
import com.perfume.shop.entity.enums.Category;
import com.perfume.shop.exception.ApplicationException;
import com.perfume.shop.exception.ErrorType;
import com.perfume.shop.exception.ResourceNotFoundException;
import com.perfume.shop.repository.ProductRepository;
import com.perfume.shop.repository.ProductVariantRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.dao.DataIntegrityViolationException;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductVariantRepository productVariantRepository;

    // ==================== Public Product Queries ====================

    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable)
                .map(ProductResponse::fromEntity);
    }

    @Cacheable(value = "products", key = "#id")
    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        if (!product.getActive()) {
            throw new RuntimeException("Product is not available");
        }

        return ProductResponse.fromEntity(product);
    }

    public Product getProductEntityById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id.toString()));
    }

    @Cacheable(value = "categories", key = "#category + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Page<ProductResponse> getProductsByCategory(Category category, Pageable pageable) {
        return productRepository.findByCategoryAndActiveTrue(category, pageable)
                .map(ProductResponse::fromEntity);
    }

    @Cacheable(value = "categories", key = "#brand + '_' + #pageable.pageNumber + '_' + #pageable.pageSize")
    public Page<ProductResponse> getProductsByBrand(String brand, Pageable pageable) {
        return productRepository.findByBrandAndActiveTrue(brand, pageable)
                .map(ProductResponse::fromEntity);
    }

    @Cacheable(value = "featured-products", key = "'all'")
    public List<ProductResponse> getFeaturedProducts() {
        log.info("DEBUG: getFeaturedProducts() called");
        try {
            long totalCount = productRepository.count();
            long activeCount = productRepository.countActiveProducts();
            List<Product> products = productRepository.findByFeaturedTrueAndActiveTrueOrderByUpdatedAtDesc();

            log.info("DEBUG: Database Stats - Total: {}, Active: {}, Featured: {}",
                    totalCount, activeCount, products.size());

            if (!products.isEmpty()) {
                log.info("DEBUG: Featured product names: {}",
                        products.stream().map(Product::getName).collect(Collectors.joining(", ")));
            } else {
                log.warn("DEBUG: No featured products found in database!");
            }

            List<ProductResponse> responses = products.stream()
                    .map(product -> {
                        try {
                            return ProductResponse.fromEntity(product);
                        } catch (Exception e) {
                            log.error("Error converting product - {}", e.getMessage(), e);
                            throw new RuntimeException("Error processing product: " + e.getMessage());
                        }
                    })
                    .collect(Collectors.toList());

            log.info("Successfully converted {} products to responses", responses.size());
            return responses;
        } catch (Exception e) {
            log.error("CRITICAL: Failed to fetch featured products", e);
            throw new RuntimeException("Failed to fetch featured products: " + e.getMessage(), e);
        }
    }

    public Page<ProductResponse> searchProducts(String query, Pageable pageable) {
        return productRepository.searchProducts(query, pageable)
                .map(ProductResponse::fromEntity);
    }

    public Page<ProductResponse> getProductsByPriceRange(BigDecimal minPrice, BigDecimal maxPrice, Pageable pageable) {
        return productRepository.findByPriceRange(minPrice, maxPrice, pageable)
                .map(ProductResponse::fromEntity);
    }

    public Page<ProductResponse> filterProducts(ProductFilterRequest filter) {
        log.info("DEBUG: Filter Request - Category: {}, Search: {}, Brands: {}, Price: {} - {}, InStock: {}",
                filter.getCategory(), filter.getSearchQuery(), filter.getBrands(),
                filter.getMinPrice(), filter.getMaxPrice(), filter.getInStock());

        int page = filter.getPage() != null ? filter.getPage() : 0;
        int size = filter.getSize() != null ? filter.getSize() : 12;
        String sortBy = filter.getSortBy() != null ? filter.getSortBy() : "createdAt";
        String sortDir = filter.getSortDir() != null ? filter.getSortDir() : "DESC";

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir), sortBy);
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Product> productPage;
        try {
            if (filter.getSearchQuery() != null && !filter.getSearchQuery().isBlank()) {
                productPage = productRepository.searchWithFilters(
                        filter.getSearchQuery(),
                        filter.getCategory(),
                        filter.getMinPrice(),
                        filter.getMaxPrice(),
                        pageable);
            } else {
                productPage = productRepository.findByFilters(
                        filter.getCategory(),
                        filter.getBrands(),
                        filter.getMinPrice(),
                        filter.getMaxPrice(),
                        filter.getFeatured(),
                        filter.getMinRating(),
                        filter.getInStock(),
                        pageable);
            }

            log.info("DEBUG: Filter Result - Total Elements: {}", productPage.getTotalElements());

            // If PARFUM is requested and result is empty, log some stats
            if (filter.getCategory() == Category.PARFUM && productPage.isEmpty()) {
                long totalParfum = productRepository.findAll().stream()
                        .filter(p -> p.getCategory() == Category.PARFUM)
                        .count();
                long activeParfum = productRepository.findAll().stream()
                        .filter(p -> p.getCategory() == Category.PARFUM && p.getActive())
                        .count();
                log.warn("DEBUG: No Parfum products found in filter! DB Stats - Total Parfum: {}, Active Parfum: {}",
                        totalParfum, activeParfum);
            }

            return productPage.map(product -> {
                try {
                    return ProductResponse.fromEntity(product);
                } catch (Exception e) {
                    log.error("DEBUG: Error converting product ID {}: {}", product.getId(), e.getMessage());
                    throw e;
                }
            });
        } catch (Exception e) {
            log.error("DEBUG: Filter operation failed", e);
            throw new RuntimeException("Filter failed: " + e.getMessage());
        }
    }

    public List<String> getAllBrands() {
        return productRepository.findDistinctBrandByActiveTrue();
    }

    public List<Category> getAllCategories() {
        return productRepository.findDistinctCategories();
    }

    /**
     * Get all active products (for chatbot AI context) - limited to avoid token
     * overflow
     */
    public List<Product> getAllProducts() {
        Pageable limit = PageRequest.of(0, 50); // Limit to 50 products for AI context
        return productRepository.findByActiveTrue(limit).getContent();
    }

    /**
     * Find product by exact name (case-insensitive) - for chatbot recommendations
     */
    public Product findProductByName(String name) {
        if (name == null || name.isEmpty())
            return null;
        return productRepository.findByNameIgnoreCaseAndActiveTrue(name).orElse(null);
    }

    /**
     * Find product by name containing keyword - for chatbot fuzzy matching
     */
    public Product findProductByNameContains(String keyword) {
        if (keyword == null || keyword.isEmpty())
            return null;
        return productRepository.findByNameContainsIgnoreCaseAndActiveTrue(keyword).orElse(null);
    }

    // ==================== Admin Product Management ====================

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public ProductResponse createProduct(ProductRequest request) {
        log.info("Creating new product: {}", request.getName());

        Product product = Product.builder()
                .name(request.getName())
                .brand(request.getBrand())
                .description(request.getDescription())
                .price(request.getPrice())
                .discountPrice(request.getDiscountPrice())
                .stock(request.getStock())
                .category(request.getCategory())
                .type(request.getType())
                .volume(null)
                .imageUrl(request.getImageUrl())
                .additionalImages(null)
                .fragranceNotes(null)
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .active(request.getActive() != null ? request.getActive() : true)
                .rating(0.0)
                .reviewCount(0)
                .build();

        Product savedProduct = productRepository.save(product);

        // Create variants if provided
        if (request != null && request.getVariants() != null && !request.getVariants().isEmpty()) {
            for (var variantReq : request.getVariants()) {
                ProductVariant variant = ProductVariant.builder()
                        .product(savedProduct)
                        .size(variantReq.getSize())
                        .unit(variantReq.getUnit())
                        .price(variantReq.getPrice())
                        .discountPrice(variantReq.getDiscountPrice())
                        .stock(variantReq.getStock())
                        .sku(variantReq.getSku())
                        .active(true)
                        .build();
                savedProduct.getVariants().add(variant);
            }
            savedProduct = productRepository.save(savedProduct);
        }

        log.info("Product created successfully with ID: {}", savedProduct.getId());
        return ProductResponse.fromEntity(savedProduct);
    }

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        log.info("Starting Extreme Persistence Update for Product ID: {}", id);
        validateProductRequest(request);

        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id.toString()));

        try {
            // Update basic fields
            if (request.getName() != null)
                product.setName(request.getName().trim());
            if (request.getBrand() != null)
                product.setBrand(request.getBrand().trim());
            if (request.getDescription() != null)
                product.setDescription(request.getDescription().trim());
            if (request.getPrice() != null)
                product.setPrice(request.getPrice());
            if (request.getDiscountPrice() != null)
                product.setDiscountPrice(request.getDiscountPrice());
            if (request.getStock() != null)
                product.setStock(request.getStock());

            if (request.getCategory() != null) {
                product.setCategory(request.getCategory());
            }

            if (request.getType() != null)
                product.setType(request.getType());
            if (request.getVolume() != null)
                product.setVolume(request.getVolume());
            if (request.getImageUrl() != null)
                product.setImageUrl(request.getImageUrl());
            if (request.getFeatured() != null)
                product.setFeatured(request.getFeatured());
            if (request.getActive() != null)
                product.setActive(request.getActive());

            // Handle Collections
            if (request.getAdditionalImages() != null) {
                product.getAdditionalImages().clear();
                product.getAdditionalImages().addAll(request.getAdditionalImages());
            }
            if (request.getFragranceNotes() != null) {
                product.getFragranceNotes().clear();
                product.getFragranceNotes().addAll(request.getFragranceNotes());
            }

            // Sync Variants using ProductVariantRepository for GUARANTEED persistence
            if (request.getVariants() != null) {
                log.info("Syncing variants for product {} using explicit repository", id);

                // Fetch current variants from DB
                List<ProductVariant> existingVariants = productVariantRepository.findByProductId(id);

                // Use a composite key (size|unit) for mapping existing variants
                Map<String, ProductVariant> existingMap = existingVariants.stream()
                        .collect(Collectors.toMap(
                                v -> v.getSize() + "|" + (v.getUnit() != null ? v.getUnit() : ""),
                                v -> v,
                                (v1, v2) -> v1));

                Set<String> requestKeys = request.getVariants().stream()
                        .map(v -> v.getSize() + "|" + (v.getUnit() != null ? v.getUnit() : ""))
                        .collect(Collectors.toSet());

                // Delete variants not in request (orphans)
                for (ProductVariant existing : existingVariants) {
                    String key = existing.getSize() + "|" + (existing.getUnit() != null ? existing.getUnit() : "");
                    if (!requestKeys.contains(key)) {
                        log.debug("Removing orphaned variant: {}", key);
                        product.getVariants().remove(existing);
                        productVariantRepository.delete(existing);
                    }
                }

                // CRITICAL: Flush deletions before adding new ones to prevent unique constraint
                // collisions on (product_id, size, unit)
                productVariantRepository.flush();

                // Update or Add
                for (var vReq : request.getVariants()) {
                    String key = vReq.getSize() + "|" + (vReq.getUnit() != null ? vReq.getUnit() : "");
                    ProductVariant existing = existingMap.get(key);
                    if (existing != null) {
                        log.debug("Updating existing variant: {}", key);
                        existing.setPrice(vReq.getPrice());
                        existing.setDiscountPrice(vReq.getDiscountPrice());
                        existing.setStock(vReq.getStock());
                        existing.setSku(vReq.getSku());
                        existing.setActive(true);
                        productVariantRepository.save(existing);
                    } else {
                        log.debug("Creating new variant: {}", key);
                        ProductVariant newVariant = ProductVariant.builder()
                                .product(product)
                                .size(vReq.getSize())
                                .unit(vReq.getUnit())
                                .price(vReq.getPrice())
                                .discountPrice(vReq.getDiscountPrice())
                                .stock(vReq.getStock())
                                .sku(vReq.getSku())
                                .active(true)
                                .build();
                        product.getVariants().add(newVariant);
                        productVariantRepository.save(newVariant);
                    }
                }

                // Final flush for variants
                productVariantRepository.flush();
            }

            // Forced Flush and Return
            Product updated = productRepository.saveAndFlush(product);

            // Double-check the state through repository fetch (within same transaction)
            List<ProductVariant> finalVariants = productVariantRepository.findByProductId(id);
            log.info("Update complete. Final Variant count in DB: {}", finalVariants.size());
            finalVariants.forEach(v -> log.info("Final Variant: Size={}, Price={}, Stock={}", v.getSize(), v.getPrice(),
                    v.getStock()));

            return ProductResponse.fromEntity(updated);

        } catch (DataIntegrityViolationException e) {
            log.error("Data Integrity Error updating product {}: {}", id, e.getMessage());
            throw new ApplicationException(
                    "Cannot remove or modify variants that are already linked to orders. Please mark them as inactive instead.",
                    ErrorType.CONFLICT, 409);
        } catch (Exception e) {
            log.error("Unexpected error updating product {}: {}", id, e.getMessage());
            throw e;
        }
    }

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public ProductResponse partialUpdateProduct(Long id, ProductRequest request) {
        log.info("Partial update for Product ID: {}", id);
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id.toString()));

        if (request.getName() != null)
            product.setName(request.getName().trim());
        if (request.getBrand() != null)
            product.setBrand(request.getBrand().trim());
        if (request.getDescription() != null)
            product.setDescription(request.getDescription().trim());
        if (request.getPrice() != null)
            product.setPrice(request.getPrice());
        if (request.getDiscountPrice() != null)
            product.setDiscountPrice(request.getDiscountPrice());
        if (request.getStock() != null)
            product.setStock(request.getStock());

        if (request.getCategory() != null) {
            product.setCategory(request.getCategory());
        }

        if (request.getType() != null)
            product.setType(request.getType());
        if (request.getVolume() != null)
            product.setVolume(request.getVolume());
        if (request.getImageUrl() != null)
            product.setImageUrl(request.getImageUrl());

        if (request.getAdditionalImages() != null) {
            product.getAdditionalImages().clear();
            product.getAdditionalImages().addAll(request.getAdditionalImages());
        }
        if (request.getFragranceNotes() != null) {
            product.getFragranceNotes().clear();
            product.getFragranceNotes().addAll(request.getFragranceNotes());
        }
        if (request.getFeatured() != null)
            product.setFeatured(request.getFeatured());
        if (request.getActive() != null)
            product.setActive(request.getActive());

        Product updated = productRepository.saveAndFlush(product);
        log.info("Partial update persisted for ID: {}", updated.getId());

        return ProductResponse.fromEntity(updated);
    }

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setActive(false);
        productRepository.save(product);
        log.info("Product soft deleted: {} (ID: {})", product.getName(), id);
    }

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public void permanentDeleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new RuntimeException("Product not found with id: " + id);
        }

        productRepository.deleteById(id);
        log.warn("Product permanently deleted: ID {}", id);
    }

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public ProductResponse activateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setActive(true);
        Product updated = productRepository.save(product);
        log.info("Product activated: {} (ID: {})", updated.getName(), id);

        return ProductResponse.fromEntity(updated);
    }

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public ProductResponse deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setActive(false);
        Product updated = productRepository.save(product);
        log.info("Product deactivated: {} (ID: {})", updated.getName(), id);

        return ProductResponse.fromEntity(updated);
    }

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public ProductResponse toggleFeatured(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setFeatured(!product.getFeatured());
        Product updated = productRepository.save(product);
        log.info("Product featured status toggled: {} (ID: {}) - Featured: {}",
                updated.getName(), id, updated.getFeatured());

        return ProductResponse.fromEntity(updated);
    }

    // ==================== Stock Management ====================

    @Transactional
    public ProductResponse updateStock(Long id, Integer quantity) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        if (quantity < 0) {
            throw new RuntimeException("Stock quantity cannot be negative");
        }

        product.setStock(quantity);
        Product updated = productRepository.save(product);
        log.info("Product stock updated: {} (ID: {}) - New stock: {}",
                updated.getName(), id, quantity);

        return ProductResponse.fromEntity(updated);
    }

    @Transactional
    public ProductResponse adjustStock(Long id, Integer adjustment) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        int newStock = product.getStock() + adjustment;
        if (newStock < 0) {
            throw new RuntimeException("Insufficient stock. Current: " + product.getStock());
        }

        product.setStock(newStock);
        Product updated = productRepository.save(product);
        log.info("Product stock adjusted: {} (ID: {}) - Adjustment: {} - New stock: {}",
                updated.getName(), id, adjustment, newStock);

        return ProductResponse.fromEntity(updated);
    }

    public List<ProductResponse> getLowStockProducts(Integer threshold) {
        return productRepository.findLowStockProducts(threshold)
                .stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ==================== Admin Queries ====================

    public Page<ProductResponse> getAllProductsAdmin(Pageable pageable) {
        return productRepository.findAll(pageable)
                .map(ProductResponse::fromEntity);
    }

    public Page<ProductResponse> getProductsByStatus(Boolean active, Pageable pageable) {
        return productRepository.findByActiveStatus(active, pageable)
                .map(ProductResponse::fromEntity);
    }

    public ProductResponse getProductByIdAdmin(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        return ProductResponse.fromEntity(product);
    }

    // ==================== Rating Management ====================

    @Transactional
    @CacheEvict(value = "products", key = "#productId")
    public void updateProductRating(Long productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + productId));

        Double avgRating = product.getReviews().stream()
                .mapToInt(review -> review.getRating())
                .average()
                .orElse(0.0);

        product.setRating(avgRating);
        product.setReviewCount(product.getReviews().size());

        productRepository.save(product);
        log.info("Product rating updated: {} (ID: {}) - Rating: {} ({} reviews)",
                product.getName(), productId, avgRating, product.getReviewCount());
    }

    // ==================== Statistics ====================

    public Long getTotalActiveProducts() {
        return productRepository.countActiveProducts();
    }

    public Long getTotalOutOfStockProducts() {
        return productRepository.countOutOfStockProducts();
    }

    /**
     * Get related products based on category and brand similarity.
     * Returns products from same category or brand, excluding the current product.
     * 
     * @param productId ID of the product to find related products for
     * @param limit     Maximum number of products to return
     * @return List of related products
     */
    public List<ProductResponse> getRelatedProducts(Long productId, int limit) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", productId.toString()));

        // First try to find products in same category and brand
        List<Product> relatedProducts = productRepository
                .findByCategoryAndBrandAndActiveTrueAndIdNot(
                        product.getCategory(),
                        product.getBrand(),
                        productId,
                        PageRequest.of(0, limit))
                .getContent();

        // If not enough products found, add products from same category
        if (relatedProducts.size() < limit) {
            int remaining = limit - relatedProducts.size();
            List<Product> categoryProducts = productRepository
                    .findByCategoryAndActiveTrueAndIdNot(
                            product.getCategory(),
                            productId,
                            PageRequest.of(0, remaining))
                    .getContent();

            // Add only products not already in the list
            for (Product p : categoryProducts) {
                if (!relatedProducts.contains(p) && relatedProducts.size() < limit) {
                    relatedProducts.add(p);
                }
            }
        }

        // If still not enough, add products from same brand
        if (relatedProducts.size() < limit) {
            int remaining = limit - relatedProducts.size();
            List<Product> brandProducts = productRepository
                    .findByBrandAndActiveTrueAndIdNot(
                            product.getBrand(),
                            productId,
                            PageRequest.of(0, remaining))
                    .getContent();

            for (Product p : brandProducts) {
                if (!relatedProducts.contains(p) && relatedProducts.size() < limit) {
                    relatedProducts.add(p);
                }
            }
        }

        return relatedProducts.stream()
                .map(ProductResponse::fromEntity)
                .collect(Collectors.toList());
    }

    // ==================== Validation ====================

    private void validateProductRequest(ProductRequest request) {
        if (request.getDiscountPrice() != null &&
                request.getDiscountPrice().compareTo(request.getPrice()) >= 0) {
            throw new RuntimeException("Discount price must be less than regular price");
        }
    }
}
