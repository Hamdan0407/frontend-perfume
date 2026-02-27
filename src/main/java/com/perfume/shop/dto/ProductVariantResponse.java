package com.perfume.shop.dto;

import com.perfume.shop.entity.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantResponse {

    private Long id;
    private Long productId;
    private Integer size;
    private String unit;
    private BigDecimal price;
    private BigDecimal discountPrice;
    private Integer stock;
    private String sku;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ProductVariantResponse fromEntity(ProductVariant variant) {
        return ProductVariantResponse.builder()
                .id(variant.getId())
                .productId(variant.getProduct().getId())
                .size(variant.getSize())
                .unit(variant.getUnit())
                .price(variant.getPrice())
                .discountPrice(variant.getDiscountPrice())
                .stock(variant.getStock())
                .sku(variant.getSku())
                .active(variant.getActive())
                .createdAt(variant.getCreatedAt())
                .updatedAt(variant.getUpdatedAt())
                .build();
    }
}
