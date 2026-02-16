# Frontend API Integration Guide

Complete documentation for frontend API integration with backend endpoints, including JWT authentication, token refresh, and error handling.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [JWT Token Management](#jwt-token-management)
3. [API Services](#api-services)
4. [Axios Configuration](#axios-configuration)
5. [Authentication Store](#authentication-store)
6. [Error Handling](#error-handling)
7. [Component Integration](#component-integration)
8. [Usage Examples](#usage-examples)

---

## Architecture Overview

### Technology Stack

- **HTTP Client**: Axios with request/response interceptors
- **State Management**: Zustand with localStorage persistence
- **Authentication**: JWT (Access Token + Refresh Token)
- **Token Expiry**: Access Token (24h), Refresh Token (7d)
- **Error Handling**: Semantic error types (VALIDATION_ERROR, AUTHENTICATION_ERROR, etc.)

### Data Flow

```
Component
   ↓
API Service (authAPI, productAPI, etc.)
   ↓
Axios Instance
   ↓
Request Interceptor → Add Authorization header with access token
   ↓
Backend API
   ↓
Response Interceptor → Handle 401, update tokens, retry request
   ↓
Auth Store → Update user/tokens
   ↓
Component State → UI Update
```

---

## JWT Token Management

### Token Storage

Tokens are stored in **localStorage** with the following keys:

```javascript
localStorage.getItem('accessToken')      // JWT access token (24h)
localStorage.getItem('token')            // Backward compatibility
localStorage.getItem('refreshToken')     // JWT refresh token (7d)
localStorage.getItem('user')             // User object (JSON stringified)
localStorage.getItem('tokenExpiresAt')   // Timestamp when token expires (ms)
```

### Token Refresh Flow

When the access token expires (401 response):

1. **Check if refresh already in progress**: If yes, queue the failed request
2. **Initiate token refresh**: POST to `/auth/refresh-token` with refresh token
3. **Update tokens**: Store new access and refresh tokens in localStorage and auth store
4. **Retry original request**: Use new access token and retry the original failed request
5. **Process queued requests**: Retry all queued requests with new token

### Preventing Concurrent Refreshes

Multiple simultaneous 401 responses are handled by a queue system:

```javascript
// In axios.js
let isRefreshing = false;        // Flag: token refresh in progress
let failedQueue = [];            // Array: queued failed requests

// When 401 occurs:
if (isRefreshing) {
  // Already refreshing, queue this request
  failedQueue.push({ resolve, reject });
} else {
  // Start refresh, subsequent 401s will be queued
  isRefreshing = true;
  // ... refresh token ...
  processQueue(null, newToken);  // Process all queued requests
}
```

---

## API Services

All API services are located in `frontend/src/api/` and follow the same pattern:

### Service Pattern

Each service exports an object with methods that:
- Use the axios instance for HTTP calls
- Return `response.data.data` (flattened response)
- Are documented with JSDoc including params, return type, and error codes
- Have comprehensive error handling via axios interceptors

### Available Services

#### 1. **authAPI.js** - Authentication Service

```javascript
import authAPI from '../api/authAPI';

// Login
const response = await authAPI.login(email, password);
// Returns: { user, token, refreshToken, expiresIn }

// Register
const response = await authAPI.register({
  email, password, firstName, lastName, phoneNumber
});
// Returns: { user, token, refreshToken, expiresIn }

// Refresh Token (called automatically by axios)
const response = await authAPI.refreshToken(refreshToken);
// Returns: { token, refreshToken, expiresIn, user }

// Logout (client-side only)
authAPI.logout(); // Clears tokens from localStorage

// Get Profile (requires auth)
const user = await authAPI.getProfile();

// Update Profile (requires auth)
const updated = await authAPI.updateProfile({ firstName, ... });

// Change Password (requires auth)
const result = await authAPI.changePassword(currentPassword, newPassword);
```

**Error Codes**:
- 400: Validation error (check `fieldErrors` in response)
- 401: Invalid credentials / Unauthorized
- 404: User not found
- 409: Email already registered

#### 2. **productAPI.js** - Product Retrieval Service

```javascript
import productAPI from '../api/productAPI';

// Get products with pagination and filters
const data = await productAPI.getProducts({
  page: 1,
  limit: 10,
  search: 'perfume',
  category: 'Men',
  minPrice: 50,
  maxPrice: 200,
  sortBy: 'price'
});
// Returns: { data: [...], pagination: { total, page, limit, pages } }

// Get product by ID
const product = await productAPI.getProductById(123);

// Search products
const results = await productAPI.searchProducts({
  q: 'rose',
  category: 'Women',
  minPrice: 0,
  maxPrice: 500
});

// Get featured products
const featured = await productAPI.getFeaturedProducts(8);

// Get products by category
const categoryProducts = await productAPI.getProductsByCategory('Men', {
  page: 1,
  limit: 20
});

// Filter products
const filtered = await productAPI.filterProducts({
  minPrice: 100,
  maxPrice: 300,
  category: 'Unisex',
  rating: 4
});
```

#### 3. **cartAPI.js** - Shopping Cart Service

```javascript
import cartAPI from '../api/cartAPI';

// Get user's cart (requires auth)
const cart = await cartAPI.getCart();

// Add item to cart (requires auth)
const updated = await cartAPI.addToCart(productId, quantity);

// Update item quantity (requires auth)
const updated = await cartAPI.updateCartItem(itemId, newQuantity);

// Remove item from cart (requires auth)
const updated = await cartAPI.removeFromCart(itemId);

// Clear entire cart (requires auth)
const empty = await cartAPI.clearCart();

// Get cart item count (requires auth)
const count = await cartAPI.getCartCount();
```

#### 4. **orderAPI.js** - Order Management Service

```javascript
import orderAPI from '../api/orderAPI';

// Create order from cart (requires auth)
const order = await orderAPI.createOrder({
  shippingAddress: '123 Main St',
  billingAddress: '123 Main St',
  paymentMethod: 'card',
  phone: '+1234567890'
});

// Get user's orders (requires auth)
const { data, pagination } = await orderAPI.getOrders({
  page: 1,
  limit: 10,
  status: 'pending',
  sortBy: 'createdAt'
});

// Get order details (requires auth)
const order = await orderAPI.getOrderById(orderId);

// Cancel order (requires auth)
const cancelled = await orderAPI.cancelOrder(orderId, reason);

// Get order status and tracking (requires auth)
const status = await orderAPI.getOrderStatus(orderId);

// Track order (public - no auth required)
const tracking = await orderAPI.trackOrder(trackingNumber);
```

#### 5. **reviewAPI.js** - Product Reviews Service

```javascript
import reviewAPI from '../api/reviewAPI';

// Get product reviews (public)
const { data, pagination } = await reviewAPI.getProductReviews(productId, {
  page: 1,
  limit: 10,
  sortBy: 'helpful',
  minRating: 3
});

// Get user's reviews (requires auth)
const { data, pagination } = await reviewAPI.getUserReviews({
  page: 1,
  limit: 10
});

// Get single review (public)
const review = await reviewAPI.getReviewById(reviewId);

// Add review (requires auth)
const review = await reviewAPI.addReview(productId, {
  rating: 5,
  title: 'Great fragrance!',
  comment: 'Absolutely loved it...'
});

// Update review (requires auth)
const updated = await reviewAPI.updateReview(reviewId, {
  rating: 4,
  title: 'Still great',
  comment: 'Updated comment'
});

// Delete review (requires auth)
const success = await reviewAPI.deleteReview(reviewId);

// Mark helpful (public)
const updated = await reviewAPI.markHelpful(reviewId);

// Mark not helpful (public)
const updated = await reviewAPI.markNotHelpful(reviewId);

// Get review statistics (public)
const stats = await reviewAPI.getReviewStats(productId);
```

---

## Axios Configuration

### Location

File: `frontend/src/api/axios.js`

### Features

1. **Request Interceptor**
   - Injects `Authorization: Bearer {accessToken}` header
   - Gets token from localStorage

2. **Response Interceptor**
   - Handles 401 Unauthorized with token refresh
   - Queues failed requests during token refresh
   - Updates localStorage and auth store with new tokens
   - Handles specific error status codes (400, 403, 404, 409, 500)

3. **Token Refresh Logic**
   - Uses `isRefreshing` flag to prevent concurrent refreshes
   - Uses `failedQueue` to queue requests during refresh
   - Retries original request after successful token refresh
   - Redirects to `/login` on refresh failure

### Request Flow

```javascript
import api from '../api/axios';

// Example request
try {
  const response = await api.get('/products');
  // Request interceptor adds authorization header
  // If successful, response is returned
  // If 401, response interceptor triggers token refresh
} catch (error) {
  // Error handling at component level
}
```

### Error Response Format

Backend returns errors in this format:

```javascript
{
  status: 400,
  errorType: "VALIDATION_ERROR",    // or AUTHENTICATION_ERROR, NOT_FOUND, etc.
  message: "Validation failed",
  fieldErrors: {                     // Only for validation errors
    email: "Email is required",
    password: "Password must be 8+ characters"
  },
  path: "/api/auth/register",
  timestamp: "2024-01-15T10:30:00Z"
}
```

---

## Authentication Store

### Location

File: `frontend/src/store/authStore.js`

### State Structure

```javascript
const authStore = {
  // User information
  user: {
    id, email, firstName, lastName, role, ...
  },
  
  // JWT Tokens
  accessToken: string,         // 24-hour token
  refreshToken: string,        // 7-day token
  tokenExpiresAt: number,      // Timestamp in ms
  
  // Authentication status
  isAuthenticated: boolean,
  
  // Methods
  login(userData, accessToken, refreshToken, expiresIn),
  logout(),
  updateUser(userData),
  updateTokens(accessToken, refreshToken, expiresIn),
  isTokenExpired(),
  getAccessToken()
};
```

### Methods

#### `login(userData, accessToken, refreshToken, expiresIn)`

Called after successful login/registration. Stores user and tokens.

```javascript
const { login } = useAuthStore();
login(userData, accessToken, refreshToken, expiresIn);
// Stores in localStorage and auth store
// Sets isAuthenticated = true
```

#### `logout()`

Clears all authentication data. Called on logout or token refresh failure.

```javascript
const { logout } = useAuthStore();
logout();
// Removes tokens, user, and auth state
// Sets isAuthenticated = false
```

#### `updateUser(userData)`

Updates user profile without affecting tokens.

```javascript
const { updateUser } = useAuthStore();
updateUser({ firstName: 'John', ... });
```

#### `updateTokens(accessToken, refreshToken, expiresIn)`

Called by axios interceptor after successful token refresh.

```javascript
const { updateTokens } = useAuthStore();
updateTokens(newAccessToken, newRefreshToken, expiresIn);
```

#### `isTokenExpired()`

Check if current token is expired (includes 1-minute buffer).

```javascript
const { isTokenExpired } = useAuthStore();
if (isTokenExpired()) {
  // Token needs refresh
}
```

#### `getAccessToken()`

Get current valid access token or null if expired.

```javascript
const { getAccessToken } = useAuthStore();
const token = getAccessToken();
```

### Usage in Components

```javascript
import { useAuthStore } from '../store/authStore';

export function Profile() {
  const { user, isAuthenticated, logout } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return (
    <div>
      <p>Welcome, {user.firstName}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

---

## Error Handling

### Error Response Types

Axios interceptor handles these HTTP status codes:

| Status | Type | Handler | Component Action |
|--------|------|---------|------------------|
| 400 | Bad Request | Log warning, extract fieldErrors | Display field-level errors |
| 401 | Unauthorized | Attempt token refresh, redirect if fails | Redirect to login on persistent failure |
| 403 | Forbidden | Log warning | Show "access denied" message |
| 404 | Not Found | Log warning | Show "not found" message |
| 409 | Conflict | Log warning | Show conflict message (e.g., "email already exists") |
| 500+ | Server Error | Log error | Show generic error message |

### Component-Level Error Handling

```javascript
import { useState } from 'react';
import authAPI from '../api/authAPI';
import { toast } from 'react-toastify';

export function LoginForm() {
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await authAPI.login(email, password);
      // Success handling
    } catch (error) {
      const status = error.response?.status;
      const data = error.response?.data;
      
      if (status === 400) {
        // Validation error - show field errors
        if (data?.fieldErrors) {
          setErrors(data.fieldErrors);  // {email: "...", password: "..."}
        }
      } else if (status === 401) {
        // Invalid credentials
        toast.error('Invalid email or password');
      } else if (status === 404) {
        // User not found
        toast.error('Account not found');
      } else {
        // Generic error
        toast.error(data?.message || 'An error occurred');
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {errors.email && <span className="error">{errors.email}</span>}
      
      <input name="password" />
      {errors.password && <span className="error">{errors.password}</span>}
      
      <button type="submit">Login</button>
    </form>
  );
}
```

### Error Prevention

Always include error handling in async operations:

```javascript
// ✅ Good
try {
  const data = await productAPI.getProducts();
} catch (error) {
  if (error.response?.status === 400) {
    // Handle validation error
  } else if (error.response?.status === 401) {
    // Handle auth error
  } else {
    // Handle other errors
  }
}

// ❌ Bad - No error handling
const data = await productAPI.getProducts();
```

---

## Component Integration

### Login Component

Updated to use `authAPI` and display field-level validation errors:

**File**: `frontend/src/pages/Login.jsx`

Key features:
- Uses `authAPI.login()` instead of direct API call
- Displays field-level errors from backend
- Shows session expired message if redirected from token refresh failure
- Proper loading state management

```javascript
import authAPI from '../api/authAPI';
import { useAuthStore } from '../store/authStore';

export function Login() {
  const { login } = useAuthStore();
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await authAPI.login(email, password);
      login(response.user, response.token, response.refreshToken, response.expiresIn);
    } catch (error) {
      if (error.response?.status === 400) {
        setErrors(error.response.data.fieldErrors);
      }
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {errors.email && <p className="error">{errors.email}</p>}
    </form>
  );
}
```

### Register Component

Similar to Login but with additional fields.

**File**: `frontend/src/pages/Register.jsx`

Key features:
- Uses `authAPI.register()` instead of direct API call
- Displays field-level validation errors
- Handles 409 Conflict (email already registered)
- Shows password requirements

### Home Component

Updated to use `productAPI` with error recovery.

**File**: `frontend/src/pages/Home.jsx`

Key features:
- Uses `productAPI.getFeaturedProducts()` instead of direct API call
- Displays loading spinner while fetching
- Shows error message with retry button on failure
- Handles empty state gracefully

---

## Usage Examples

### Example 1: Login with Field Validation

```javascript
import { useState } from 'react';
import authAPI from '../api/authAPI';
import { useAuthStore } from '../store/authStore';

export function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    
    try {
      const response = await authAPI.login(formData.email, formData.password);
      login(response.user, response.token, response.refreshToken, response.expiresIn);
      navigate('/');
    } catch (error) {
      if (error.response?.status === 400) {
        setErrors(error.response.data.fieldErrors || {});
      } else {
        setErrors({ form: error.response?.data?.message || 'Login failed' });
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="email"
        value={formData.email}
        onChange={(e) => {
          setFormData({ ...formData, email: e.target.value });
          setErrors({ ...errors, email: '' });
        }}
      />
      {errors.email && <p className="text-red-500">{errors.email}</p>}
      
      <input
        name="password"
        type="password"
        value={formData.password}
        onChange={(e) => {
          setFormData({ ...formData, password: e.target.value });
          setErrors({ ...errors, password: '' });
        }}
      />
      {errors.password && <p className="text-red-500">{errors.password}</p>}
      
      <button disabled={loading}>
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

### Example 2: Product List with Pagination

```javascript
import { useState, useEffect } from 'react';
import productAPI from '../api/productAPI';

export function ProductList() {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  
  useEffect(() => {
    loadProducts();
  }, [page]);
  
  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await productAPI.getProducts({
        page,
        limit: 10,
        sortBy: 'price'
      });
      setProducts(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
          
          <div className="pagination">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </button>
            <span>Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === pagination.pages}>
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Add to Cart with Error Handling

```javascript
import { useState } from 'react';
import cartAPI from '../api/cartAPI';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-toastify';

export function AddToCart({ productId }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();
  
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setLoading(true);
    try {
      await cartAPI.addToCart(productId, quantity);
      toast.success('Added to cart');
    } catch (error) {
      if (error.response?.status === 409) {
        toast.error('Out of stock');
      } else if (error.response?.status === 401) {
        navigate('/login');
      } else {
        toast.error('Failed to add to cart');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(parseInt(e.target.value))}
        min={1}
      />
      <button onClick={handleAddToCart} disabled={loading}>
        {loading ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}
```

---

## Summary

The frontend-backend integration provides:

✅ **JWT Authentication** - Secure token-based auth with automatic refresh
✅ **Modular API Services** - Organized, reusable API methods
✅ **Error Handling** - Comprehensive error management with field-level errors
✅ **Loading States** - User feedback during async operations
✅ **Token Management** - Automatic token refresh with request queuing
✅ **State Persistence** - Tokens and user data persisted to localStorage
✅ **Developer Experience** - Clear documentation and examples

All components are production-ready and follow React best practices.
