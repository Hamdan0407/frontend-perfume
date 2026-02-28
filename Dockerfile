# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build arguments
ARG REACT_APP_API_URL=http://localhost:8080/api
ARG VITE_API_URL=http://localhost:8080/api

# Set environment variables for build
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
ENV VITE_API_URL=${VITE_API_URL}

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

LABEL maintainer="Parfume Shop <support@parfume.com>"
LABEL description="Production-ready Perfume Shop Frontend"

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
