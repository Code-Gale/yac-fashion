'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';
import { AdminTable, AdminMobileCard } from '@/components/admin/AdminTable';
import {
  AdminPageHeader, AdminCard, AdminButton, AdminStatusBadge, AdminLoading,
} from '@/components/admin/ui';

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/customers/${id}`).then((r) => {
      const data = r.data?.data ?? r.data;
      setCustomer(data);
    }).catch(() => router.push('/admin/customers')).finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    api.get('/admin/orders', { params: { userId: id, limit: 100 } }).then((r) => {
      const payload = r.data?.data ?? r.data;
      setOrders(payload?.orders ?? []);
    }).catch(() => setOrders([]));
  }, [id]);

  const toggleStatus = async () => {
    if (!customer) return;
    try {
      const res = await api.put(`/admin/customers/${id}/status`, { isActive: !customer.isActive });
      setCustomer(res.data?.data ?? res.data);
      toast(customer.isActive ? 'Customer deactivated' : 'Customer activated', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    }
  };

  if (loading || !customer) {
    return <AdminLoading />;
  }

  const initials = customer.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Customer Detail" subtitle={customer.email} />

      <AdminCard>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-[var(--admin-accent)] text-[var(--admin-bg)] flex items-center justify-center font-display text-2xl font-semibold flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <h2 className="text-xl font-medium truncate">{customer.name}</h2>
            <p className="text-[var(--admin-text-muted)] truncate">{customer.email}</p>
            <p className="text-sm text-[var(--admin-text-muted)] mt-1">Registered {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-[var(--admin-text-muted)] uppercase tracking-wider">Orders</p>
            <p className="font-display text-2xl">{customer.orderCount ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-[var(--admin-text-muted)] uppercase tracking-wider">Total Spent</p>
            <p className="font-display text-2xl text-[var(--admin-accent)]">₦{(customer.totalSpent ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <AdminButton
          variant={customer.isActive !== false ? 'danger' : 'success'}
          onClick={toggleStatus}
          className="mt-6"
        >
          {customer.isActive !== false ? 'Deactivate' : 'Activate'}
        </AdminButton>
      </AdminCard>

      <AdminCard padding={false}>
        <h2 className="text-sm font-medium px-4 pt-4 pb-2">Order History</h2>
        <AdminTable
          columns={[
            { key: 'order', label: 'Order', render: (r) => <Link href={`/admin/orders/${r._id}`} className="font-semibold hover:text-[var(--admin-accent)]">{r.orderNumber}</Link> },
            { key: 'date', label: 'Date', render: (r) => <span className="text-sm text-[var(--admin-text-muted)]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span> },
            { key: 'total', label: 'Total', render: (r) => <span className="font-display text-[var(--admin-accent)]">₦{(r.total ?? 0).toLocaleString()}</span> },
            { key: 'status', label: 'Status', render: (r) => <AdminStatusBadge status={r.status} /> },
            { key: 'action', label: '', render: (r) => <Link href={`/admin/orders/${r._id}`} className="text-[var(--admin-accent)] hover:underline text-sm">View</Link> },
          ]}
          data={orders}
          emptyMessage="No orders yet"
          mobileCardRender={(r, i) => (
            <AdminMobileCard href={`/admin/orders/${r._id}`} index={i}>
              <div className="flex justify-between items-start">
                <span className="font-semibold">{r.orderNumber}</span>
                <span className="text-sm text-[var(--admin-text-muted)]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <AdminStatusBadge status={r.status} />
                <span className="font-display text-[var(--admin-accent)]">₦{(r.total ?? 0).toLocaleString()}</span>
              </div>
            </AdminMobileCard>
          )}
        />
      </AdminCard>
    </div>
  );
}
