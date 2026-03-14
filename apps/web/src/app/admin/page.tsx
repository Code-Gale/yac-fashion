'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { api } from '@/lib/api';
import { AdminTable } from '@/components/admin/AdminTable';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  confirmed: '#22c55e',
  shipped: '#c9a84c',
  pending: '#f59e0b',
  cancelled: '#ef4444',
  processing: '#8b5cf6',
  delivered: '#22c55e',
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then((r) => {
      setData(r.data?.data ?? r.data);
    }).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-10 h-10 border-2 border-[#c9a84c] border-t-transparent rounded-full" />
      </div>
    );
  }

  const revenueChartData = (data.revenueByDay ?? []).map((d: any) => ({ date: d.date, revenue: d.revenue ?? 0 }));
  const ordersPieData = (data.ordersByStatus ?? []).map((d: any) => ({ name: d._id, value: d.count, color: STATUS_COLORS[d._id] || '#8b92a5' }));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl text-[#f0f0f0]">Dashboard</h1>
        <p className="text-sm text-[#8b92a5]">{new Date().toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
              <span className="text-[#c9a84c] text-lg">₦</span>
            </div>
            <span className="text-xs text-[#8b92a5] uppercase tracking-wider">Total Revenue</span>
          </div>
          <p className="font-display text-2xl text-[#f0f0f0]">₦{(data.totalRevenue ?? 0).toLocaleString()}</p>
          {data.revenueChange != null && (
            <span className={cn('text-xs mt-1', data.revenueChange >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
              {data.revenueChange >= 0 ? '↑' : '↓'}{Math.abs(data.revenueChange).toFixed(1)}%
            </span>
          )}
        </div>
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
            </div>
            <span className="text-xs text-[#8b92a5] uppercase tracking-wider">Orders Today</span>
          </div>
          <p className="font-display text-2xl text-[#f0f0f0]">{data.ordersToday ?? 0}</p>
        </div>
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#8b5cf6]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#8b5cf6]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <span className="text-xs text-[#8b92a5] uppercase tracking-wider">Active Customers</span>
          </div>
          <p className="font-display text-2xl text-[#f0f0f0]">{data.totalCustomers ?? 0}</p>
        </div>
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#f59e0b]/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10l8 4" /></svg>
            </div>
            <span className="text-xs text-[#8b92a5] uppercase tracking-wider">Total Products</span>
          </div>
          <p className="font-display text-2xl text-[#f0f0f0]">{data.totalProducts ?? 0}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5 min-h-[250px]">
          <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">30-Day Revenue</h2>
          <div className="h-[200px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="date" stroke="#8b92a5" fontSize={11} tickFormatter={(v) => v?.slice(5) ?? ''} />
                <YAxis stroke="#8b92a5" fontSize={11} tickFormatter={(v) => `₦${(v / 1000)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                  labelStyle={{ color: '#f0f0f0' }}
                  formatter={(v) => [`₦${Number(v ?? 0).toLocaleString()}`, 'Revenue']}
                />
                <Line type="monotone" dataKey="revenue" stroke="#c9a84c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5 min-h-[250px]">
          <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Orders by Status</h2>
          <div className="h-[200px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ordersPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {ordersPieData.map((entry: { name: string; value: number; color: string }, i: number) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} formatter={(v) => <span className="text-[#8b92a5]">{v}</span>} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}
                  formatter={(v, name) => [v ?? 0, name]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#f0f0f0]">Low Stock Products</h2>
            <Link href="/admin/inventory?filter=low_stock" className="text-xs text-[#c9a84c] hover:underline">View All</Link>
          </div>
          <AdminTable
            columns={[
              { key: 'product', label: 'Product', render: (r) => (
                <div className="flex items-center gap-3">
                  {(r as any).images?.[0] ? (
                    <div className="w-8 h-8 rounded overflow-hidden bg-[#222634] flex-shrink-0">
                      <Image src={(r as any).images[0]} alt="" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                  ) : <div className="w-8 h-8 rounded bg-[#222634]" />}
                  <span className="text-[#f0f0f0] truncate max-w-[120px]">{(r as any).name}</span>
                </div>
              )},
              { key: 'stock', label: 'Stock', render: (r) => {
                const s = Number((r as any).stock ?? 0);
                return (
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    s === 0 && 'bg-[#ef4444]/20 text-[#ef4444]',
                    s > 0 && s <= 5 && 'bg-[#f59e0b]/20 text-[#f59e0b]',
                    s > 5 && s <= 10 && 'bg-[#f59e0b]/20 text-[#f59e0b]',
                    s > 10 && 'bg-[#22c55e]/20 text-[#22c55e]'
                  )}>
                    {s}
                  </span>
                );
              }},
              { key: 'action', label: '', width: '80px', render: (r) => (
                <Link href={`/admin/products/${r._id}/edit`} className="text-[#c9a84c] hover:underline text-sm">Edit</Link>
              )},
            ]}
            data={data.lowStockProducts ?? []}
            mobileCardRender={(r) => (
              <Link href={`/admin/products/${(r as any)._id}/edit`} className="block bg-[#222634] rounded-lg p-4 border border-white/10">
                <div className="flex items-center gap-3">
                  {(r as any).images?.[0] ? (
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      <Image src={(r as any).images[0]} alt="" width={32} height={32} className="w-full h-full object-cover" />
                    </div>
                  ) : <div className="w-8 h-8 rounded bg-[#222634]" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-[#f0f0f0] truncate">{(r as any).name}</p>
                    <span className={cn(
                      'text-xs', Number((r as any).stock ?? 0) === 0 ? 'text-[#ef4444]' : 'text-[#f59e0b]'
                    )}>Stock: {(r as any).stock}</span>
                  </div>
                  <span className="text-[#c9a84c] text-sm">Edit</span>
                </div>
              </Link>
            )}
          />
        </div>
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-[#f0f0f0]">Recent Orders</h2>
            <Link href="/admin/orders" className="text-xs text-[#c9a84c] hover:underline">View All</Link>
          </div>
          <AdminTable
            columns={[
              { key: 'order', label: 'Order', render: (r: any) => <span className="font-medium text-[#f0f0f0]">{r.orderNumber}</span> },
              { key: 'customer', label: 'Customer', hideOnMobile: true, render: (r: any) => (r.userId?.name ?? r.guestEmail ?? '—') },
              { key: 'total', label: 'Total', render: (r: any) => <span className="font-display text-[#c9a84c]">₦{(r.total ?? 0).toLocaleString()}</span> },
              { key: 'status', label: 'Status', render: (r: any) => (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[r.status] || '#8b92a5'}20`, color: STATUS_COLORS[r.status] || '#8b92a5' }}>{r.status}</span>
              )},
              { key: 'date', label: 'Date', hideOnMobile: true, render: (r: any) => <span className="text-[#8b92a5] text-sm">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span> },
              { key: 'action', label: '', width: '60px', render: (r: any) => <Link href={`/admin/orders/${r._id}`} className="text-[#c9a84c] hover:underline text-sm">View</Link> },
            ]}
            data={(data.recentOrders ?? []) as any[]}
            mobileCardRender={(r: any) => (
              <Link href={`/admin/orders/${r._id}`} className="block bg-[#222634] rounded-lg p-4 border border-white/10">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-[#f0f0f0]">{r.orderNumber}</span>
                  <span className="text-xs text-[#8b92a5]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span>
                </div>
                <p className="text-sm text-[#8b92a5] mb-2">{r.userId?.name ?? r.guestEmail ?? '—'}</p>
                <div className="flex justify-between items-center">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${STATUS_COLORS[r.status] || '#8b92a5'}20`, color: STATUS_COLORS[r.status] || '#8b92a5' }}>{r.status}</span>
                  <span className="font-display text-[#c9a84c]">₦{(r.total ?? 0).toLocaleString()}</span>
                </div>
              </Link>
            )}
          />
        </div>
      </div>
    </div>
  );
}
