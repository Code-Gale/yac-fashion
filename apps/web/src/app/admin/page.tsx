'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { AdminTable } from '@/components/admin/AdminTable';
import {
  AdminPageHeader, AdminStatCard, AdminCard, AdminLoading,
  AdminMobileCard, AdminStatusBadge, AdminStockBadge,
} from '@/components/admin/ui';
import { STATUS_COLORS } from '@/components/admin/ui/constants';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => {
      setData(r.data?.data ?? r.data);
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) return <AdminLoading />;

  const revenueChartData = (data.revenueByDay ?? []).map((d: any) => ({ date: d.date, revenue: d.revenue ?? 0 }));
  const ordersPieData = (data.ordersByStatus ?? []).map((d: any) => ({
    name: d._id, value: d.count, color: STATUS_COLORS[d._id] || '#9aa3b5',
  }));

  const dateStr = new Date().toLocaleDateString('en-NG', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div>
      <AdminPageHeader title="Dashboard" subtitle={dateStr} />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <AdminStatCard
          tone="accent"
          label="Revenue"
          value={`₦${(data.totalRevenue ?? 0).toLocaleString()}`}
          icon={<span className="text-lg font-bold">₦</span>}
          change={data.revenueChange != null ? { value: Math.abs(data.revenueChange), positive: data.revenueChange >= 0 } : undefined}
        />
        <AdminStatCard
          tone="success"
          label="Orders Today"
          value={data.ordersToday ?? 0}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
        />
        <AdminStatCard
          tone="info"
          label="Customers"
          value={data.totalCustomers ?? 0}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
        />
        <AdminStatCard
          tone="warning"
          label="Products"
          value={data.totalProducts ?? 0}
          icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l8 4" /></svg>}
        />
      </div>

      <div className="space-y-4 mb-5">
        <AdminCard>
          <h2 className="text-sm font-semibold mb-3">30-Day Revenue</h2>
          <div className="h-[180px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" stroke="#9aa3b5" fontSize={10} tickFormatter={(v) => v?.slice(5) ?? ''} />
                <YAxis stroke="#9aa3b5" fontSize={10} tickFormatter={(v) => `₦${(v / 1000)}k`} width={48} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                  labelStyle={{ color: '#f5f5f7' }}
                  formatter={(v) => [`₦${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#d4b05a" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-sm font-semibold mb-3">Orders by Status</h2>
          <div className="h-[180px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ordersPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {ordersPieData.map((entry: { color: string }, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} formatter={(v) => <span style={{ color: '#9aa3b5' }}>{v}</span>} />
                <Tooltip contentStyle={{ backgroundColor: '#141820', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </AdminCard>
      </div>

      <div className="space-y-4">
        <AdminCard padding={false}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--admin-border)]">
            <h2 className="text-sm font-semibold">Low Stock</h2>
            <Link href="/admin/inventory?filter=low_stock" className="text-xs text-[var(--admin-accent)] font-semibold">View All</Link>
          </div>
          <AdminTable
            columns={[
              { key: 'product', label: 'Product', render: (r) => (
                <div className="flex items-center gap-3">
                  {(r as any).images?.[0] ? (
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--admin-surface-2)] flex-shrink-0">
                      <Image src={(r as any).images[0]} alt="" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                  ) : <div className="w-8 h-8 rounded-lg bg-[var(--admin-surface-2)]" />}
                  <span className="truncate max-w-[120px]">{(r as any).name}</span>
                </div>
              )},
              { key: 'stock', label: 'Stock', render: (r) => <AdminStockBadge stock={Number((r as any).stock ?? 0)} /> },
              { key: 'action', label: '', width: '80px', render: (r) => (
                <Link href={`/admin/products/${r._id}/edit`} className="text-[var(--admin-accent)] text-sm font-semibold">Edit</Link>
              )},
            ]}
            data={data.lowStockProducts ?? []}
            mobileCardRender={(r, i) => (
              <AdminMobileCard href={`/admin/products/${(r as any)._id}/edit`} index={i}>
                <div className="flex items-center gap-3">
                  {(r as any).images?.[0] ? (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={(r as any).images[0]} alt="" width={40} height={40} className="w-full h-full object-cover" />
                    </div>
                  ) : <div className="w-10 h-10 rounded-lg bg-[var(--admin-surface-3)]" />}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{(r as any).name}</p>
                    <AdminStockBadge stock={Number((r as any).stock ?? 0)} />
                  </div>
                  <span className="text-[var(--admin-accent)] text-sm font-semibold">Edit</span>
                </div>
              </AdminMobileCard>
            )}
          />
        </AdminCard>

        <AdminCard padding={false}>
          <div className="flex items-center justify-between p-4 border-b border-[var(--admin-border)]">
            <h2 className="text-sm font-semibold">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[var(--admin-accent)] font-semibold">View All</Link>
          </div>
          <AdminTable
            columns={[
              { key: 'order', label: 'Order', render: (r: any) => <span className="font-semibold">{r.orderNumber}</span> },
              { key: 'customer', label: 'Customer', hideOnMobile: true, render: (r: any) => r.userId?.name ?? r.guestEmail ?? '—' },
              { key: 'total', label: 'Total', render: (r: any) => <span className="font-display text-[var(--admin-accent)]">₦{(r.total ?? 0).toLocaleString()}</span> },
              { key: 'status', label: 'Status', render: (r: any) => <AdminStatusBadge status={r.status} /> },
              { key: 'date', label: 'Date', hideOnMobile: true, render: (r: any) => <span className="text-[var(--admin-text-muted)] text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span> },
              { key: 'action', label: '', width: '60px', render: (r: any) => <Link href={`/admin/orders/${r._id}`} className="text-[var(--admin-accent)] text-sm font-semibold">View</Link> },
            ]}
            data={(data.recentOrders ?? []) as any[]}
            mobileCardRender={(r: any, i) => (
              <AdminMobileCard href={`/admin/orders/${r._id}`} index={i}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold">{r.orderNumber}</span>
                  <span className="text-xs text-[var(--admin-text-muted)]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <p className="text-sm text-[var(--admin-text-muted)] mb-2">{r.userId?.name ?? r.guestEmail ?? '—'}</p>
                <div className="flex justify-between items-center">
                  <AdminStatusBadge status={r.status} />
                  <span className="font-display text-[var(--admin-accent)]">₦{(r.total ?? 0).toLocaleString()}</span>
                </div>
              </AdminMobileCard>
            )}
          />
        </AdminCard>
      </div>
    </div>
  );
}
