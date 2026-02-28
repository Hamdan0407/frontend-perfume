import React, { createContext, useContext, useState, useEffect } from 'react';
import { wishlistAPI } from '../api/wishlist';
import { useAuthStore } from '../store/authStore';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  const [wishlist, setWishlist] = useState([]);
  const [wishlistIds, setWishlistIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Load wishlist when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadWishlist();
    } else {
      setWishlist([]);
      setWishlistIds(new Set());
    }
  }, [isAuthenticated, user]);

  const loadWishlist = async () => {
    if (!isAuthenticated || !user) return;
    
    try {
      setLoading(true);
      const [wishlistData, productIds] = await Promise.all([
        wishlistAPI.getWishlist(),
        wishlistAPI.getWishlistProductIds(),
      ]);
      setWishlist(wishlistData);
      setWishlistIds(new Set(productIds));
    } catch (error) {
      console.error('Failed to load wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    if (!isAuthenticated || !user) {
      alert('Please login to add items to wishlist');
      return false;
    }

    try {
      const newItem = await wishlistAPI.addToWishlist(productId);
      setWishlist(prev => [newItem, ...prev]);
      setWishlistIds(prev => new Set([...prev, productId]));
      return true;
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('Product already in wishlist');
        return false;
      }
      console.error('Failed to add to wishlist:', error);
      alert('Failed to add to wishlist. Please try again.');
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!isAuthenticated || !user) return false;

    try {
      await wishlistAPI.removeFromWishlist(productId);
      setWishlist(prev => prev.filter(item => item.product.id !== productId));
      setWishlistIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
      return true;
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      alert('Failed to remove from wishlist. Please try again.');
      return false;
    }
  };

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId);
    } else {
      return await addToWishlist(productId);
    }
  };

  const isInWishlist = (productId) => {
    return wishlistIds.has(productId);
  };

  const getWishlistCount = () => {
    return wishlist.length;
  };

  const value = {
    wishlist,
    wishlistIds,
    loading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    getWishlistCount,
    refreshWishlist: loadWishlist,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
