'use client';

import { useCallback } from 'react';
import { useAuthStore } from '@/store/auth';
import { useWishlistStore } from '@/store/wishlist';
import { api } from '@/lib/api';

export function useWishlist() {
  const { accessToken } = useAuthStore();
  const { items: wishlist, setWishlist, removeItem } = useWishlistStore();

  const fetchWishlist = useCallback(async () => {
    if (!accessToken) {
      setWishlist([]);
      return;
    }
    try {
      const { data } = await api.get('/account/wishlist');
      const list = data?.data ?? data;
      setWishlist(Array.isArray(list) ? list : []);
    } catch (_) {
      setWishlist([]);
    }
  }, [accessToken, setWishlist]);

  const toggle = useCallback(
    async (productId) => {
      if (!accessToken) return;
      const id = typeof productId === 'string' ? productId : productId?._id ?? productId;
      const inList = wishlist.some((p) => (p._id || p) === id);
      try {
        if (inList) {
          await api.delete(`/account/wishlist/${id}`);
          removeItem(id);
        } else {
          await api.post('/account/wishlist', { productId: id });
          fetchWishlist();
        }
      } catch (_) {}
    },
    [accessToken, wishlist, removeItem, fetchWishlist]
  );

  const removeWithUndo = useCallback(
    async (productId) => {
      if (!accessToken) return;
      const id = typeof productId === 'string' ? productId : productId?._id ?? productId;
      const product = wishlist.find((p) => (p._id || p) === id);
      try {
        await api.delete(`/account/wishlist/${id}`);
        removeItem(id);
        return {
          undo: async () => {
            await api.post('/account/wishlist', { productId: id });
            fetchWishlist();
          },
        };
      } catch (_) {
        return null;
      }
    },
    [accessToken, wishlist, removeItem, fetchWishlist]
  );

  const isInWishlist = useCallback(
    (productId) => {
      const id = typeof productId === 'string' ? productId : productId?._id ?? productId;
      return wishlist.some((p) => (p._id || p) === id);
    },
    [wishlist]
  );

  return { wishlist, toggle, isInWishlist, fetchWishlist, removeWithUndo };
}
