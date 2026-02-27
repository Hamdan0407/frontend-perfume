package com.perfume.shop.entity.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Standardized product categories.
 * Strict enum format used for database storage and filtering.
 */
public enum Category {
    PARFUM,
    PREMIUM_ATTARS,
    OUD_RESERVE,
    BAKHOOR,
    AROMA_CHEMICALS,
    MEN,
    WOMEN,
    UNISEX;

    /**
     * Helper to safely parse category from string with normalization.
     */
    @JsonCreator
    public static Category fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_");
        try {
            // Exact match
            return Category.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            // Check common variations and loose matches
            if (normalized.equals("PERFUME") || normalized.equals("FRAGRANCE"))
                return PARFUM;
            if (normalized.contains("ATTAR"))
                return PREMIUM_ATTARS;
            if (normalized.contains("OUD"))
                return OUD_RESERVE;
            if (normalized.contains("BAKHOOR"))
                return BAKHOOR;
            if (normalized.contains("CHEMICAL") || normalized.contains("SYNTHETIC"))
                return AROMA_CHEMICALS;
            if (normalized.equals("MEN") || normalized.equals("MENS") || normalized.equals("MALE"))
                return MEN;
            if (normalized.equals("WOMEN") || normalized.equals("WOMENS") || normalized.equals("FEMALE"))
                return WOMEN;
            if (normalized.equals("UNISEX") || normalized.equals("UNDEFINED"))
                return null;

            // Fallback for unknown categories to prevent mapping crashes
            return Category.PARFUM;
        }
    }

    @JsonValue
    public String getValue() {
        return name();
    }
}
