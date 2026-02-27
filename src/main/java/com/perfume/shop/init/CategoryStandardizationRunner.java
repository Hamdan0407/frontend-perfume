package com.perfume.shop.init;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time runner to standardize product categories in the database.
 * Ensures all existing records use the uppercase enum format (e.g.,
 * PREMIUM_ATTARS).
 */
@Component
@Order(0) // Run before other initializers
@RequiredArgsConstructor
@Slf4j
public class CategoryStandardizationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        log.info("🚀 Starting Category Standardization Migration...");

        try {
            // Standardize to PREMIUM_ATTARS (Plural)
            int attarsUpdated = jdbcTemplate.update(
                "UPDATE products SET category = 'PREMIUM_ATTARS' WHERE " +
                "UPPER(category) LIKE '%ATTAR%' OR category IN ('Premium attars', 'premium attars', 'premium_attars', 'Attar', 'attar')"
            );
            if (attarsUpdated > 0) log.info("✓ Updated {} products to PREMIUM_ATTARS", attarsUpdated);

            // Standardize to PARFUM
            int parfumUpdated = jdbcTemplate.update(
                "UPDATE products SET category = 'PARFUM' WHERE " +
                "UPPER(category) LIKE '%PERFUME%' OR UPPER(category) LIKE '%PARFUM%'"
            );
            if (parfumUpdated > 0) log.info("✓ Updated {} products to PARFUM", parfumUpdated);

            // Standardize to OUD_RESERVE
            int oudUpdated = jdbcTemplate.update(
                "UPDATE products SET category = 'OUD_RESERVE' WHERE UPPER(category) LIKE '%OUD%'"
            );
            if (oudUpdated > 0) log.info("✓ Updated {} products to OUD_RESERVE", oudUpdated);

            // Standardize to BAKHOOR
            int bakhoorUpdated = jdbcTemplate.update(
                "UPDATE products SET category = 'BAKHOOR' WHERE UPPER(category) LIKE '%BAKHOOR%'"
            );
            if (bakhoorUpdated > 0) log.info("✓ Updated {} products to BAKHOOR", bakhoorUpdated);

            // Standardize to AROMA_CHEMICALS
            int chemicalUpdated = jdbcTemplate.update(
                "UPDATE products SET category = 'AROMA_CHEMICALS' WHERE " +
                "UPPER(category) LIKE '%CHEMICAL%' OR UPPER(category) LIKE '%SYNTHETIC%'"
            );
            if (chemicalUpdated > 0) log.info("✓ Updated {} products to AROMA_CHEMICALS", chemicalUpdated);

            // Standardize MEN, WOMEN, UNISEX
            jdbcTemplate.update("UPDATE products SET category = 'MEN' WHERE UPPER(category) IN ('MEN', 'MENS', 'MALE')");
            jdbcTemplate.update("UPDATE products SET category = 'WOMEN' WHERE UPPER(category) IN ('WOMEN', 'WOMENS', 'FEMALE')");
            jdbcTemplate.update("UPDATE products SET category = 'UNISEX' WHERE UPPER(category) IN ('UNISEX')");

            log.info("✅ Category Standardization Migration Completed.");
        } catch (Exception e) {
            log.error("❌ Failed to complete category standardization: {}", e.getMessage());
        }
    }
}
