package com.perfume.shop.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.perfume.shop.entity.enums.Category;
import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductFilterRequest {

    private String searchQuery;
    private Category category;
    private List<String> brands;
    private BigDecimal minPrice;
    private BigDecimal maxPrice;
    private Boolean featured;
    private Integer minRating;
    private Boolean inStock;

    // Pagination
    private Integer page = 0;
    private Integer size = 12;

    // Sorting
    private String sortBy = "createdAt"; // name, price, rating, createdAt
    private String sortDir = "DESC"; // ASC or DESC
}
