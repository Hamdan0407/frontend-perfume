package com.perfume.shop.service;

import com.perfume.shop.entity.Product;
import com.perfume.shop.entity.enums.Category;
import com.perfume.shop.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatbotService {

    private final ProductRepository productRepository;

    public String processMessage(String userMessage, String conversationId) {
        log.info("Processing chatbot message: {} for conversation: {}", userMessage, conversationId);

        String lowerMessage = userMessage.toLowerCase();

        if (isBestQuery(lowerMessage) || isTrendingQuery(lowerMessage) || isRecommendationQuery(lowerMessage)) {
            return getBestPerfumesResponse();
        } else if (isMensPerfumeQuery(lowerMessage)) {
            return getMensPerfumeResponse();
        } else if (isWomensPerfumeQuery(lowerMessage)) {
            return getWomensPerfumeResponse();
        } else if (isPriceQuery(lowerMessage)) {
            return getPriceResponse();
        } else if (isStockQuery(lowerMessage)) {
            return getStockResponse();
        } else if (isOccasionQuery(lowerMessage)) {
            return getOccasionResponse(userMessage);
        } else {
            return getDefaultResponse();
        }
    }

    private boolean isMensPerfumeQuery(String message) {
        return message.contains("men") || message.contains("male") || message.contains("for him");
    }

    private boolean isWomensPerfumeQuery(String message) {
        return message.contains("women") || message.contains("female") || message.contains("for her");
    }

    private boolean isPriceQuery(String message) {
        return message.contains("price") || message.contains("cost") || message.contains("how much");
    }

    private boolean isStockQuery(String message) {
        return message.contains("stock") || message.contains("available") || message.contains("in stock");
    }

    private boolean isOccasionQuery(String message) {
        return message.contains("work") || message.contains("date") || message.contains("party") ||
                message.contains("occasion") || message.contains("romantic") || message.contains("formal");
    }

    private boolean isTrendingQuery(String message) {
        return message.contains("trending") || message.contains("popular") || message.contains("bestseller");
    }

    private boolean isBestQuery(String message) {
        return message.contains("best") || message.contains("top") || message.contains("recommend");
    }

    private boolean isRecommendationQuery(String message) {
        return message.contains("suggest") || message.contains("what should")
                || message.contains("what do you suggest");
    }

    private String getBestPerfumesResponse() {
        try {
            List<Product> bestPerfumes = productRepository.findAll().stream()
                    .filter(Product::getActive)
                    .sorted((a, b) -> Double.compare(b.getRating(), a.getRating()))
                    .limit(5)
                    .collect(Collectors.toList());

            if (bestPerfumes.isEmpty()) {
                return "Currently restocking our top fragrances. Check back soon!";
            }

            StringBuilder response = new StringBuilder();
            response.append("✨ **Our Best & Most Recommended Fragrances**\n\n");

            for (int i = 0; i < bestPerfumes.size(); i++) {
                Product product = bestPerfumes.get(i);
                response.append(String.format("%d. **%s** by %s\n", i + 1, product.getName(), product.getBrand()));
                response.append(String.format("   ⭐⭐⭐⭐⭐ Highly Rated\n\n"));
            }

            response.append("Visit our shop to explore these premium selections!");
            return response.toString();
        } catch (Exception e) {
            log.error("Error fetching best perfumes", e);
            return "Let me show you our best fragrances at the shop!";
        }
    }

    private String getMensPerfumeResponse() {
        try {
            List<Product> mensPerfumes = productRepository.findAll().stream()
                    .filter(p -> p.getActive() && Category.MEN.equals(p.getCategory()))
                    .limit(5)
                    .collect(Collectors.toList());

            if (mensPerfumes.isEmpty()) {
                return "😔 No men's perfumes available right now. Try asking about women's fragrances!";
            }

            StringBuilder response = new StringBuilder();
            response.append("👨 **Men's Fragrances**\n\n");

            for (int i = 0; i < mensPerfumes.size(); i++) {
                Product product = mensPerfumes.get(i);
                response.append(String.format("%d. **%s**\n", i + 1, product.getName()));
                response.append(String.format("   by %s\n\n", product.getBrand()));
            }

            response.append("Browse these options in our store for more details!");
            return response.toString();
        } catch (Exception e) {
            log.error("Error fetching men's perfumes", e);
            return "Unable to fetch men's perfumes. Please try again!";
        }
    }

    private String getWomensPerfumeResponse() {
        try {
            List<Product> womensPerfumes = productRepository.findAll().stream()
                    .filter(p -> p.getActive() && Category.WOMEN.equals(p.getCategory()))
                    .limit(5)
                    .collect(Collectors.toList());

            if (womensPerfumes.isEmpty()) {
                return "😔 No women's perfumes available right now. Try asking about men's fragrances!";
            }

            StringBuilder response = new StringBuilder();
            response.append("👩 **Women's Fragrances**\n\n");

            for (int i = 0; i < womensPerfumes.size(); i++) {
                Product product = womensPerfumes.get(i);
                response.append(String.format("%d. **%s**\n", i + 1, product.getName()));
                response.append(String.format("   by %s\n\n", product.getBrand()));
            }

            response.append("Visit our shop to explore these beautiful fragrances!");
            return response.toString();
        } catch (Exception e) {
            log.error("Error fetching women's perfumes", e);
            return "Unable to fetch women's perfumes. Please try again!";
        }
    }

    private String getStockResponse() {
        try {
            List<Product> allProducts = productRepository.findAll().stream()
                    .filter(p -> p.getActive() && p.getStock() > 0)
                    .limit(8)
                    .collect(Collectors.toList());

            StringBuilder response = new StringBuilder();
            response.append("✅ **Available Products**\n\n");

            if (allProducts.isEmpty()) {
                return "Currently restocking. Items will be back in 24 hours!";
            }

            for (Product product : allProducts) {
                response.append(String.format("• **%s** by %s\n", product.getName(), product.getBrand()));
            }

            response.append("\nCheck the shop for complete details!");
            return response.toString();
        } catch (Exception e) {
            log.error("Error fetching stock information", e);
            return "Unable to fetch stock information. Please try again!";
        }
    }

    private String getPriceResponse() {
        try {
            List<Product> products = productRepository.findAll().stream()
                    .filter(Product::getActive)
                    .limit(10)
                    .collect(Collectors.toList());

            StringBuilder response = new StringBuilder();
            response.append("💰 **Available Fragrances**\n\n");

            if (!products.isEmpty()) {
                response.append("We have a wide range of fragrances to suit every budget.\n\n");
                response.append("Visit our shop to browse and compare options!");
            }

            return response.toString();
        } catch (Exception e) {
            log.error("Error fetching price information", e);
            return "Unable to fetch price information. Please try again!";
        }
    }

    private String getOccasionResponse(String userMessage) {
        try {
            String occasion = extractOccasion(userMessage);

            List<Product> recommendedProducts = productRepository.findAll().stream()
                    .filter(p -> p.getActive())
                    .limit(5)
                    .collect(Collectors.toList());

            StringBuilder response = new StringBuilder();
            response.append(String.format("🎯 **Perfect for %s**\n\n", occasion));

            if (recommendedProducts.isEmpty()) {
                return "Great choice! We have fragrances perfect for " + occasion + ". Check our shop!";
            }

            response.append("We have excellent options for this occasion.\n\n");
            response.append("Visit our shop to find your perfect match!");

            return response.toString();
        } catch (Exception e) {
            log.error("Error fetching occasion recommendations", e);
            return "Unable to fetch recommendations. Please try again!";
        }
    }

    private String getTrendingResponse() {
        try {
            List<Product> trendingProducts = productRepository.findAll().stream()
                    .filter(p -> p.getActive())
                    .limit(5)
                    .collect(Collectors.toList());

            StringBuilder response = new StringBuilder();
            response.append("🔥 **Customer Favorites & Trending**\n\n");

            if (trendingProducts.isEmpty()) {
                return "Currently restocking trending items. Check back soon!";
            }

            response.append("Our most loved fragrances are waiting for you!\n\n");
            response.append("Explore our shop to discover bestsellers.");

            return response.toString();
        } catch (Exception e) {
            log.error("Error fetching trending products", e);
            return "Unable to fetch trending products. Please try again!";
        }
    }

    private String getDefaultResponse() {
        return "👋 Welcome to Muwas Perfumes! I'm Sophia, your Intelligent Shopping Assistant. ✨\n\n" +
                "**What would you like to explore?**\n" +
                "👨 Men's Fragrances\n" +
                "👩 Women's Fragrances\n" +
                "🎁 Perfect for special occasions\n" +
                "🔥 Customer favorites\n\n" +
                "**Try asking:** \"Show me men's perfumes\" or \"What's trending?\"\n\n" +
                "Visit our shop for detailed pricing and availability! 💫";
    }

    private String extractOccasion(String message) {
        if (message.toLowerCase().contains("work"))
            return "Work";
        if (message.toLowerCase().contains("date"))
            return "Date Night";
        if (message.toLowerCase().contains("party"))
            return "Party";
        if (message.toLowerCase().contains("formal"))
            return "Formal Events";
        if (message.toLowerCase().contains("casual"))
            return "Casual Outings";
        if (message.toLowerCase().contains("romantic"))
            return "Romantic Occasions";
        return "Special Occasions";
    }
}
