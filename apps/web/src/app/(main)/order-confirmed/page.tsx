'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { BANK_TRANSFER } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { trackPurchase } from '@/lib/analytics';
import { trackPurchase as trackFbPurchase } from '@/lib/fbPixel';
import { trackCompletePayment } from '@/lib/tiktokPixel';

type OrderItem = {
  productId?: string;
  _id?: string;
  name?: string;
  price?: number;
  quantity?: number;
};

type OrderData = {
  orderNumber?: string;
  status?: string;
  paymentMethod?: string;
  items?: OrderItem[];
  shippingAddress?: { city?: string; state?: string };
  updatedAt?: string;
  total?: number;
};

export default function OrderConfirmedPage() {
  const searchParams = useSearchParams();
  const clearCart = useCartStore((s) => s.clearCart);
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const purchaseTracked = useRef(false);

  const reference = searchParams.get('reference'); // Paystack
  const transactionId = searchParams.get('transaction_id'); // Flutterwave
  const gatewayStatus = searchParams.get('status'); // Flutterwave: successful | cancelled | failed
  const orderNumberParam = searchParams.get('orderNumber');
  const emailParam = searchParams.get('email');
  const orderNumber = orderNumberParam || order?.orderNumber;
  const isPending = searchParams.get('pending') === '1';
  const gatewayCancelledOrFailed = gatewayStatus === 'cancelled' || gatewayStatus === 'failed';
  const [retryLoading, setRetryLoading] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    clearCart();
  }, [mounted, clearCart]);

  useEffect(() => {
    if (!mounted) return;
    const fetchOrder = async (orderNumber: string, email?: string) => {
      try {
        const params: Record<string, string> = { orderNumber };
        if (email) params.email = email;
        const { data } = await api.get('/orders/track', { params });
        const res = data?.data ?? data;
        if (res) setOrder(res);
      } catch (_) {}
    };

    const verifyAndFetch = async (orderNumber: string, email?: string) => {
      // Best-effort client-triggered confirmation — the webhook is the
      // authoritative path, but this closes the gap where a webhook is
      // delayed, blocked, or misconfigured on the gateway dashboard.
      // Never trust this alone: the subsequent /orders/track fetch reflects
      // the real, server-verified order status regardless of outcome here.
      try {
        if (reference) {
          await api.post('/payments/paystack/verify', {
            orderNumber,
            reference,
            guestEmail: email || undefined,
          });
        } else if (transactionId && !gatewayCancelledOrFailed) {
          await api.post('/payments/flutterwave/verify', {
            orderNumber,
            transactionId,
            guestEmail: email || undefined,
          });
        }
      } catch (_) {
        // Ignore — could be an amount mismatch, already paid (webhook won
        // the race), or a transient gateway error. Track fetch below wins.
      }
      await fetchOrder(orderNumber, email);
    };

    if (orderNumberParam) {
      verifyAndFetch(orderNumberParam, emailParam || undefined).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [mounted, orderNumberParam, emailParam, reference, transactionId, gatewayCancelledOrFailed]);

  const paymentMethod = order?.paymentMethod || '';
  const isCod = paymentMethod === 'cash_on_delivery';
  const isBankTransfer = paymentMethod === 'bank_transfer';
  const isOnlinePayment = paymentMethod === 'paystack' || paymentMethod === 'flutterwave';
  const isPaid = order?.status === 'confirmed' || order?.status === 'delivered' || order?.status === 'processing' || order?.status === 'shipped';
  const paymentFailed = isOnlinePayment && !isPaid && (gatewayCancelledOrFailed || Boolean(retryError));
  const isPendingOrder = isBankTransfer
    ? (order?.status && !['confirmed', 'delivered'].includes(order.status))
    : !isCod && (isPending || (order?.status && !['confirmed', 'delivered'].includes(order.status)));

  const handleRetryPayment = async () => {
    if (!orderNumberParam || !isOnlinePayment) return;
    setRetryLoading(true);
    setRetryError(null);
    try {
      const endpoint = paymentMethod === 'paystack' ? '/payments/paystack/initialize' : '/payments/flutterwave/initialize';
      const { data } = await api.post(endpoint, {
        orderNumber: orderNumberParam,
        guestEmail: emailParam || undefined,
      });
      const res = data?.data ?? data;
      if (res?.authorizationUrl) {
        window.location.href = res.authorizationUrl;
        return;
      }
      if (res?.paymentLink) {
        window.location.href = res.paymentLink;
        return;
      }
      setRetryError('Still unable to start payment. Please try again in a moment.');
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setRetryError(msg || 'Still unable to start payment. Please try again in a moment.');
    } finally {
      setRetryLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted || loading || isPendingOrder || paymentFailed || purchaseTracked.current) return;
    const txnId = reference || transactionId || orderNumberParam || order?.orderNumber;
    const value = order?.total ?? 0;
    const items = order?.items ?? [];
    if (txnId && (value > 0 || items.length > 0)) {
      purchaseTracked.current = true;
      const mappedItems = items.map((i) => ({
        productId: i.productId ?? i._id,
        name: i.name,
        price: i.price ?? 0,
        quantity: i.quantity ?? 1,
      }));
      trackPurchase(txnId, value, mappedItems);
      trackFbPurchase(value, mappedItems);
      trackCompletePayment(value, txnId);
    }
  }, [mounted, loading, isPendingOrder, order, reference, transactionId, orderNumberParam]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-8">
          {paymentFailed ? (
            <div className="w-24 h-24 mx-auto rounded-full bg-error/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ) : isPendingOrder ? (
            <div className="w-24 h-24 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
              <svg className="w-12 h-12 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ) : (
            <div className="relative w-24 h-24 mx-auto">
              <svg className="w-24 h-24 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <circle cx="12" cy="12" r="10" strokeWidth={2} strokeDasharray={63} strokeDashoffset={63} style={{ animation: 'draw-circle 0.6s ease-out forwards' }} />
                <path strokeWidth={2} d="M9 12l2 2 4-4" style={{ opacity: 0, animation: 'draw-check 0.3s ease-out 0.5s forwards' }} />
              </svg>
            </div>
          )}
        </div>

        <h1 className="font-display font-semibold text-3xl text-primary mb-2">
          {paymentFailed
            ? 'Payment Not Completed'
            : isCod
            ? 'Order Confirmed!'
            : isBankTransfer && isPendingOrder
            ? 'Order Received — Awaiting Payment'
            : isPendingOrder
            ? 'Order Confirmation Pending'
            : 'Order Confirmed!'}
        </h1>
        {orderNumber && (
          <p className="text-text-muted mb-4">Order #{orderNumber}</p>
        )}

        {paymentFailed ? (
          <>
            <p className="text-body text-text-muted mb-4">
              {gatewayCancelledOrFailed
                ? 'Your payment was cancelled or did not go through. Your order is saved — you can retry payment below.'
                : retryError}
            </p>
            <Button variant="accent" size="lg" fullWidth onClick={handleRetryPayment} loading={retryLoading} disabled={retryLoading} className="mb-6">
              Retry Payment
            </Button>
          </>
        ) : isCod ? (
          <p className="text-body text-text-muted mb-6">
            Pay on delivery when your order arrives.
          </p>
        ) : isBankTransfer && isPendingOrder ? (
          <p className="text-body text-text-muted mb-6">
            Your order will be confirmed once we verify your transfer. This usually takes 1–2 business hours.
          </p>
        ) : isPendingOrder ? (
          <p className="text-body text-text-muted mb-6">
            {isPending ? 'Your order has been received. We will confirm once payment is verified.' : 'Your order is being processed.'}
          </p>
        ) : (
          <p className="text-body text-text-muted mb-6">
            Thank you for your order! We&apos;ll send you a confirmation email shortly.
          </p>
        )}

        {isBankTransfer && isPendingOrder && (
          <div className="mb-8 p-4 bg-bg-alt rounded-lg text-left text-sm">
            <p className="font-medium mb-2">Bank Transfer Details</p>
            <p><strong>Account Name:</strong> {BANK_TRANSFER.accountName}</p>
            <p><strong>Account Number:</strong> {BANK_TRANSFER.accountNumber}</p>
            <p><strong>Bank:</strong> {BANK_TRANSFER.bankName}</p>
            <p className="text-text-muted mt-2">Include your order number in the transfer reference.</p>
          </div>
        )}

        {order?.items && order.items.length > 0 && (
          <div className="mb-8 p-6 bg-surface rounded-lg border border-border text-left">
            <h3 className="font-display font-semibold mb-4">Order Summary</h3>
            <ul className="space-y-2">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span>{item.name} × {item.quantity}</span>
                </li>
              ))}
            </ul>
            {order?.shippingAddress && (
              <p className="text-sm text-text-muted mt-4">
                Shipping to: {order.shippingAddress.city}, {order.shippingAddress.state}
              </p>
            )}
            <Link href="/track" className="inline-block mt-4 text-sm text-accent hover:underline">
              Track your order
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/track">
            <Button variant="accent" size="lg" fullWidth className="sm:w-auto">
              Track Order
            </Button>
          </Link>
          <Link href="/shop">
            <Button variant="outline" size="lg" fullWidth className="sm:w-auto">
              Continue Shopping
            </Button>
          </Link>
        </div>

        {mounted && emailParam && (
          <p className="mt-6 text-sm text-text-muted">
            <Link href={`/register?email=${encodeURIComponent(emailParam)}`} className="text-accent hover:underline">
              Create an account
            </Link>
            {' '}to track future orders easily.
          </p>
        )}
      </div>
    </div>
  );
}
