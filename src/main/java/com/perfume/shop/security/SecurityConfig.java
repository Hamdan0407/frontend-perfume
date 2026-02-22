package com.perfume.shop.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import lombok.extern.slf4j.Slf4j;
import java.util.Arrays;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true)
@Slf4j
public class SecurityConfig {

        private final JwtService jwtService;
        private final UserDetailsService userDetailsService;

        @Value("${app.security.cors-origins:http://localhost:3000,http://localhost:5173,https://muwas.in,https://www.muwas.in}")
        private String corsOrigins;

        @Value("${app.security.cors-max-age:3600}")
        private long corsMaxAge;

        @Value("${app.security.password-encoder-strength:12}")
        private int passwordEncoderStrength;

        public SecurityConfig(JwtService jwtService, @Lazy UserDetailsService userDetailsService) {
                this.jwtService = jwtService;
                this.userDetailsService = userDetailsService;
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
                JwtAuthenticationFilter jwtFilter = new JwtAuthenticationFilter(jwtService, userDetailsService);

                http
                                .csrf(AbstractHttpConfigurer::disable)
                                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                                .headers(headers -> headers
                                                .frameOptions(frame -> frame.deny())
                                                .contentSecurityPolicy(csp -> csp
                                                                .policyDirectives("default-src 'self'; " +
                                                                                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://checkout.razorpay.com; "
                                                                                +
                                                                                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
                                                                                +
                                                                                "img-src 'self' data: https:; " +
                                                                                "font-src 'self' https://fonts.gstatic.com; "
                                                                                +
                                                                                "connect-src 'self' https://backend-perfumes-production.up.railway.app https://api.razorpay.com; "
                                                                                +
                                                                                "frame-src 'self' https://accounts.google.com https://api.razorpay.com;"))
                                                .httpStrictTransportSecurity(hsts -> hsts
                                                                .maxAgeInSeconds(31536000)
                                                                .includeSubDomains(true)))
                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/api/auth/register",
                                                                "/api/auth/login",
                                                                "/api/auth/refresh-token",
                                                                "/api/auth/forgot-password",
                                                                "/api/auth/reset-password",
                                                                "/api/auth/update-role",
                                                                "/api/auth/oauth2/**",
                                                                "/api/products",
                                                                "/api/products/**",
                                                                "/api/reviews/product/**",
                                                                "/api/payment/webhook/**",
                                                                "/api/razorpay/webhook/**",
                                                                "/api/chatbot/**",
                                                                "/error",
                                                                "/health",
                                                                "/actuator/health",
                                                                "/actuator/info",
                                                                "/actuator/prometheus",
                                                                "/swagger-ui.html",
                                                                "/swagger-ui/**",
                                                                "/v3/api-docs/**",
                                                                "/api-docs/**",
                                                                "/",
                                                                "/ping")
                                                .permitAll()
                                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                                .requestMatchers("/api/cart/**", "/api/cart").authenticated()
                                                .requestMatchers("/api/orders/**", "/api/orders").authenticated()
                                                .requestMatchers("/api/checkout/**").authenticated()
                                                .requestMatchers("/api/users/profile", "/api/users/password/**")
                                                .authenticated()
                                                .requestMatchers(org.springframework.http.HttpMethod.GET,
                                                                "/api/reviews/**")
                                                .permitAll()
                                                .requestMatchers(org.springframework.http.HttpMethod.POST,
                                                                "/api/reviews")
                                                .authenticated()
                                                .requestMatchers(org.springframework.http.HttpMethod.PUT,
                                                                "/api/reviews/**")
                                                .authenticated()
                                                .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                                                                "/api/reviews/**")
                                                .authenticated()
                                                .requestMatchers("/api/reviews/can-review/**").authenticated()
                                                .requestMatchers("/api/product/**").permitAll()
                                                .anyRequest().authenticated())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                                .authenticationProvider(authenticationProvider())
                                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                                .exceptionHandling(ex -> ex
                                                .authenticationEntryPoint((request, response, authException) -> {
                                                        response.setStatus(401);
                                                        response.setContentType("application/json");
                                                        response.getWriter().write("{\"error\": \"Unauthorized\"}");
                                                })
                                                .accessDeniedHandler((request, response, accessDeniedException) -> {
                                                        response.setStatus(403);
                                                        response.setContentType("application/json");
                                                        response.getWriter().write("{\"error\": \"Forbidden\"}");
                                                }));

                return http.build();
        }

        @Bean
        public DaoAuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
                provider.setUserDetailsService(userDetailsService);
                provider.setPasswordEncoder(passwordEncoder());
                provider.setHideUserNotFoundExceptions(true);
                return provider;
        }

        @Bean
        public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder(passwordEncoderStrength);
        }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();

                // Collect and merge origins/patterns for flexible environment support
                java.util.List<String> origins = new java.util.ArrayList<>();
                if (corsOrigins != null && !corsOrigins.isEmpty()) {
                        // Use trim() to avoid issues with spaces in configuration
                        java.util.List<String> configuredOrigins = Arrays.stream(corsOrigins.split(","))
                                        .map(String::trim)
                                        .filter(s -> !s.isEmpty())
                                        .collect(java.util.stream.Collectors.toList());
                        origins.addAll(configuredOrigins);
                }

                // Add essential patterns for Vercel and local dev
                origins.addAll(Arrays.asList(
                                "http://localhost:[*]",
                                "http://127.0.0.1:[*]",
                                "https://*.vercel.app",
                                "https://muwas.in",
                                "https://www.muwas.in",
                                "https://muwas.com",
                                "https://www.muwas.com"));

                // Remove duplicates if any
                origins = origins.stream().distinct().collect(java.util.stream.Collectors.toList());

                log.info("🔐 Configuring CORS with allowed origin patterns: {}", origins);

                // Use OriginPatterns for robust wildcard support
                configuration.setAllowedOriginPatterns(origins);

                configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                configuration.setAllowedHeaders(
                                Arrays.asList("Authorization", "Content-Type", "Accept", "X-Requested-With", "Origin",
                                                "Access-Control-Request-Method", "Access-Control-Request-Headers"));
                configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type"));
                configuration.setAllowCredentials(true);
                configuration.setMaxAge(corsMaxAge);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }

        @Bean
        public org.springframework.web.client.RestTemplate restTemplate() {
                return new org.springframework.web.client.RestTemplate();
        }
}
