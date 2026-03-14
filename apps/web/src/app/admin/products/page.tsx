'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AdminTable } from '@/components/admin/AdminTable';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';

export default function AdminProductsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('limit', '20');
    if (search) params.set('search', search);
    if (categoryFilter) params.set('category', categoryFilter);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const { data } = await api.get(`/admin/products?${params}`);
      const payload = data?.data ?? data;
      setProducts(payload?.products ?? []);
      setTotal(payload?.total ?? 0);
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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p._id)));
  };

  const runBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      if (action === 'delete') {
        for (const id of Array.from(selected)) {
          await api.delete(`/admin/products/${id}`);
        }
        toast('Products deleted', 'success');
      } else {
        for (const id of Array.from(selected)) {
          await api.put(`/admin/products/${id}`, { isActive: action === 'activate' });
        }
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
      <input type="checkbox" checked={selected.has(r._id)} onChange={() => toggleSelect(r._id)} className="rounded" />
    )},
    { key: 'image', label: '', width: '50px', render: (r: any) => (
      r.images?.[0] ? (
        <div className="w-10 h-10 rounded overflow-hidden bg-[#222634] flex-shrink-0">
          <Image src={r.images[0]} alt="" width={40} height={40} className="w-full h-full object-cover" />
        </div>
      ) : <div className="w-10 h-10 rounded bg-[#222634]" />
    )},
    { key: 'name', label: 'Product', render: (r: any) => (
      <div>
        <p className="font-medium text-[#f0f0f0]">{r.name}</p>
        <p className="text-xs text-[#8b92a5]">{r.slug}</p>
      </div>
    )},
    { key: 'category', label: 'Category', hideOnMobile: true, render: (r: any) => (
      <span className="text-[#8b92a5]">{r.category?.name ?? '—'}</span>
    )},
    { key: 'price', label: 'Price', hideOnMobile: true, render: (r: any) => (
      <span className="font-display text-[#c9a84c]">₦{(r.price ?? 0).toLocaleString()}</span>
    )},
    { key: 'compareAtPrice', label: 'Compare', hideOnMobile: true, render: (r: any) => (
      <span className="text-[#8b92a5]">{r.compareAtPrice ? `₦${r.compareAtPrice.toLocaleString()}` : '—'}</span>
    )},
    { key: 'stock', label: 'Stock', render: (r: any) => {
      const s = Number(r.stock ?? 0);
      return (
        <span className={cn(
          'text-xs px-2 py-0.5 rounded-full',
          s === 0 && 'bg-[#ef4444]/20 text-[#ef4444]',
          s > 0 && s <= 10 && 'bg-[#f59e0b]/20 text-[#f59e0b]',
          s > 10 && 'bg-[#22c55e]/20 text-[#22c55e]'
        )}>{s}</span>
      );
    }},
    { key: 'status', label: 'Status', hideOnMobile: true, render: (r: any) => (
      <span className={cn('text-xs px-2 py-0.5 rounded-full', r.isActive ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#8b92a5]/20 text-[#8b92a5]')}>
        {r.isActive ? 'Active' : 'Draft'}
      </span>
    )},
    { key: 'actions', label: '', width: '100px', render: (r: any) => (
      <div className="flex gap-2">
        <Link href={`/admin/products/${r._id}/edit`} className="p-2 rounded hover:bg-white/5 text-[#8b92a5] hover:text-[#f0f0f0]" aria-label="Edit">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
        </Link>
        <button type="button" onClick={(e) => { e.stopPropagation(); api.delete(`/admin/products/${r._id}`).then(() => { toast('Deleted'); fetchProducts(); }).catch(() => toast('Failed', 'error')); }} className="p-2 rounded hover:bg-[#ef4444]/20 text-[#8b92a5] hover:text-[#ef4444]" aria-label="Delete">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl text-[#f0f0f0]">Products</h1>
        <Link href="/admin/products/new" className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg hover:bg-[#c9a84c]/90">
          Add Product
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 mb-6 overflow-x-auto scrollbar-hide">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full lg:w-[280px] min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0] placeholder:text-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="min-h-[44px] px-4 py-2 bg-[#1a1d26] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {selected.size > 0 && (
        <div className="flex items-center gap-4 py-3 px-4 bg-[#1a1d26] rounded-lg border border-white/10 mb-6">
          <span className="text-sm text-[#8b92a5]">{selected.size} selected</span>
          <button type="button" onClick={() => runBulkAction('activate')} className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#22c55e] hover:bg-[#22c55e]/20 rounded" disabled={bulkLoading}>Activate</button>
          <button type="button" onClick={() => runBulkAction('deactivate')} className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#f59e0b] hover:bg-[#f59e0b]/20 rounded" disabled={bulkLoading}>Deactivate</button>
          <button type="button" onClick={() => setBulkModal('delete')} className="min-h-[44px] px-3 py-2 text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/20 rounded" disabled={bulkLoading}>Delete</button>
          <button type="button" onClick={() => setSelected(new Set())} className="min-h-[44px] px-3 py-2 text-sm text-[#8b92a5] hover:bg-white/5 rounded">Clear</button>
        </div>
      )}

      <div className="bg-[#1a1d26] border border-white/10 rounded-xl overflow-hidden">
        <AdminTable
          columns={columns}
          data={products}
          loading={loading}
          emptyMessage="No products found"
          mobileCardRender={(r) => (
            <Link href={`/admin/products/${r._id}/edit`} className="block bg-[#222634] rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                {r.images?.[0] ? (
                  <div className="w-10 h-10 rounded overflow-hidden flex-shrink-0">
                    <Image src={r.images[0]} alt="" width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                ) : <div className="w-10 h-10 rounded bg-[#222634]" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#f0f0f0] truncate">{r.name}</p>
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', Number(r.stock ?? 0) === 0 ? 'bg-[#ef4444]/20 text-[#ef4444]' : 'bg-[#22c55e]/20 text-[#22c55e]')}>{r.stock}</span>
                </div>
                <div className="flex gap-2">
                  <Link href={`/admin/products/${r._id}/edit`} className="p-2 rounded hover:bg-white/5">Edit</Link>
                </div>
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

      <Modal open={bulkModal === 'delete'} onClose={() => setBulkModal(null)} title="Confirm Delete" variant="dark">
        <p className="text-[#8b92a5] mb-6">Delete {selected.size} product(s)? This cannot be undone.</p>
        <div className="flex gap-3">
          <button type="button" onClick={() => runBulkAction('delete')} disabled={bulkLoading} className="min-h-[44px] px-4 py-2 bg-[#ef4444] text-white rounded-lg disabled:opacity-50">Delete</button>
          <button type="button" onClick={() => setBulkModal(null)} className="min-h-[44px] px-4 py-2 border border-white/10 rounded-lg">Cancel</button>
        </div>
      </Modal>
    </div>
  );
}
