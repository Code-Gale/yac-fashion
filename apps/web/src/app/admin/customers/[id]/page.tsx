'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';
import { AdminTable } from '@/components/admin/AdminTable';

const STATUS_COLORS: Record<string, string> = {
  pending: '#8b92a5',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#f59e0b',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

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
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-10 h-10 border-2 border-[#c9a84c] border-t-transparent rounded-full" />
      </div>
    );
  }

  const initials = customer.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/customers" className="text-[#8b92a5] hover:text-[#f0f0f0]">← Customers</Link>
        <h1 className="font-display text-2xl text-[#f0f0f0]">Customer Detail</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#c9a84c] text-[#0f1117] flex items-center justify-center font-display text-2xl font-semibold">{initials}</div>
            <div>
              <h2 className="text-xl font-medium text-[#f0f0f0]">{customer.name}</h2>
              <p className="text-[#8b92a5]">{customer.email}</p>
              <p className="text-sm text-[#8b92a5] mt-1">Registered {customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : ''}</p>
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <div>
              <p className="text-xs text-[#8b92a5] uppercase tracking-wider">Orders</p>
              <p className="font-display text-2xl text-[#f0f0f0]">{customer.orderCount ?? 0}</p>
            </div>
            <div>
              <p className="text-xs text-[#8b92a5] uppercase tracking-wider">Total Spent</p>
              <p className="font-display text-2xl text-[#c9a84c]">₦{(customer.totalSpent ?? 0).toLocaleString()}</p>
            </div>
          </div>
          <button type="button" onClick={toggleStatus} className={`mt-6 min-h-[44px] px-4 py-2 rounded-lg font-medium ${customer.isActive !== false ? 'bg-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/30' : 'bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30'}`}>
            {customer.isActive !== false ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
        <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Order History</h2>
        <AdminTable
          columns={[
            { key: 'order', label: 'Order', render: (r) => <Link href={`/admin/orders/${r._id}`} className="font-medium text-[#f0f0f0] hover:text-[#c9a84c]">{r.orderNumber}</Link> },
            { key: 'date', label: 'Date', render: (r) => <span className="text-sm text-[#8b92a5]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span> },
            { key: 'total', label: 'Total', render: (r) => <span className="font-display text-[#c9a84c]">₦{(r.total ?? 0).toLocaleString()}</span> },
            { key: 'status', label: 'Status', render: (r) => <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[r.status as string] || '#8b92a5'}20`, color: STATUS_COLORS[r.status as string] || '#8b92a5' }}>{r.status}</span> },
            { key: 'action', label: '', render: (r) => <Link href={`/admin/orders/${r._id}`} className="text-[#c9a84c] hover:underline text-sm">View</Link> },
          ]}
          data={orders}
          emptyMessage="No orders yet"
          mobileCardRender={(r) => (
            <Link href={`/admin/orders/${r._id}`} className="block bg-[#222634] rounded-lg p-4 border border-white/10">
              <div className="flex justify-between items-start">
                <span className="font-medium text-[#f0f0f0]">{r.orderNumber}</span>
                <span className="text-sm text-[#8b92a5]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[r.status as string] || '#8b92a5'}20`, color: STATUS_COLORS[r.status as string] || '#8b92a5' }}>{r.status}</span>
                <span className="font-display text-[#c9a84c]">₦{(r.total ?? 0).toLocaleString()}</span>
              </div>
            </Link>
          )}
        />
      </div>
    </div>
  );
}
