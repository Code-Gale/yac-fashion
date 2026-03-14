'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AdminTable } from '@/components/admin/AdminTable';
import { cn } from '@/lib/utils';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    try {
      const { data } = await api.get(`/admin/customers?${params}`);
      const payload = data?.data ?? data;
      setCustomers(payload?.customers ?? []);
      setTotal(payload?.total ?? 0);
      setTotalPages(payload?.totalPages ?? 0);
    } catch (_) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div>
      <h1 className="font-display text-2xl text-[#f0f0f0] mb-6">Customers</h1>

      <div className="mb-6">
        <input type="search" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full lg:w-80 min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0] placeholder:text-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
      </div>

      <div className="bg-[#1a1d26] border border-white/10 rounded-xl overflow-hidden">
        <AdminTable
          columns={[
            { key: 'avatar', label: '', width: '50px', render: (r) => (
              <div className="w-10 h-10 rounded-full bg-[#c9a84c] text-[#0f1117] flex items-center justify-center font-semibold text-sm">{initials(r.name)}</div>
            )},
            { key: 'name', label: 'Name', render: (r) => <Link href={`/admin/customers/${r._id}`} className="font-medium text-[#f0f0f0] hover:text-[#c9a84c]">{r.name}</Link> },
            { key: 'email', label: 'Email', hideOnMobile: true, render: (r) => <span className="text-[#8b92a5]">{r.email}</span> },
            { key: 'registered', label: 'Registered', hideOnMobile: true, render: (r) => <span className="text-sm text-[#8b92a5]">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</span> },
            { key: 'orders', label: 'Orders', hideOnMobile: true, render: (r) => <span className="text-[#8b92a5]">{r.orderCount ?? '-'}</span> },
            { key: 'spent', label: 'Total Spent', render: (r) => <span className="font-display text-[#c9a84c]">{typeof r.totalSpent === 'number' ? `₦${r.totalSpent.toLocaleString()}` : '₦0'}</span> },
            { key: 'status', label: 'Status', hideOnMobile: true, render: (r) => <span className={cn('text-xs px-2 py-0.5 rounded-full', r.isActive !== false ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#ef4444]/20 text-[#ef4444]')}>{r.isActive !== false ? 'Active' : 'Inactive'}</span> },
            { key: 'action', label: '', width: '80px', render: (r) => <Link href={`/admin/customers/${r._id}`} className="text-[#c9a84c] hover:underline text-sm">View</Link> },
          ]}
          data={customers}
          loading={loading}
          emptyMessage="No customers found"
          onRowClick={(r) => window.location.href = `/admin/customers/${r._id}`}
          mobileCardRender={(r) => (
            <Link href={`/admin/customers/${r._id}`} className="block bg-[#222634] rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#c9a84c] text-[#0f1117] flex items-center justify-center font-semibold text-sm">{initials(r.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#f0f0f0]">{r.name}</p>
                  <p className="text-sm text-[#8b92a5] truncate">{r.email}</p>
                </div>
                <span className="font-display text-[#c9a84c]">{typeof r.totalSpent === 'number' ? `₦${r.totalSpent.toLocaleString()}` : '₦0'}</span>
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
