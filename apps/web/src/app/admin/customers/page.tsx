'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AdminTable, AdminMobileCard } from '@/components/admin/AdminTable';
import {
  AdminPageHeader, AdminInput, AdminPanel, AdminPagination, AdminBadge,
} from '@/components/admin/ui';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    try {
      const { data } = await api.get(`/admin/customers?${params}`);
      const payload = data?.data ?? data;
      setCustomers(payload?.customers ?? []);
      setTotalPages(payload?.totalPages ?? 0);
    } catch (_) {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const initials = (name: string) => name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div>
      <AdminPageHeader title="Customers" />

      <div className="mb-4">
        <AdminInput type="search" placeholder="Search by name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      </div>

      <AdminPanel>
        <AdminTable
          columns={[
            { key: 'avatar', label: '', width: '50px', render: (r) => (
              <div className="w-10 h-10 rounded-full bg-[var(--admin-accent)] text-[var(--admin-accent-text)] flex items-center justify-center font-bold text-sm">{initials(r.name)}</div>
            )},
            { key: 'name', label: 'Name', render: (r) => <Link href={`/admin/customers/${r._id}`} className="font-semibold hover:text-[var(--admin-accent)]">{r.name}</Link> },
            { key: 'email', label: 'Email', hideOnMobile: true, render: (r) => <span className="text-[var(--admin-text-muted)]">{r.email}</span> },
            { key: 'spent', label: 'Total Spent', render: (r) => <span className="font-display text-[var(--admin-accent)]">{typeof r.totalSpent === 'number' ? `₦${r.totalSpent.toLocaleString()}` : '₦0'}</span> },
            { key: 'status', label: 'Status', hideOnMobile: true, render: (r) => (
              <AdminBadge tone={r.isActive !== false ? 'success' : 'error'}>{r.isActive !== false ? 'Active' : 'Inactive'}</AdminBadge>
            )},
            { key: 'action', label: '', width: '80px', render: (r) => <Link href={`/admin/customers/${r._id}`} className="text-[var(--admin-accent)] text-sm font-semibold">View</Link> },
          ]}
          data={customers}
          loading={loading}
          emptyMessage="No customers found"
          mobileCardRender={(r, i) => (
            <AdminMobileCard href={`/admin/customers/${r._id}`} index={i}>
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[var(--admin-accent)] text-[var(--admin-accent-text)] flex items-center justify-center font-bold text-sm shrink-0">{initials(r.name)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">{r.name}</p>
                  <p className="text-sm text-[var(--admin-text-muted)] truncate">{r.email}</p>
                </div>
                <span className="font-display text-[var(--admin-accent)] text-sm">{typeof r.totalSpent === 'number' ? `₦${r.totalSpent.toLocaleString()}` : '₦0'}</span>
              </div>
            </AdminMobileCard>
          )}
        />
      </AdminPanel>

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
