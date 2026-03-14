'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { AdminTable } from '@/components/admin/AdminTable';
import { cn } from '@/lib/utils';

const PRESETS = [
  { label: 'Today', from: () => new Date().toISOString().slice(0, 10), to: () => new Date().toISOString().slice(0, 10) },
  { label: 'Last 7 days', from: () => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); }, to: () => new Date().toISOString().slice(0, 10) },
  { label: 'Last 30 days', from: () => { const d = new Date(); d.setDate(d.getDate() - 29); return d.toISOString().slice(0, 10); }, to: () => new Date().toISOString().slice(0, 10) },
  { label: 'This month', from: () => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); }, to: () => new Date().toISOString().slice(0, 10) },
  { label: 'Custom', from: () => '', to: () => '' },
];

const GROUP_BY = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

export default function AdminReportsPage() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [groupBy, setGroupBy] = useState('day');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (fromDate) params.set('from', fromDate);
    if (toDate) params.set('to', toDate);
    params.set('groupBy', groupBy);
    try {
      const { data: res } = await api.get(`/admin/reports/sales?${params}`);
      setData(res?.data ?? res);
    } catch (_) {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, groupBy]);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 6);
    setFromDate(weekAgo.toISOString().slice(0, 10));
    setToDate(today);
  }, []);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setFromDate(preset.from());
    setToDate(preset.to());
  };

  const exportCsv = () => {
    const periods = data?.periods ?? [];
    const topProducts = data?.topProducts ?? [];
    const headers = ['Date', 'Revenue', 'Orders'];
    const periodRows = periods.map((p: any) => [p.date, p.revenue ?? 0, p.orderCount ?? 0]);
    const productHeaders = ['Product', 'Units Sold', 'Revenue'];
    const productRows = topProducts.map((p: any) => [p.name, p.unitsSold ?? 0, p.revenue ?? 0]);
    const csv = [
      headers.join(','),
      ...periodRows.map((r: any[]) => r.join(',')),
      '',
      productHeaders.join(','),
      ...productRows.map((r: any[]) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${fromDate}-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = (data?.periods ?? []).map((p: any) => ({ date: p.date, revenue: p.revenue ?? 0, orderCount: p.orderCount ?? 0 }));
  const aov = (data?.totalOrders ?? 0) > 0 ? (data?.totalRevenue ?? 0) / (data?.totalOrders ?? 1) : 0;

  return (
    <div>
      <h1 className="font-display text-2xl text-[#f0f0f0] mb-6">Reports</h1>

      <div className="flex flex-col lg:flex-row gap-4 mb-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} type="button" onClick={() => applyPreset(p)} className={cn('min-h-[44px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap', p.label === 'Custom' ? 'bg-[#1a1d26] border border-white/10 text-[#8b92a5]' : 'bg-[#1a1d26] border border-white/10 text-[#8b92a5] hover:text-[#f0f0f0]')}>{p.label}</button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0]" />
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0]" />
          {GROUP_BY.map((g) => (
            <button key={g.value} type="button" onClick={() => setGroupBy(g.value)} className={cn('min-h-[44px] px-4 py-2 rounded-full text-sm font-medium', groupBy === g.value ? 'bg-[#c9a84c] text-[#0f1117]' : 'bg-[#1a1d26] border border-white/10 text-[#8b92a5]')}>{g.label}</button>
          ))}
        </div>
        <button type="button" onClick={exportCsv} disabled={!data} className="min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0] hover:bg-white/5 ml-auto">Export CSV</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin w-10 h-10 border-2 border-[#c9a84c] border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <p className="text-xs text-[#8b92a5] uppercase tracking-wider">Total Revenue</p>
              <p className="font-display text-2xl text-[#f0f0f0] mt-1">₦{(data?.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <p className="text-xs text-[#8b92a5] uppercase tracking-wider">Orders</p>
              <p className="font-display text-2xl text-[#f0f0f0] mt-1">{data?.totalOrders ?? 0}</p>
            </div>
            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <p className="text-xs text-[#8b92a5] uppercase tracking-wider">Avg Order Value</p>
              <p className="font-display text-2xl text-[#f0f0f0] mt-1">₦{aov.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>

          <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5 mb-8 min-h-[250px]">
            <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Revenue</h2>
            <div className="h-[200px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                  <XAxis dataKey="date" stroke="#8b92a5" fontSize={11} tickFormatter={(v) => (v?.length > 10 ? v?.slice(5) : v) ?? ''} />
                  <YAxis stroke="#8b92a5" fontSize={11} tickFormatter={(v) => `₦${(v / 1000)}k`} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1d26', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }} formatter={(v, name) => [name === 'revenue' ? `₦${Number(v ?? 0).toLocaleString()}` : (v ?? 0), name === 'revenue' ? 'Revenue' : 'Orders']} />
                  <Bar dataKey="revenue" fill="#c9a84c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Top Products</h2>
            <AdminTable
              columns={[
                { key: 'rank', label: '#', width: '50px', render: (_: any, i?: number) => <span className="text-[#8b92a5]">{(i ?? 0) + 1}</span> },
                { key: 'product', label: 'Product', render: (r: any) => (
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-[#f0f0f0]">{r.name}</span>
                  </div>
                )},
                { key: 'units', label: 'Units Sold', render: (r: any) => <span className="text-[#8b92a5]">{r.unitsSold ?? 0}</span> },
                { key: 'revenue', label: 'Revenue', render: (r: any) => <span className="font-display text-[#c9a84c]">{typeof r.revenue === 'number' ? `₦${r.revenue.toLocaleString()}` : '—'}</span> },
              ]}
              data={(data?.topProducts ?? []) as any[]}
              emptyMessage="No data"
            />
          </div>
        </>
      )}
    </div>
  );
}
