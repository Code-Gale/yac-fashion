'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useWishlist } from '@/hooks/useWishlist';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function AccountDashboardPage() {
  const { user } = useAuth();
  const { wishlist, fetchWishlist } = useWishlist();
  const [orders, setOrders] = useState<{ orders: any[]; total: number }>({ orders: [], total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/account/orders').then((r) => r.data?.data ?? r.data),
      fetchWishlist(),
    ]).then(([data]) => {
      setOrders({ orders: data?.orders ?? [], total: data?.total ?? 0 });
    }).catch(() => {}).finally(() => setLoading(false));
  }, [fetchWishlist]);

  const recentOrders = (orders.orders ?? []).slice(0, 3);
  const pendingCount = (orders.orders ?? []).filter((o: any) => ['pending', 'confirmed', 'processing', 'shipped'].includes(o.status)).length;

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl lg:text-3xl text-primary">
        {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
      </h1>
      <p className="mt-1 text-text-muted">Welcome back</p>

      <div className="mt-8 overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex gap-4 min-w-max lg:min-w-0 lg:grid lg:grid-cols-3">
          <div className="bg-surface border border-border rounded-lg p-4 min-w-[160px] lg:min-w-0">
            <p className="font-display text-2xl text-accent">{loading ? '—' : orders.total}</p>
            <p className="text-sm text-text-muted mt-0.5">orders placed</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 min-w-[160px] lg:min-w-0">
            <p className="font-display text-2xl text-accent">{loading ? '—' : pendingCount}</p>
            <p className="text-sm text-text-muted mt-0.5">in progress</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4 min-w-[160px] lg:min-w-0">
            <p className="font-display text-2xl text-accent">{loading ? '—' : wishlist.length}</p>
            <p className="text-sm text-text-muted mt-0.5">saved items</p>
          </div>
        </div>
      </div>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl text-primary">Recent Orders</h2>
          <Link href="/account/orders" className="text-sm font-medium text-accent hover:underline">
            View All
          </Link>
        </div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-surface border rounded-lg p-4 animate-pulse h-24" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="bg-surface border rounded-lg p-8 text-center text-text-muted">
            No orders yet
          </div>
        ) : (
          <div className="space-y-4 lg:hidden">
            {recentOrders.map((order: any) => (
              <Link
                key={order._id}
                href={`/account/orders/${order._id}`}
                className="block bg-surface border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium text-primary">{order.orderNumber}</span>
                  <span className="text-xs text-text-muted">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
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
                <div className="mt-2 flex justify-between items-center">
                  <span className="font-display font-semibold text-accent">₦{order.total?.toLocaleString?.() ?? '0'}</span>
                  <span className="text-sm text-accent">View</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {!loading && recentOrders.length > 0 && (
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 text-sm font-medium text-text-muted">Order</th>
                  <th className="text-left py-3 text-sm font-medium text-text-muted">Date</th>
                  <th className="text-left py-3 text-sm font-medium text-text-muted">Status</th>
                  <th className="text-right py-3 text-sm font-medium text-text-muted">Total</th>
                  <th className="text-right py-3 text-sm font-medium text-text-muted">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order: any) => (
                  <tr key={order._id} className="border-b border-border">
                    <td className="py-3 font-medium">{order.orderNumber}</td>
                    <td className="py-3 text-sm text-text-muted">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : ''}
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
                    <td className="py-3 text-right font-display font-semibold text-accent">
                      ₦{order.total?.toLocaleString?.() ?? '0'}
                    </td>
                    <td className="py-3 text-right">
                      <Link href={`/account/orders/${order._id}`} className="text-sm text-accent hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl text-primary mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/account/orders"
            className="bg-surface border rounded-lg p-5 hover:shadow-md transition-shadow flex items-center gap-4 min-h-[44px]"
          >
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
            </div>
            <span className="font-medium">Track an Order</span>
          </Link>
          <Link
            href="/shop"
            className="bg-surface border rounded-lg p-5 hover:shadow-md transition-shadow flex items-center gap-4 min-h-[44px]"
          >
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <span className="font-medium">Browse New Arrivals</span>
          </Link>
          <Link
            href="/account/wishlist"
            className="bg-surface border rounded-lg p-5 hover:shadow-md transition-shadow flex items-center gap-4 min-h-[44px]"
          >
            <div className="w-10 h-10 rounded-full bg-accent-light flex items-center justify-center">
              <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-medium">Your Wishlist</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
