'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const PAYMENT_LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
};

const PER_PAGE = 10;

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(PER_PAGE));
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await api.get(`/account/orders?${params}`);
      const payload = data?.data ?? data;
      setOrders(payload?.orders ?? []);
      setTotal(payload?.total ?? 0);
      setTotalPages(payload?.totalPages ?? 0);
    } catch (_) {
      setOrders([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="max-w-5xl">
      <h1 className="font-display text-2xl lg:text-3xl text-primary">My Orders</h1>

      <div className="mt-6 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex gap-2 min-w-max lg:flex-wrap">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setStatusFilter(tab.value);
                setPage(1);
              }}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[44px]',
                statusFilter === tab.value
                  ? 'bg-accent text-white'
                  : 'bg-surface border border-border hover:bg-bg-alt'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-8 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-surface border rounded-lg p-4 animate-pulse h-32" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="mt-8 bg-surface border rounded-lg p-12 text-center text-text-muted">
          No orders found
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-4 lg:hidden">
            {orders.map((order) => (
              <Link
                key={order._id}
                href={`/account/orders/${order._id}`}
                className="block bg-surface border rounded-lg p-4 hover:shadow-md transition-shadow border-b border-border last:border-b-0"
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-primary">{order.orderNumber}</span>
                  <span className="text-xs text-text-muted">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="mt-2 flex gap-2 flex-wrap">
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      order.paymentStatus === 'paid' && 'bg-success/20 text-success',
                      order.paymentStatus === 'failed' && 'bg-error/20 text-error',
                      order.paymentStatus === 'pending' && 'bg-warning/20 text-warning'
                    )}
                  >
                    {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                  </span>
                  <span
                    className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      order.status === 'delivered' && 'bg-success/20 text-success',
                      order.status === 'cancelled' && 'bg-error/20 text-error',
                      !['delivered', 'cancelled'].includes(order.status) && 'bg-accent-light text-accent'
                    )}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {order.items?.slice(0, 2).map((item: any, i: number) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full overflow-hidden border-2 border-surface flex-shrink-0 -ml-2 first:ml-0"
                    >
                      {item.image ? (
                        <Image src={item.image} alt="" width={32} height={32} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-bg-alt" />
                      )}
                    </div>
                  ))}
                  {order.items?.length > 2 && (
                    <span className="text-xs text-text-muted">+{order.items.length - 2} more</span>
                  )}
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="font-display font-semibold text-accent">
                    ₦{order.total?.toLocaleString?.() ?? '0'}
                  </span>
                  <span className="text-sm text-accent flex items-center gap-0.5">
                    View Details
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-sm font-medium text-text-muted">Order</th>
                  <th className="text-left py-3 text-sm font-medium text-text-muted">Date</th>
                  <th className="text-left py-3 text-sm font-medium text-text-muted">Items</th>
                  <th className="text-right py-3 text-sm font-medium text-text-muted">Total</th>
                  <th className="text-left py-3 text-sm font-medium text-text-muted">Payment</th>
                  <th className="text-left py-3 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-right py-3 text-sm font-medium text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-border">
                    <td className="py-3 font-medium">{order.orderNumber}</td>
                    <td className="py-3 text-sm text-text-muted">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                    </td>
                    <td className="py-3 text-sm">{order.items?.length ?? 0} items</td>
                    <td className="py-3 text-right font-display font-semibold text-accent">
                      ₦{order.total?.toLocaleString?.() ?? '0'}
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          order.paymentStatus === 'paid' && 'bg-success/20 text-success',
                          order.paymentStatus === 'failed' && 'bg-error/20 text-error',
                          order.paymentStatus === 'pending' && 'bg-warning/20 text-warning'
                        )}
                      >
                        {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full',
                          order.status === 'delivered' && 'bg-success/20 text-success',
                          order.status === 'cancelled' && 'bg-error/20 text-error',
                          !['delivered', 'cancelled'].includes(order.status) && 'bg-accent-light text-accent'
                        )}
                      >
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/account/orders/${order._id}`}
                        className="text-sm font-medium text-accent hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex justify-center items-center gap-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="min-h-[44px] px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-alt"
              >
                Previous
              </button>
              <span className="text-text-muted">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="min-h-[44px] px-4 py-2 border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-bg-alt"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
