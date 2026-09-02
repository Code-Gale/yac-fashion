'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AdminTable, AdminMobileCard } from '@/components/admin/AdminTable';
import {
  AdminPageHeader, AdminInput, AdminPanel, AdminPagination,
  AdminFilterTabs, AdminStatusBadge,
} from '@/components/admin/ui';
const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_COLORS: Record<string, string> = {
  pending: '#fbbf24', paid: '#34d399', failed: '#f87171',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (statusFilter) params.set('status', statusFilter);
    if (search) params.set('search', search);
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    try {
      const { data } = await api.get(`/admin/orders?${params}`);
      const payload = data?.data ?? data;
      setOrders(payload?.orders ?? []);
      setTotalPages(payload?.totalPages ?? 0);
    } catch (_) {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search, fromDate, toDate]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const customerName = (o: any) => o.userId?.name ?? o.guestEmail ?? '—';

  return (
    <div>
      <AdminPageHeader title="Orders" />

      <AdminFilterTabs tabs={STATUS_TABS} value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />

      <div className="space-y-3 mb-4">
        <AdminInput type="search" placeholder="Search orders..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div className="grid grid-cols-2 gap-3">
          <AdminInput type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setPage(1); }} />
          <AdminInput type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setPage(1); }} />
        </div>
      </div>

      <AdminPanel>
        <AdminTable
          columns={[
            { key: 'order', label: 'Order', render: (r) => <span className="font-semibold">{r.orderNumber}</span> },
            { key: 'customer', label: 'Customer', hideOnMobile: true, render: (r) => (
              <div><p>{customerName(r)}</p><p className="text-xs text-[var(--admin-text-muted)]">{r.userId?.email ?? r.guestEmail ?? ''}</p></div>
            )},
            { key: 'total', label: 'Total', render: (r) => <span className="font-display text-[var(--admin-accent)]">₦{(r.total ?? 0).toLocaleString()}</span> },
            { key: 'payment', label: 'Payment', render: (r) => (
              <span className="admin-badge" style={{ backgroundColor: `${PAYMENT_COLORS[r.paymentStatus as string] || '#9aa3b5'}22`, color: PAYMENT_COLORS[r.paymentStatus as string] || '#9aa3b5' }}>{r.paymentStatus}</span>
            )},
            { key: 'status', label: 'Status', render: (r) => <AdminStatusBadge status={r.status} /> },
            { key: 'date', label: 'Date', hideOnMobile: true, render: (r) => <span className="text-sm text-[var(--admin-text-muted)]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span> },
            { key: 'action', label: '', width: '80px', render: (r) => <Link href={`/admin/orders/${r._id}`} className="text-[var(--admin-accent)] text-sm font-semibold">View</Link> },
          ]}
          data={orders}
          loading={loading}
          emptyMessage="No orders found"
          mobileCardRender={(r, i) => (
            <AdminMobileCard href={`/admin/orders/${r._id}`} index={i}>
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold">{r.orderNumber}</span>
                <span className="text-xs text-[var(--admin-text-muted)]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
              </div>
              <p className="text-sm text-[var(--admin-text-muted)] mb-2">{customerName(r)}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="admin-badge" style={{ backgroundColor: `${PAYMENT_COLORS[r.paymentStatus as string] || '#9aa3b5'}22`, color: PAYMENT_COLORS[r.paymentStatus as string] || '#9aa3b5' }}>{r.paymentStatus}</span>
                <AdminStatusBadge status={r.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-display text-[var(--admin-accent)]">₦{(r.total ?? 0).toLocaleString()}</span>
                <span className="text-[var(--admin-accent)] text-sm font-semibold">View →</span>
              </div>
            </AdminMobileCard>
          )}
        />
      </AdminPanel>

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
