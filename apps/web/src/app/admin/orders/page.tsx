'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AdminTable } from '@/components/admin/AdminTable';
import { cn } from '@/lib/utils';

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const STATUS_COLORS: Record<string, string> = {
  pending: '#8b92a5',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#f59e0b',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

const PAYMENT_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#22c55e',
  failed: '#ef4444',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    try {
      const { data } = await api.get(`/admin/orders?${params}`);
      const payload = data?.data ?? data;
      setOrders(payload?.orders ?? []);
      setTotal(payload?.total ?? 0);
      setTotalPages(payload?.totalPages ?? 0);
    } catch (_) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, fromDate, toDate]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const customerName = (o: any) => o.userId?.name ?? o.guestEmail ?? '—';
  const customerEmail = (o: any) => o.userId?.email ?? o.guestEmail ?? '';

  return (
    <div>
      <h1 className="font-display text-2xl text-[#f0f0f0] mb-6">Orders</h1>

      <div className="overflow-x-auto scrollbar-hide mb-6">
        <div className="flex flex-col lg:flex-row gap-4 min-w-max lg:min-w-0">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {STATUS_TABS.map((tab) => (
              <button key={tab.value} type="button" onClick={() => { setStatusFilter(tab.value); setPage(1); }} className={cn('min-h-[44px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap', statusFilter === tab.value ? 'bg-[#c9a84c] text-[#0f1117]' : 'bg-[#1a1d26] border border-white/10 text-[#8b92a5] hover:text-[#f0f0f0]')}>{tab.label}</button>
            ))}
          </div>
          <input type="search" placeholder="Search orders..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0] placeholder:text-[#8b92a5] w-full lg:w-48" />
          <div className="flex gap-2">
            <input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} className="min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0]" />
            <input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} className="min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0]" />
          </div>
        </div>
      </div>

      <div className="bg-[#1a1d26] border border-white/10 rounded-xl overflow-hidden">
        <AdminTable
          columns={[
            { key: 'order', label: 'Order', render: (r) => <span className="font-medium text-[#f0f0f0]">{r.orderNumber}</span> },
            { key: 'customer', label: 'Customer', hideOnMobile: true, render: (r) => <div><p className="text-[#f0f0f0]">{customerName(r)}</p><p className="text-xs text-[#8b92a5]">{customerEmail(r)}</p></div> },
            { key: 'items', label: 'Items', hideOnMobile: true, render: (r) => <span className="text-[#8b92a5]">{r.items?.length ?? 0} items</span> },
            { key: 'total', label: 'Total', render: (r) => <span className="font-display text-[#c9a84c]">₦{(r.total ?? 0).toLocaleString()}</span> },
            { key: 'payment', label: 'Payment', render: (r) => <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PAYMENT_COLORS[r.paymentStatus as string] || '#8b92a5'}20`, color: PAYMENT_COLORS[r.paymentStatus as string] || '#8b92a5' }}>{r.paymentStatus}</span> },
            { key: 'status', label: 'Status', render: (r) => <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[r.status as string] || '#8b92a5'}20`, color: STATUS_COLORS[r.status as string] || '#8b92a5' }}>{r.status}</span> },
            { key: 'date', label: 'Date', hideOnMobile: true, render: (r) => <span className="text-sm text-[#8b92a5]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span> },
            { key: 'action', label: '', width: '80px', render: (r) => <Link href={`/admin/orders/${r._id}`} className="text-[#c9a84c] hover:underline text-sm">View</Link> },
          ]}
          data={orders}
          loading={loading}
          emptyMessage="No orders found"
          mobileCardRender={(r) => (
            <Link href={`/admin/orders/${r._id}`} className="block bg-[#222634] rounded-lg p-4 border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-[#f0f0f0]">{r.orderNumber}</span>
                <span className="text-xs text-[#8b92a5]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
              </div>
              <p className="text-sm text-[#8b92a5] mb-2">{customerName(r)}</p>
              <div className="flex gap-2 mb-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${PAYMENT_COLORS[r.paymentStatus as string] || '#8b92a5'}20`, color: PAYMENT_COLORS[r.paymentStatus as string] || '#8b92a5' }}>{r.paymentStatus}</span>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[r.status as string] || '#8b92a5'}20`, color: STATUS_COLORS[r.status as string] || '#8b92a5' }}>{r.status}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-display text-[#c9a84c]">₦{(r.total ?? 0).toLocaleString()}</span>
                <span className="text-[#c9a84c] text-sm">View</span>
              </div>
            </Link>
          )}
        />
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="min-h-[44px] px-4 py-2 border border-white/10 rounded-lg disabled:opacity-50">Previous</button>
          <span className="min-h-[44px] flex items-center px-4 text-[#8b92a5]">Page {page} of {totalPages}</span>
          <button type="button" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="min-h-[44px] px-4 py-2 border border-white/10 rounded-lg disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
