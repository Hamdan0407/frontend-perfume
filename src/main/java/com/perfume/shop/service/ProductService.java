package com.perfume.shop.service;

import com.perfume.shop.dto.ProductFilterRequest;
import com.perfume.shop.dto.ProductRequest;
import com.perfume.shop.dto.ProductResponse;
import com.perfume.shop.entity.Product;
import com.perfume.shop.entity.ProductVariant;
import com.perfume.shop.exception.ResourceNotFoundException;
import com.perfume.shop.repository.ProductRepository;
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
    public Page<ProductResponse> getProductsByCategory(String category, Pageable pageable) {
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
        log.info("Fetching featured products - querying database");
        try {
            List<Product> products = productRepository.findByFeaturedTrueAndActiveTrue();
            log.info("Found {} featured products", products.size());

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
        // Default pagination
        Pageable pageable = PageRequest.of(0, 12);

        // Return all active products
        return productRepository.findByActiveTrue(pageable)
                .map(ProductResponse::fromEntity);
    }

    public List<String> getAllBrands() {
        return productRepository.findDistinctBrandByActiveTrue();
    }

    public List<String> getAllCategories() {
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
                .featured(false)
                .active(true)
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
        log.info("Processing Absolute Persistence Update for Product ID: {}", id);
        validateProductRequest(request);

        // 1. Fetch the MANAGED entity. We must modify THIS specific object instance.
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product", id.toString()));

        log.info("Fetched managed entity: {} (IdentityHash: {})", product.getName(), System.identityHashCode(product));

        try {
            // 2. Map fields from the Request DTO directly to the Managed Entity.
            // Using standard setters on the managed object triggers Hibernate dirty
            // checking.
            product.setName(request.getName());
            product.setBrand(request.getBrand());
            product.setDescription(request.getDescription());
            product.setPrice(request.getPrice());
            product.setDiscountPrice(request.getDiscountPrice());
            product.setStock(request.getStock());
            product.setCategory(request.getCategory());
            product.setType(request.getType());
            product.setVolume(request.getVolume());
            product.setImageUrl(request.getImageUrl());
            product.setFeatured(request.getFeatured() != null && request.getFeatured());
            product.setActive(request.getActive() != null && request.getActive());

            // 3. Synchronize @ElementCollections (Images, Notes)
            // clear() followed by addAll() ensures the collection contents are updated
            // without breaking the Hibernate-managed collection reference.
            if (request.getAdditionalImages() != null) {
                product.getAdditionalImages().clear();
                product.getAdditionalImages().addAll(request.getAdditionalImages());
            }
            if (request.getFragranceNotes() != null) {
                product.getFragranceNotes().clear();
                product.getFragranceNotes().addAll(request.getFragranceNotes());
            }

            // 4. Synchronize @OneToMany ProductVariants
            if (request.getVariants() != null) {
                List<ProductVariant> currentVariants = product.getVariants();
                Map<Integer, ProductVariant> existingMap = currentVariants.stream()
                        .collect(Collectors.toMap(ProductVariant::getSize, v -> v, (v1, v2) -> v1));

                Set<Integer> requestSizes = request.getVariants().stream()
                        .map(ProductVariantRequest::getSize)
                        .collect(Collectors.toSet());

                // Remove orphans (variants missing from new request)
                currentVariants.removeIf(v -> !requestSizes.contains(v.getSize()));

                // Update existing or add new
                for (var vReq : request.getVariants()) {
                    ProductVariant existing = existingMap.get(vReq.getSize());
                    if (existing != null) {
                        existing.setPrice(vReq.getPrice());
                        existing.setDiscountPrice(vReq.getDiscountPrice());
                        existing.setStock(vReq.getStock());
                        existing.setSku(vReq.getSku());
                        existing.setActive(true);
                    } else {
                        currentVariants.add(ProductVariant.builder()
                                .product(product)
                                .size(vReq.getSize())
                                .price(vReq.getPrice())
                                .discountPrice(vReq.getDiscountPrice())
                                .stock(vReq.getStock())
                                .sku(vReq.getSku())
                                .active(true)
                                .build());
                    }
                }
            }

            // 5. Explicitly Flush to Database
            log.info("Persisting state for ID: {}. Price: {}, Stock: {}. Calling saveAndFlush...",
                    id, product.getPrice(), product.getStock());

            Product updated = productRepository.saveAndFlush(product);

            log.info("Persistence confirmed for ID: {}. Changes committed to DB context. Entity IdentityHash: {}",
                    updated.getId(), System.identityHashCode(updated));

            return ProductResponse.fromEntity(updated);

        } catch (DataIntegrityViolationException e) {
            log.error("Conflict updating product {}: {}", id, e.getMessage());
            throw new RuntimeException("Data integrity issue: Cannot remove variants referenced in orders.");
        } catch (Exception e) {
            log.error("Failed to commit Product update {}: {}", id, e.getMessage());
            throw e;
        }
    }

    @Transactional
    @CacheEvict(value = { "products", "categories", "featured-products" }, allEntries = true)
    public ProductResponse partialUpdateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        if (request.getName() != null)
            product.setName(request.getName());
        if (request.getBrand() != null)
            product.setBrand(request.getBrand());
        if (request.getDescription() != null)
            product.setDescription(request.getDescription());
        if (request.getPrice() != null)
            product.setPrice(request.getPrice());
        if (request.getDiscountPrice() != null)
            product.setDiscountPrice(request.getDiscountPrice());
        if (request.getStock() != null)
            product.setStock(request.getStock());
        if (request.getCategory() != null)
            product.setCategory(request.getCategory());
        if (request.getType() != null)
            product.setType(request.getType());
        if (request.getVolume() != null)
            product.setVolume(request.getVolume());
        if (request.getImageUrl() != null)
            product.setImageUrl(request.getImageUrl());
        if (request.getAdditionalImages() != null)
            product.setAdditionalImages(request.getAdditionalImages());
        if (request.getFragranceNotes() != null)
            product.setFragranceNotes(request.getFragranceNotes());
        if (request.getFeatured() != null)
            product.setFeatured(request.getFeatured());
        if (request.getActive() != null)
            product.setActive(request.getActive());

        Product updated = productRepository.save(product);
        log.info("Product partially updated: {} (ID: {})", updated.getName(), updated.getId());

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
    public ProductResponse activateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setActive(true);
        Product updated = productRepository.save(product);
        log.info("Product activated: {} (ID: {})", updated.getName(), id);

        return ProductResponse.fromEntity(updated);
    }

    @Transactional
    public ProductResponse deactivateProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setActive(false);
        Product updated = productRepository.save(product);
        log.info("Product deactivated: {} (ID: {})", updated.getName(), id);

        return ProductResponse.fromEntity(updated);
    }

    @Transactional
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
