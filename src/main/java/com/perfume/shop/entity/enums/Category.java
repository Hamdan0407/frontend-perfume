package com.perfume.shop.entity.enums;

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
    public static Category fromString(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase().replace(" ", "_");
        try {
            return Category.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            // Check for common variations
            if (normalized.equals("PERFUME"))
                return PARFUM;
            if (normalized.contains("ATTAR"))
                return PREMIUM_ATTARS;
            if (normalized.contains("OUD"))
                return OUD_RESERVE;
            if (normalized.contains("CHEMICAL"))
                return AROMA_CHEMICALS;

            throw new IllegalArgumentException("Invalid category: " + value
                    + ". Valid categories are: PARFUM, PREMIUM_ATTARS, OUD_RESERVE, BAKHOOR, AROMA_CHEMICALS");
        }
    }
}
