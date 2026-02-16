import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import wishlistAPI from '../api/wishlist';
import { toast } from 'react-toastify';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlistIds: new Set(),
      loading: false,

      // Initialize wishlist from backend
      initWishlist: async () => {
        try {
          const response = await wishlistAPI.getWishlistProductIds();
          set({ wishlistIds: new Set(response.data) });
        } catch (error) {
          console.error('Failed to load wishlist:', error);
        }
      },

      // Add product to wishlist
      addToWishlist: async (productId) => {
        try {
          await wishlistAPI.addToWishlist(productId);
          const wishlistIds = get().wishlistIds;
          wishlistIds.add(productId);
          set({ wishlistIds: new Set(wishlistIds) });
          toast.success('Added to wishlist');
        } catch (error) {
          toast.error(error.response?.data?.message || 'Failed to add to wishlist');
        }
      },

      // Remove product from wishlist
      removeFromWishlist: async (productId) => {
        try {
          await wishlistAPI.removeFromWishlist(productId);
          const wishlistIds = get().wishlistIds;
          wishlistIds.delete(productId);
          set({ wishlistIds: new Set(wishlistIds) });
          toast.success('Removed from wishlist');
        } catch (error) {
          toast.error('Failed to remove from wishlist');
        }
      },

      // Toggle wishlist status
      toggleWishlist: async (productId) => {
        const wishlistIds = get().wishlistIds;
        if (wishlistIds.has(productId)) {
          await get().removeFromWishlist(productId);
        } else {
          await get().addToWishlist(productId);
        }
      },

      // Check if product is in wishlist
      isInWishlist: (productId) => {
        return get().wishlistIds.has(productId);
      },

      // Get wishlist count
      getWishlistCount: () => {
        return get().wishlistIds.size;
      },

      // Clear wishlist
      clearWishlist: () => {
        set({ wishlistIds: new Set() });
      }
    }),
    {
      name: 'wishlist-storage',
      partialize: (state) => ({ wishlistIds: Array.from(state.wishlistIds) }),
      onRehydrateStorage: () => (state) => {
        if (state && Array.isArray(state.wishlistIds)) {
          state.wishlistIds = new Set(state.wishlistIds);
        }
      }
    }
  )
);
