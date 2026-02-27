package com.perfume.shop.dto;

import com.perfume.shop.entity.enums.Category;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(min = 2, max = 200, message = "Product name must be between 2 and 200 characters")
    private String name;

    @Size(max = 100, message = "Brand name must not exceed 100 characters")
    private String brand;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    private String description;

    @NotNull(message = "Price is required")
    @DecimalMin(value = "0.01", message = "Price must be greater than 0")
    @Digits(integer = 10, fraction = 2, message = "Price must be a valid monetary amount")
    private BigDecimal price;

    @DecimalMin(value = "0.00", message = "Discount price cannot be negative")
    @Digits(integer = 10, fraction = 2, message = "Discount price must be a valid monetary amount")
    private BigDecimal discountPrice;

    @NotNull(message = "Stock is required")
    @Min(value = 0, message = "Stock cannot be negative")
    private Integer stock;

    @NotNull(message = "Category is required")
    private Category category;

    @Size(max = 100, message = "Type must not exceed 100 characters")
    private String type; // Eau de Parfum, Eau de Toilette, etc.

    @Size(max = 50, message = "Size must not exceed 50 characters")
    private String size; // e.g., "100ml", "50ml"

    @Min(value = 1, message = "Volume must be at least 1ml")
    @Max(value = 1000, message = "Volume must not exceed 1000ml")
    private Integer volume;

    // No size limit - allows base64 encoded images
    private String imageUrl;

    private List<@Size(max = 500) String> additionalImages;

    private List<@Size(max = 100) String> fragranceNotes;

    @Builder.Default
    private Boolean featured = false;

    @Builder.Default
    private Boolean active = true;

    private List<ProductVariantRequest> variants;
}
