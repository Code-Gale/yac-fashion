import { create } from 'zustand';
import { getSessionId } from '@/lib/session';

export const useCartStore = create((set, get) => ({
  items: [],
  subtotal: 0,
  itemCount: 0,
  coupon: null,
  discount: 0,
  isOpen: false,
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
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  getSessionId,
}));
