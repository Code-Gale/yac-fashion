'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { AdminTable, AdminMobileCard } from '@/components/admin/AdminTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import {
  AdminPageHeader, AdminButton, AdminInput, AdminSelect,
  AdminPanel, AdminPagination, AdminFab, AdminStockBadge,
  AdminBadge, AdminModalActions,
} from '@/components/admin/ui';
export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<'delete' | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (categoryFilter) params.set('category', categoryFilter);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const { data } = await api.get(`/admin/products?${params}`);
      const payload = data?.data ?? data;
      setProducts(payload?.products ?? []);
      setTotalPages(payload?.totalPages ?? 0);
    } catch (_) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter, statusFilter]);

  useEffect(() => {
    api.get('/admin/categories').then((r) => {
      const list = r.data?.data ?? r.data;
      setCategories(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const deleteProduct = async (id: string) => {
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/products/${id}`);
      toast('Product deleted', 'success');
      setDeleteTarget(null);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      fetchProducts();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to delete product', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const runBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      if (action === 'delete') {
        for (const id of Array.from(selected)) await api.delete(`/admin/products/${id}`);
        toast('Products deleted', 'success');
      } else {
        for (const id of Array.from(selected)) await api.put(`/admin/products/${id}`, { isActive: action === 'activate' });
        toast(`Products ${action === 'activate' ? 'activated' : 'deactivated'}`, 'success');
      }
      setBulkModal(null);
      setSelected(new Set());
      fetchProducts();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Action failed', 'error');
    } finally {
      setBulkLoading(false);
    }
  };

  const columns = [
    { key: 'checkbox', label: '', width: '40px', hideOnMobile: true, render: (r: any) => (
      <input type="checkbox" checked={selected.has(r._id)} onChange={() => {
        setSelected((prev) => { const n = new Set(prev); n.has(r._id) ? n.delete(r._id) : n.add(r._id); return n; });
      }} className="rounded accent-[var(--admin-accent)]" />
    )},
    { key: 'image', label: '', width: '50px', render: (r: any) => (
      r.images?.[0] ? (
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-[var(--admin-surface-2)]">
          <Image src={r.images[0]} alt="" width={40} height={40} className="w-full h-full object-cover" />
        </div>
      ) : <div className="w-10 h-10 rounded-lg bg-[var(--admin-surface-2)]" />
    )},
    { key: 'name', label: 'Product', render: (r: any) => (
      <div>
        <p className="font-semibold">{r.name}</p>
        <p className="text-xs text-[var(--admin-text-muted)]">{r.slug}</p>
      </div>
    )},
    { key: 'category', label: 'Category', hideOnMobile: true, render: (r: any) => (
      <span className="text-[var(--admin-text-muted)]">{r.category?.name ?? '—'}</span>
    )},
    { key: 'price', label: 'Price', hideOnMobile: true, render: (r: any) => (
      <span className="font-display text-[var(--admin-accent)]">₦{(r.price ?? 0).toLocaleString()}</span>
    )},
    { key: 'stock', label: 'Stock', render: (r: any) => <AdminStockBadge stock={Number(r.stock ?? 0)} /> },
    { key: 'status', label: 'Status', hideOnMobile: true, render: (r: any) => (
      <AdminBadge tone={r.isActive ? 'success' : 'muted'}>{r.isActive ? 'Active' : 'Draft'}</AdminBadge>
    )},
    { key: 'actions', label: '', width: '100px', render: (r: any) => (
      <div className="flex gap-1">
        <Link href={`/admin/products/${r._id}/edit`} className="admin-btn admin-btn-ghost !min-h-[36px] !px-2" aria-label="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </Link>
        <button type="button" onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: r._id, name: r.name }); }} className="admin-btn admin-btn-ghost !min-h-[36px] !px-2 hover:!text-[var(--admin-error)]" aria-label="Delete">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <AdminPageHeader
        title="Products"
        action={<AdminButton href="/admin/products/new" className="hidden lg:inline-flex">Add Product</AdminButton>}
      />

      <div className="space-y-3 mb-4">
        <AdminInput type="search" placeholder="Search products..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <div className="grid grid-cols-2 gap-3">
          <AdminSelect value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </AdminSelect>
          <AdminSelect value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
          </AdminSelect>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="admin-card admin-card-padded flex flex-wrap items-center gap-2 mb-4 !py-3">
          <span className="text-sm text-[var(--admin-text-muted)]">{selected.size} selected</span>
          <AdminButton variant="success" onClick={() => runBulkAction('activate')} disabled={bulkLoading}>Activate</AdminButton>
          <AdminButton variant="warning" onClick={() => runBulkAction('deactivate')} disabled={bulkLoading}>Deactivate</AdminButton>
          <AdminButton variant="danger" onClick={() => setBulkModal('delete')} disabled={bulkLoading}>Delete</AdminButton>
          <AdminButton variant="ghost" onClick={() => setSelected(new Set())}>Clear</AdminButton>
        </div>
      )}

      <AdminPanel>
        <AdminTable
          columns={columns}
          data={products}
          loading={loading}
          emptyMessage="No products found"
          mobileCardRender={(r, i) => (
            <AdminMobileCard index={i}>
              <Link href={`/admin/products/${r._id}/edit`} className="flex items-center gap-3 rounded-lg -m-1 p-1">
                {r.images?.[0] ? (
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={r.images[0]} alt="" width={48} height={48} className="w-full h-full object-cover" />
                  </div>
                ) : <div className="w-12 h-12 rounded-xl bg-[var(--admin-surface-3)]" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.name}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <AdminStockBadge stock={Number(r.stock ?? 0)} />
                    <AdminBadge tone={r.isActive ? 'success' : 'muted'}>{r.isActive ? 'Active' : 'Draft'}</AdminBadge>
                    <span className="font-display text-sm text-[var(--admin-accent)]">₦{(r.price ?? 0).toLocaleString()}</span>
                  </div>
                </div>
              </Link>
              <div className="flex gap-2 mt-3 pt-3 border-t border-[var(--admin-border)]">
                <AdminButton variant="secondary" href={`/admin/products/${r._id}/edit`} className="flex-1 !min-h-[44px]">
                  Edit
                </AdminButton>
                <AdminButton
                  variant="danger"
                  onClick={() => setDeleteTarget({ id: r._id, name: r.name })}
                  className="flex-1 !min-h-[44px]"
                >
                  Delete
                </AdminButton>
              </div>
            </AdminMobileCard>
          )}
        />
      </AdminPanel>

      <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
      <AdminFab href="/admin/products/new" label="Add Product" />

      <Modal open={bulkModal === 'delete'} onClose={() => setBulkModal(null)} title="Confirm Delete" variant="dark">
        <p className="text-[var(--admin-text-muted)] mb-4">Delete {selected.size} product(s)? This cannot be undone.</p>
        <AdminModalActions>
          <AdminButton variant="danger" onClick={() => runBulkAction('delete')} disabled={bulkLoading}>Delete</AdminButton>
          <AdminButton variant="secondary" onClick={() => setBulkModal(null)}>Cancel</AdminButton>
        </AdminModalActions>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Product" variant="dark">
        <p className="text-[var(--admin-text-muted)] mb-4">
          Delete <span className="font-semibold text-[var(--admin-text)]">{deleteTarget?.name}</span>? This cannot be undone.
        </p>
        <AdminModalActions>
          <AdminButton
            variant="danger"
            onClick={() => deleteTarget && deleteProduct(deleteTarget.id)}
            disabled={deleteLoading}
          >
            {deleteLoading ? 'Deleting...' : 'Delete'}
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</AdminButton>
        </AdminModalActions>
      </Modal>
    </div>
  );
}
