package com.perfume.shop.service;

import com.perfume.shop.dto.ProductRequest;
import com.perfume.shop.dto.ProductResponse;
import com.perfume.shop.entity.Product;
import com.perfume.shop.exception.ResourceNotFoundException;
import com.perfume.shop.repository.ProductRepository;
import com.perfume.shop.entity.enums.Category;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for ProductService
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ProductService Tests")
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ProductService productService;

    private Product testProduct;
    private ProductRequest productRequest;

    @BeforeEach
    void setUp() {
        testProduct = Product.builder()
                .name("Chanel No. 5")
                .brand("Chanel")
                .description("Classic perfume")
                .price(new BigDecimal("150.00"))
                .stock(50)
                .category(Category.WOMEN)
                .type("Eau de Parfum")
                .volume(100)
                .imageUrl("https://example.com/image.jpg")
                .featured(true)
                .active(true)
                .rating(4.5)
                .reviewCount(100)
                .build();
        testProduct.setId(1L);

        productRequest = new ProductRequest();
        productRequest.setName("New Perfume");
        productRequest.setBrand("Test Brand");
        productRequest.setDescription("Test Description");
        productRequest.setPrice(new BigDecimal("100.00"));
        productRequest.setStock(30);
        productRequest.setCategory(Category.UNISEX);
        productRequest.setType("Eau de Toilette");
        productRequest.setVolume(50);
        productRequest.setImageUrl("https://example.com/new.jpg");
        productRequest.setFeatured(false);
        productRequest.setActive(true);
    }

    // ==================== GET PRODUCT TESTS ====================

    @Test
    @DisplayName("Should get product by ID successfully")
    void testGetProductByIdSuccess() {
        // Given
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        // When
        ProductResponse response = productService.getProductById(1L);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getName()).isEqualTo("Chanel No. 5");
        verify(productRepository).findById(1L);
    }

    @Test
    @DisplayName("Should throw exception when product not found")
    void testGetProductByIdNotFound() {
        // Given
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> productService.getProductById(999L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Product not found");
    }

    @Test
    @DisplayName("Should throw exception when product is inactive")
    void testGetProductByIdInactive() {
        // Given
        testProduct.setActive(false);
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        // When & Then
        assertThatThrownBy(() -> productService.getProductById(1L))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("not available");
    }

    @Test
    @DisplayName("Should get all active products")
    void testGetAllProducts() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(Arrays.asList(testProduct));
        when(productRepository.findByActiveTrue(pageable)).thenReturn(productPage);

        // When
        Page<ProductResponse> result = productService.getAllProducts(pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getName()).isEqualTo("Chanel No. 5");
    }

    @Test
    @DisplayName("Should get featured products")
    void testGetFeaturedProducts() {
        // Given
        when(productRepository.findByFeaturedTrueAndActiveTrue())
                .thenReturn(Arrays.asList(testProduct));

        // When
        List<ProductResponse> result = productService.getFeaturedProducts();

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getFeatured()).isTrue();
    }

    @Test
    @DisplayName("Should get products by category")
    void testGetProductsByCategory() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(Arrays.asList(testProduct));
        when(productRepository.findByCategoryAndActiveTrue(Category.WOMEN, pageable))
                .thenReturn(productPage);

        // When
        Page<ProductResponse> result = productService.getProductsByCategory(Category.WOMEN, pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getCategory()).isEqualTo(Category.WOMEN);
    }

    @Test
    @DisplayName("Should get products by brand")
    void testGetProductsByBrand() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(Arrays.asList(testProduct));
        when(productRepository.findByBrandAndActiveTrue("Chanel", pageable))
                .thenReturn(productPage);

        // When
        Page<ProductResponse> result = productService.getProductsByBrand("Chanel", pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getBrand()).isEqualTo("Chanel");
    }

    // ==================== CREATE PRODUCT TESTS ====================

    @Test
    @DisplayName("Should create product successfully")
    void testCreateProductSuccess() {
        // Given
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // When
        ProductResponse response = productService.createProduct(productRequest);

        // Then
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Chanel No. 5");
        verify(productRepository).save(any(Product.class));
    }

    // ==================== UPDATE PRODUCT TESTS ====================

    @Test
    @DisplayName("Should update product successfully")
    void testUpdateProductSuccess() {
        // Given
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // When
        ProductResponse response = productService.updateProduct(1L, productRequest);

        // Then
        assertThat(response).isNotNull();
        verify(productRepository).findById(1L);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    @DisplayName("Should throw exception when updating non-existent product")
    void testUpdateProductNotFound() {
        // Given
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> productService.updateProduct(999L, productRequest))
                .isInstanceOf(RuntimeException.class);
    }

    @Test
    @DisplayName("Should throw exception when discount price >= regular price")
    void testUpdateProductInvalidDiscount() {
        // Given
        productRequest.setDiscountPrice(new BigDecimal("150.00"));
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        // When & Then
        assertThatThrownBy(() -> productService.updateProduct(1L, productRequest))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Discount price must be less than regular price");
    }

    // ==================== DELETE PRODUCT TESTS ====================

    @Test
    @DisplayName("Should soft delete product")
    void testDeleteProduct() {
        // Given
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // When
        productService.deleteProduct(1L);

        // Then
        verify(productRepository).save(argThat(product -> !product.getActive()));
    }

    @Test
    @DisplayName("Should permanently delete product")
    void testPermanentDeleteProduct() {
        // Given
        when(productRepository.existsById(1L)).thenReturn(true);
        doNothing().when(productRepository).deleteById(1L);

        // When
        productService.permanentDeleteProduct(1L);

        // Then
        verify(productRepository).deleteById(1L);
    }

    // ==================== STOCK MANAGEMENT TESTS ====================

    @Test
    @DisplayName("Should update stock successfully")
    void testUpdateStockSuccess() {
        // Given
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // When
        ProductResponse response = productService.updateStock(1L, 100);

        // Then
        assertThat(response).isNotNull();
        verify(productRepository).save(argThat(product -> product.getStock() == 100));
    }

    @Test
    @DisplayName("Should throw exception when stock is negative")
    void testUpdateStockNegative() {
        // Given
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        // When & Then
        assertThatThrownBy(() -> productService.updateStock(1L, -10))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("cannot be negative");
    }

    @Test
    @DisplayName("Should adjust stock successfully")
    void testAdjustStockSuccess() {
        // Given
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // When
        ProductResponse response = productService.adjustStock(1L, -10);

        // Then
        assertThat(response).isNotNull();
        verify(productRepository).save(argThat(product -> product.getStock() == 40));
    }

    @Test
    @DisplayName("Should throw exception when adjustment causes negative stock")
    void testAdjustStockInsufficient() {
        // Given
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));

        // When & Then
        assertThatThrownBy(() -> productService.adjustStock(1L, -100))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("Insufficient stock");
    }

    // ==================== TOGGLE FEATURED TESTS ====================

    @Test
    @DisplayName("Should toggle featured status")
    void testToggleFeatured() {
        // Given
        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.save(any(Product.class))).thenReturn(testProduct);

        // When
        ProductResponse response = productService.toggleFeatured(1L);

        // Then
        assertThat(response).isNotNull();
        verify(productRepository).save(argThat(product -> !product.getFeatured()));
    }

    // ==================== RELATED PRODUCTS TESTS ====================

    @Test
    @DisplayName("Should get related products")
    void testGetRelatedProducts() {
        // Given
        Product relatedProduct = Product.builder()
                .name("Chanel No. 19")
                .brand("Chanel")
                .category(Category.WOMEN)
                .active(true)
                .build();
        relatedProduct.setId(2L);

        when(productRepository.findById(1L)).thenReturn(Optional.of(testProduct));
        when(productRepository.findByCategoryAndBrandAndActiveTrueAndIdNot(
                eq(Category.WOMEN), eq("Chanel"), eq(1L), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Arrays.asList(relatedProduct)));

        // When
        List<ProductResponse> result = productService.getRelatedProducts(1L, 4);

        // Then
        assertThat(result).isNotNull();
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(2L);
    }

    @Test
    @DisplayName("Should throw exception when getting related products for non-existent product")
    void testGetRelatedProductsNotFound() {
        // Given
        when(productRepository.findById(999L)).thenReturn(Optional.empty());

        // When & Then
        assertThatThrownBy(() -> productService.getRelatedProducts(999L, 4))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    // ==================== SEARCH TESTS ====================

    @Test
    @DisplayName("Should search products")
    void testSearchProducts() {
        // Given
        Pageable pageable = PageRequest.of(0, 10);
        Page<Product> productPage = new PageImpl<>(Arrays.asList(testProduct));
        when(productRepository.searchProducts("Chanel", pageable)).thenReturn(productPage);

        // When
        Page<ProductResponse> result = productService.searchProducts("Chanel", pageable);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getContent()).hasSize(1);
    }

    // ==================== STATISTICS TESTS ====================

    @Test
    @DisplayName("Should get total active products count")
    void testGetTotalActiveProducts() {
        // Given
        when(productRepository.countActiveProducts()).thenReturn(50L);

        // When
        Long count = productService.getTotalActiveProducts();

        // Then
        assertThat(count).isEqualTo(50L);
    }

    @Test
    @DisplayName("Should get total out of stock products count")
    void testGetTotalOutOfStockProducts() {
        // Given
        when(productRepository.countOutOfStockProducts()).thenReturn(5L);

        // When
        Long count = productService.getTotalOutOfStockProducts();

        // Then
        assertThat(count).isEqualTo(5L);
    }
}
