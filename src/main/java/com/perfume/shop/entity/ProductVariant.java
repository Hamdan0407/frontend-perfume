package com.perfume.shop.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "product_variants", uniqueConstraints = @UniqueConstraint(columnNames = { "product_id",
                "size", "unit" }), indexes = {
                                @Index(name = "idx_variant_product", columnList = "product_id"),
                                @Index(name = "idx_variant_size", columnList = "size"),
                                @Index(name = "idx_variant_unit", columnList = "unit"),
                                @Index(name = "idx_variant_active", columnList = "active")
                })
@Data
@EqualsAndHashCode(callSuper = true, exclude = { "product" })
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({ "hibernateLazyInitializer", "handler" })
public class ProductVariant extends BaseEntity {

        @ManyToOne(fetch = FetchType.LAZY)
        @JoinColumn(name = "product_id", nullable = false)
        @JsonIgnore
        private Product product;

        @Column(nullable = false)
        private Integer size;

        @Column(name = "unit", length = 20)
        private String unit; // ml, kg, g, ltr

        @Column(nullable = false, precision = 10, scale = 2)
        private BigDecimal price;

        @Column(precision = 10, scale = 2)
        private BigDecimal discountPrice;

        @Column(nullable = false)
        @Builder.Default
        private Integer stock = 0;

        @Column(length = 50)
        private String sku;

        @Column(nullable = false)
        @Builder.Default
        private Boolean active = true;
}
