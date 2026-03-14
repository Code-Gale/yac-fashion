import { create } from 'zustand';

export const useWishlistStore = create((set) => ({
  items: [],
  count: 0,
  setWishlist: (items) => set({ items: Array.isArray(items) ? items : [], count: (Array.isArray(items) ? items : []).length }),
  addItem: (product) => set((state) => {
    const id = product?._id || product;
    if (state.items.some((i) => (i._id || i) === id)) return state;
    return { items: [...state.items, product], count: state.count + 1 };
  }),
  removeItem: (productId) => set((state) => {
    const id = typeof productId === 'string' ? productId : productId?._id ?? productId;
    const next = state.items.filter((i) => (i._id || i) !== id);
    return { items: next, count: next.length };
  }),
}));
