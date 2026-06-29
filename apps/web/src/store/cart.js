import { create } from 'zustand';
import { getSessionId } from '@/lib/session';
import { api } from '@/lib/api';

export const useCartStore = create((set, get) => ({
  items: [],
  subtotal: 0,
  itemCount: 0,
  coupon: null,
  discount: 0,
  isOpen: false,
  hydrated: false,
  setCart: (data) =>
    set({
      items: data?.items ?? [],
      subtotal: data?.subtotal ?? 0,
      itemCount: data?.itemCount ?? 0,
      coupon: data?.couponCode ?? null,
      discount: data?.discount ?? 0,
    }),
  clearCart: () =>
    set({
      items: [],
      subtotal: 0,
      itemCount: 0,
      coupon: null,
      discount: 0,
    }),
  hydrateCart: async () => {
    if (get().hydrated) return;
    
    try {
      const sessionId = getSessionId();
      const { data } = await api.get('/cart', {
        headers: { 'x-session-id': sessionId },
      });
      const cart = data?.data ?? data;
      set({
        items: cart?.items ?? [],
        subtotal: cart?.subtotal ?? 0,
        itemCount: cart?.itemCount ?? 0,
        coupon: cart?.couponCode ?? null,
        discount: cart?.discount ?? 0,
        hydrated: true,
      });
    } catch (err) {
      // Silent fail - cart might not exist yet
      set({ hydrated: true });
    }
  },
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  getSessionId,
}));
