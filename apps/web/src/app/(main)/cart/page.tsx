'use client';

import { useState } from 'react';
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

export default function CartPage() {
  const { items, subtotal, coupon, discount, removeItem, updateQuantity, applyCoupon, removeCoupon } = useCart();
  const [couponExpanded, setCouponExpanded] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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

  if (items.length === 0) {
    return (
      <div className="px-4 lg:px-10 py-12">
        <EmptyState
          icon={
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          }
          heading="Your cart is empty"
          description="Add items to get started"
          action={
            <Link href="/shop">
              <Button variant="accent">Shop Now</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-10 py-8 lg:py-12 max-w-6xl mx-auto">
      <h1 className="font-display font-semibold text-2xl lg:text-3xl text-primary mb-8">
        Your Cart
      </h1>
      <div className="lg:grid lg:grid-cols-[1fr_400px] lg:gap-12">
        <div className="space-y-4 mb-8 lg:mb-0">
          {items.map((item: CartItem) => {
            const isRemoving = removingId === item.productId;
            const isUpdating = updatingId === item.productId;
            return (
              <div
                key={item.productId}
                className={cn(
                  'flex gap-4 p-4 bg-surface rounded-lg border border-border transition-all duration-250',
                  isRemoving && 'opacity-0 h-0 overflow-hidden py-0 px-0 m-0 border-0'
                )}
              >
                <Link href={`/products/${item.slug}`} className="flex-shrink-0 w-[72px] h-[72px] lg:w-24 lg:h-24 rounded-md overflow-hidden bg-bg-alt relative block">
                  {item.image ? (
                    <Image src={item.image} alt="" fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="w-full h-full bg-bg-alt" />
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.slug}`}>
                    <p className="font-medium text-primary line-clamp-1 hover:text-accent">{item.name}</p>
                  </Link>
                  <p className="text-sm text-text-muted mt-0.5">₦{(item.price ?? 0).toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.productId, -1)}
                      disabled={isUpdating || (item.quantity ?? 1) <= 1}
                      className="w-8 h-8 flex items-center justify-center border border-border rounded text-sm disabled:opacity-50"
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.productId, 1)}
                      disabled={isUpdating || (item.quantity ?? 1) >= (item.stock ?? 99)}
                      className="w-8 h-8 flex items-center justify-center border border-border rounded text-sm disabled:opacity-50"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button
                    type="button"
                    onClick={() => handleRemove(item.productId)}
                    disabled={isRemoving}
                    className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-error rounded"
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
                  <p className="font-medium text-primary">
                    ₦{((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-surface rounded-lg border border-border p-6">
            <h2 className="font-display font-semibold text-lg mb-4">Order Summary</h2>
            <div>
              <button
                type="button"
                onClick={() => setCouponExpanded(!couponExpanded)}
                className="text-sm text-accent hover:underline"
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
                    className="flex-1 px-4 py-3 border border-border rounded-md text-base"
                  />
                  <Button variant="outline" size="sm" onClick={handleApplyCoupon} disabled={couponLoading || !couponInput.trim()}>
                    Apply
                  </Button>
                </div>
              )}
              {coupon && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-md bg-accent/10">
                  <span className="text-sm font-medium text-accent">{coupon}</span>
                  <span className="text-sm text-text-muted">−₦{discount.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={removeCoupon}
                    className="ml-auto w-6 h-6 flex items-center justify-center rounded hover:bg-accent/20"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-1 text-sm mt-4">
              <div className="flex justify-between">
                <span className="text-text-muted">Subtotal</span>
                <span>₦{subtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-accent">
                  <span>Discount</span>
                  <span>−₦{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-text-muted">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
              <div className="flex justify-between font-display font-semibold text-lg text-accent pt-2">
                <span>Total</span>
                <span>₦{total.toLocaleString()}</span>
              </div>
            </div>
            <Link href="/checkout" className="block mt-6">
              <Button variant="accent" size="lg" fullWidth>
                Checkout (₦{total.toLocaleString()})
              </Button>
            </Link>
            <Link href="/shop" className="block mt-3">
              <Button variant="ghost" fullWidth>
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
