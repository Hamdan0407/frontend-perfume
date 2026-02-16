import { create } from 'zustand';

export const useCartStore = create((set) => ({
  cart: null,
  itemCount: 0,
  
  setCart: (cart) => set({ 
    cart, 
    itemCount: cart?.itemCount || 0 
  }),
  
  clearCart: () => set({ 
    cart: null, 
    itemCount: 0 
  }),
}));
