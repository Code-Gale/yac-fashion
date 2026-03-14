'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/utils';

type CartItem = {
  productId: string;
  name?: string;
  slug?: string;
  image?: string | null;
  price?: number;
  quantity?: number;
  stock?: number;
};

export function CartDrawer() {
  const { items, subtotal, itemCount, coupon, discount, closeCart, isOpen, removeItem, updateQuantity, applyCoupon, removeCoupon } = useCart();
  const [couponExpanded, setCouponExpanded] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const total = Math.max(0, subtotal - discount);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await removeItem(productId);
    } finally {
      setRemovingId(null);
    }
  };

  const handleQuantityChange = async (productId: string, delta: number) => {
    const item = items.find((i: CartItem) => i.productId === productId);
    if (!item) return;
    const newQty = Math.max(1, Math.min(item.stock ?? 99, (item.quantity ?? 1) + delta));
    if (newQty === item.quantity) return;
    setUpdatingId(productId);
    try {
      await updateQuantity(productId, newQty);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim() || couponLoading) return;
    setCouponLoading(true);
    try {
      await applyCoupon(couponInput.trim());
      setCouponInput('');
      setCouponExpanded(false);
    } finally {
      setCouponLoading(false);
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true" aria-label="Shopping cart">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Cart panel - slides in from right on desktop, from bottom on mobile */}
      <aside
        className={cn(
          'absolute flex flex-col bg-white',
          'top-0 right-0 bottom-0 w-full max-w-[380px]',
          'shadow-2xl',
          'transition-transform duration-300 ease-out',
          // Closed: off-screen right. Open: in view.
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        style={{ boxShadow: '-4px 0 24px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200 shrink-0">
          <h2 className="font-display font-semibold text-lg text-gray-900">
            Your Cart
            <span className="text-gray-500 font-normal ml-1">({itemCount})</span>
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600"
            aria-label="Close cart"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {items.length === 0 ? (
            <div className="p-8">
              <EmptyState
                icon={
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                }
                heading="Your cart is empty"
                description="Add items to get started"
                action={
                  <Link href="/shop" onClick={closeCart}>
                    <Button variant="accent">Shop Now</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item: CartItem) => {
                const isRemoving = removingId === item.productId;
                const isUpdating = updatingId === item.productId;
                return (
                  <div
                    key={item.productId}
                    className={cn(
                      'flex gap-3 transition-all duration-250',
                      isRemoving && 'opacity-0 h-0 overflow-hidden py-0 m-0'
                    )}
                  >
                    <div className="relative flex-shrink-0 w-[72px] h-[72px] rounded-md overflow-hidden bg-gray-100">
                      {item.image ? (
                        <Image src={item.image} alt="" fill className="object-cover" sizes="72px" />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 line-clamp-1">{item.name}</p>
                      <p className="text-sm text-gray-500">₦{(item.price ?? 0).toLocaleString()}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.productId, -1)}
                          disabled={isUpdating || (item.quantity ?? 1) <= 1}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(item.productId, 1)}
                          disabled={isUpdating || (item.quantity ?? 1) >= (item.stock ?? 99)}
                          className="w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-sm disabled:opacity-50 hover:bg-gray-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.productId)}
                      disabled={isRemoving}
                      className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-gray-400 hover:text-red-600 rounded"
                      aria-label="Remove item"
                    >
                      {isRemoving ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer - only when cart has items */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4 shrink-0 bg-white">
            <div>
              <button
                type="button"
                onClick={() => setCouponExpanded(!couponExpanded)}
                className="text-sm text-amber-700 hover:underline"
              >
                Have a promo code?
              </button>
              {couponExpanded && (
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-base"
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                    Apply
                  </Button>
                </div>
              )}
              {coupon && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50">
                  <span className="text-sm font-medium text-amber-800">{coupon}</span>
                  <span className="text-sm text-gray-500">−₦{discount.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="ml-auto w-6 h-6 flex items-center justify-center rounded hover:bg-amber-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-amber-700">
                  <span>Discount</span>
                  <span>−₦{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-semibold text-lg text-amber-800 pt-2">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>

            <Link href="/checkout" onClick={closeCart}>
              <Button variant="accent" size="lg" fullWidth>
                Checkout (₦{total.toLocaleString()})
              </Button>
            </Link>
            <Link href="/shop" onClick={closeCart} className="block">
              <Button variant="ghost" fullWidth>
                Continue Shopping
              </Button>
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
