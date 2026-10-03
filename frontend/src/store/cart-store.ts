import { create } from "zustand";
import { apiClient } from "@/lib/api-client";

export interface CartItemType {
  id: string; // Now cart_item.id
  productId: string;
  name: string;
  price: number;
  image: string;
  sizeId: string; // variant_id
  sizeValue: string; // variant_size
  quantity: number;
  maxQuantity: number;
}

interface CartState {
  items: CartItemType[];
  isOpen: boolean;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (variantId: string, quantity: number, maxQuantity: number, name: string, price: number, image: string, sizeValue: string, productId: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}

export const useCartStore = create<CartState>()((set, get) => ({
  items: [],
  isOpen: false,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      // Backend /api/cart returns the cart and items
      const res = await apiClient.get<any>('/api/cart');
      const items: CartItemType[] = (res.cart?.items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id || '', // Provided by updated backend
        name: item.name || 'Product',
        price: item.price / 100,
        image: item.image || '',
        sizeId: item.variant_id,
        sizeValue: item.size || '',
        quantity: item.quantity,
        maxQuantity: item.available_quantity || 10,
      }));
      set({ items, isLoading: false });
    } catch (err) {
      console.error(err);
      set({ isLoading: false });
    }
  },

  addItem: async (variantId, quantity, maxQuantity, name, price, image, sizeValue, productId) => {
    try {
      await apiClient.post('/api/cart/items', { variant_id: variantId, quantity });
      // Re-fetch cart from server to stay in sync
      get().fetchCart();
      set({ isOpen: true });
    } catch (err) {
      console.error(err);
      throw err;
    }
  },

  removeItem: async (id) => {
    try {
      await apiClient.delete(`/api/cart/items/${id}`);
      get().fetchCart();
    } catch (err) {
      console.error(err);
    }
  },

  updateQuantity: async (id, quantity) => {
    try {
      await apiClient.patch(`/api/cart/items/${id}`, { quantity });
      get().fetchCart();
    } catch (err) {
      console.error(err);
    }
  },

  clearCart: async () => {
    try {
      await apiClient.delete('/api/cart');
      get().fetchCart();
    } catch (err) {
      console.error(err);
    }
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
}));
