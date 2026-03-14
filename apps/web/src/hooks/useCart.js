'use client';

import { useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';

export function useCart() {
  const { items, subtotal, itemCount, coupon, discount, setCart, clearCart, openCart, closeCart, toggleCart } = useCartStore();
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      const cart = data?.data ?? data;
      setCart(cart || { items: [], subtotal: 0, itemCount: 0, couponCode: null, discount: 0 });
    } catch (_) {
      setCart({ items: [], subtotal: 0, itemCount: 0, couponCode: null, discount: 0 });
    }
  }, [setCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, accessToken]);

  const addItem = useCallback(
    async (productId, quantity = 1) => {
      const prevCount = itemCount;
      try {
        const { data } = await api.post('/cart/items', { productId, quantity });
        const cart = data?.data ?? data;
        setCart(cart);
        openCart();
        if ((cart?.itemCount ?? 0) > prevCount) {
          toast('Added to cart', 'success');
        }
        return cart;
      } catch (err) {
        toast(err.response?.data?.message || 'Failed to add to cart', 'error');
        throw err;
      }
    },
    [itemCount, setCart, openCart, toast]
  );

  const removeItem = useCallback(
    async (productId) => {
      try {
        const { data } = await api.delete(`/cart/items/${productId}`);
        setCart(data?.data ?? data);
      } catch (_) {}
    },
    [setCart]
  );

  const updateQuantity = useCallback(
    async (productId, quantity) => {
      try {
        const { data } = await api.put(`/cart/items/${productId}`, { quantity });
        setCart(data?.data ?? data);
      } catch (_) {}
    },
    [setCart]
  );

  const applyCoupon = useCallback(
    async (code) => {
      try {
        const { data } = await api.post('/cart/coupon', { code });
        const res = data?.data ?? data;
        setCart({ items: res?.items ?? [], subtotal: res?.subtotal ?? 0, itemCount: res?.itemCount ?? 0, couponCode: res?.couponCode ?? res?.coupon ?? null, discount: res?.discount ?? 0 });
        toast('Coupon applied', 'success');
      } catch (err) {
        toast(err.response?.data?.message || 'Invalid coupon', 'error');
        throw err;
      }
    },
    [setCart, toast]
  );

  const removeCoupon = useCallback(
    async () => {
      try {
        const { data } = await api.delete('/cart/coupon');
        const res = data?.data ?? data;
        setCart(res || { items: [], subtotal: 0, itemCount: 0, couponCode: null, discount: 0 });
      } catch (_) {}
    },
    [setCart]
  );

  const isOpen = useCartStore((s) => s.isOpen);

  return {
    items,
    subtotal,
    itemCount,
    coupon,
    discount,
    addItem,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    fetchCart,
    clearCart,
    openCart,
    closeCart,
    toggleCart,
    isOpen,
  };
}
