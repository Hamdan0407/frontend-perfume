package com.perfume.shop.dto;

import com.perfume.shop.entity.Product;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.perfume.shop.entity.enums.Category;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

        private Long id;
        private String name;
        private String brand;
        private String description;
        private BigDecimal price;
        private BigDecimal discountPrice;
        private Integer stock;
        private Category category;
        private String type;
        private Integer volume;
        private String imageUrl;
        private List<String> additionalImages;
        private List<String> fragranceNotes;
        private Boolean featured;
        private Boolean active;
        private Double rating;
        private Integer reviewCount;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<ProductVariantResponse> variants;

        public static ProductResponse fromEntity(Product product) {
                List<ProductVariantResponse> variantResponses = product.getVariants() != null
                                ? product.getVariants().stream()
                                                .map(ProductVariantResponse::fromEntity)
                                                .toList()
                                : List.of();

                return ProductResponse.builder()
                                .id(product.getId())
                                .name(product.getName())
                                .brand(product.getBrand())
                                .description(product.getDescription())
                                .price(product.getPrice())
                                .discountPrice(product.getDiscountPrice())
                                .stock(product.getStock())
                                .category(product.getCategory())
                                .type(product.getType())
                                .volume(product.getVolume())
                                .imageUrl(product.getImageUrl())
                                .additionalImages(product.getAdditionalImages())
                                .fragranceNotes(product.getFragranceNotes())
                                .featured(product.getFeatured())
                                .active(product.getActive())
                                .rating(product.getRating())
                                .reviewCount(product.getReviewCount())
                                .createdAt(product.getCreatedAt())
                                .updatedAt(product.getUpdatedAt())
                                .variants(variantResponses)
                                .build();
        }
}
