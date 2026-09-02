'use client';

import { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { AdminTable } from '@/components/admin/AdminTable';
import {
  AdminPageHeader, AdminButton, AdminInput, AdminCard, AdminStatCard,
  AdminFilterTabs, AdminLoading, AdminPanel,
} from '@/components/admin/ui';

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
  const [activePreset, setActivePreset] = useState('Last 7 days');
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
    setActivePreset(preset.label);
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
      <AdminPageHeader
        title="Reports"
        action={<AdminButton variant="secondary" onClick={exportCsv} disabled={!data} className="hidden sm:inline-flex">Export CSV</AdminButton>}
      />

      <div className="space-y-4 mb-6">
        <AdminFilterTabs
          tabs={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
          value={activePreset}
          onChange={(v) => {
            const preset = PRESETS.find((p) => p.label === v);
            if (preset) applyPreset(preset);
          }}
        />
        <div className="grid grid-cols-2 gap-3">
          <AdminInput type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setActivePreset('Custom'); }} />
          <AdminInput type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setActivePreset('Custom'); }} />
        </div>
        <AdminFilterTabs tabs={GROUP_BY} value={groupBy} onChange={setGroupBy} />
        <AdminButton variant="secondary" onClick={exportCsv} disabled={!data} className="sm:hidden w-full">Export CSV</AdminButton>
      </div>

      {loading ? (
        <AdminLoading />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <AdminStatCard label="Total Revenue" value={`₦${(data?.totalRevenue ?? 0).toLocaleString()}`} tone="accent" />
            <AdminStatCard label="Orders" value={data?.totalOrders ?? 0} tone="info" />
            <AdminStatCard label="Avg Order Value" value={`₦${aov.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} tone="success" />
          </div>

          <AdminCard className="mb-8 min-h-[250px]">
            <h2 className="text-sm font-medium mb-4">Revenue</h2>
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
          </AdminCard>

          <AdminPanel>
            <h2 className="text-sm font-medium px-4 pt-4 pb-2">Top Products</h2>
            <AdminTable
              columns={[
                { key: 'rank', label: '#', width: '50px', render: (_: any, i?: number) => <span className="text-[var(--admin-text-muted)]">{(i ?? 0) + 1}</span> },
                { key: 'product', label: 'Product', render: (r: any) => (
                  <span className="font-semibold">{r.name}</span>
                )},
                { key: 'units', label: 'Units Sold', render: (r: any) => <span className="text-[var(--admin-text-muted)]">{r.unitsSold ?? 0}</span> },
                { key: 'revenue', label: 'Revenue', render: (r: any) => <span className="font-display text-[var(--admin-accent)]">{typeof r.revenue === 'number' ? `₦${r.revenue.toLocaleString()}` : '—'}</span> },
              ]}
              data={(data?.topProducts ?? []) as any[]}
              emptyMessage="No data"
            />
          </AdminPanel>
        </>
      )}
    </div>
  );
}
