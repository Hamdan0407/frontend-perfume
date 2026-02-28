package com.perfume.shop.init;

import com.perfume.shop.entity.Product;
import com.perfume.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * One-time fix to ensure some products are marked as featured
 * if the homepage is empty due to previous logic bugs.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class FeaturedProductFix implements CommandLineRunner {

    private final ProductRepository productRepository;

    @Override
    public void run(String... args) {
        long featuredCount = productRepository.findByFeaturedTrueAndActiveTrue().size();

        if (featuredCount == 0) {
            log.info("⚠️ No featured products found. Applying automatic fix...");

            List<Product> products = productRepository.findAll();
            if (products.isEmpty()) {
                log.info("No products available to mark as featured.");
                return;
            }

            // Mark up to 8 products as featured
            int count = 0;
            for (Product product : products) {
                if (product.getActive() != null && product.getActive()) {
                    product.setFeatured(true);
                    productRepository.save(product);
                    count++;
                    if (count >= 8)
                        break;
                }
            }

            log.info("✓ Marked {} products as featured for the homepage.", count);
        } else {
            log.info("✓ Found {} featured products. No fix needed.", featuredCount);
        }
    }
}
