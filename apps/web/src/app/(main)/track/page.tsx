'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'placed', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_ORDER = ['placed', 'pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function TrackPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<{ status?: string; orderNumber?: string; updatedAt?: string; subtotal?: number; discount?: number; shippingFee?: number; total?: number; items?: { product?: { name?: string }; name?: string; price?: number; quantity?: number }[] } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const { data } = await api.get('/orders/track', {
        params: { orderNumber: orderNumber.trim(), email: email.trim() },
      });
      const result = data?.data ?? data;
      setOrder(result);
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(message || 'Order not found. Please check your order number and email.');
    } finally {
      setLoading(false);
    }
  };

  const statusKey = order?.status?.toLowerCase?.() || '';
  const currentIndex = statusKey
    ? Math.max(0, STATUS_ORDER.indexOf(statusKey === 'pending' ? 'placed' : statusKey))
    : -1;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <h1 className="font-display font-semibold text-2xl text-primary text-center mb-6">
          Track Your Order
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-surface rounded-lg border border-border p-6 shadow-sm"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-primary mb-1">
                Order Number
              </label>
              <input
                id="orderNumber"
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                placeholder="e.g. ORD-12345"
                className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-primary placeholder:text-text-muted"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-primary placeholder:text-text-muted"
                required
              />
            </div>
          </div>
          {error && (
            <p className="mt-4 text-sm text-error">{error}</p>
          )}
          <Button
            type="submit"
            variant="accent"
            fullWidth
            className="mt-6"
            disabled={loading}
            loading={loading}
          >
            Track Order
          </Button>
        </form>

        {order && (
          <div className="mt-8 bg-surface rounded-lg border border-border p-6 shadow-sm">
            <h2 className="font-display font-semibold text-lg text-primary mb-6">
              Order #{order.orderNumber || orderNumber}
            </h2>
            <div className="relative">
              {STEPS.map((step, i) => {
                const isCompleted = i <= currentIndex;
                const isCurrent = i === currentIndex;
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-4 h-4 rounded-full border-2 flex-shrink-0',
                          isCompleted ? 'bg-accent border-accent' : 'border-border bg-surface',
                          isCurrent && 'animate-pulse'
                        )}
                      />
                      {i < STEPS.length - 1 && (
                        <div
                          className={cn(
                            'w-0.5 min-h-[32px] mt-1',
                            isCompleted ? 'bg-accent' : 'bg-border'
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-8 pt-0.5">
                      <p className={cn(
                        'font-medium',
                        isCompleted ? 'text-primary' : 'text-text-muted'
                      )}>
                        {step.label}
                      </p>
                      {order.updatedAt && isCurrent && (
                        <p className="text-xs text-text-muted mt-0.5">
                          {new Date(order.updatedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {(order.subtotal != null || order.total != null) && (
              <div className="mt-6 pt-6 border-t border-border space-y-1 text-sm">
                {order.subtotal != null && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Subtotal</span>
                    <span>₦{(order.subtotal ?? 0).toLocaleString()}</span>
                  </div>
                )}
                {order.discount != null && order.discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Discount</span>
                    <span>−₦{(order.discount ?? 0).toLocaleString()}</span>
                  </div>
                )}
                {order.shippingFee != null && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Shipping</span>
                    <span>₦{(order.shippingFee ?? 0).toLocaleString()}</span>
                  </div>
                )}
                {order.total != null && (
                  <div className="flex justify-between font-semibold pt-2">
                    <span>Total</span>
                    <span>₦{(order.total ?? 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            )}
            {order.items && order.items.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="font-medium text-primary mb-4">Order Summary</h3>
                <ul className="space-y-2">
                  {order.items.map((item, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-primary">
                        {item.product?.name || item.name || 'Item'} × {item.quantity ?? 1}
                      </span>
                      <span className="text-text-muted">
                        ₦{((item.price ?? 0) * (item.quantity ?? 1)).toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
