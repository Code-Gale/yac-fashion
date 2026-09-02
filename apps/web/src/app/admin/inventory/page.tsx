'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AdminTable, AdminMobileCard } from '@/components/admin/AdminTable';
import { useToast } from '@/components/ui/ToastContext';
import {
  AdminPageHeader, AdminPanel, AdminFilterTabs, AdminStockBadge,
} from '@/components/admin/ui';

const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export default function AdminInventoryPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => { setFilter(searchParams?.get('filter') || ''); }, [searchParams]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter) params.set('filter', filter);
    try {
      const { data } = await api.get(`/admin/inventory?${params}`);
      const list = data?.data ?? data;
      setProducts(Array.isArray(list) ? list : []);
    } catch (_) {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const saveStock = async (productId: string) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) { toast('Invalid stock', 'error'); return; }
    setSavingId(productId);
    try {
      await api.put(`/admin/inventory/${productId}`, { stock: val });
      toast('Stock updated', 'success');
      setEditingId(null);
      fetchProducts();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const StockEditor = ({ id }: { id: string }) => (
    <div className="flex items-center gap-2 mt-2">
      <input type="number" min="0" value={editValue} onChange={(e) => setEditValue(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') saveStock(id); if (e.key === 'Escape') setEditingId(null); }}
        autoFocus className="admin-input !min-h-[40px] !w-20 !py-1" />
      <button type="button" onClick={() => saveStock(id)} disabled={savingId === id} className="admin-btn admin-btn-success !min-h-[40px] !px-3">Save</button>
      <button type="button" onClick={() => setEditingId(null)} className="admin-btn admin-btn-ghost !min-h-[40px] !px-2 text-[var(--admin-error)]">Cancel</button>
    </div>
  );

  return (
    <div>
      <AdminPageHeader title="Inventory" />
      <AdminFilterTabs tabs={FILTER_TABS} value={filter} onChange={setFilter} />

      <AdminPanel>
        <AdminTable
          columns={[
            { key: 'product', label: 'Product', render: (r) => (
              <div className="flex items-center gap-3">
                {r.images?.[0] ? (
                  <div className="w-8 h-8 rounded-lg overflow-hidden bg-[var(--admin-surface-2)]">
                    <Image src={r.images[0]} alt="" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                ) : <div className="w-8 h-8 rounded-lg bg-[var(--admin-surface-2)]" />}
                <span className="truncate max-w-[180px]">{r.name}</span>
              </div>
            )},
            { key: 'sku', label: 'SKU', hideOnMobile: true, render: (r) => <span className="font-mono text-sm text-[var(--admin-text-muted)]">{r.sku || '—'}</span> },
            { key: 'stock', label: 'Stock', render: (r) => (
              editingId === r._id ? <StockEditor id={r._id} /> : (
                <button type="button" onClick={() => { setEditingId(r._id); setEditValue(String(r.stock ?? 0)); }} className="admin-btn admin-btn-ghost !min-h-[36px] !px-2">
                  <AdminStockBadge stock={Number(r.stock ?? 0)} />
                </button>
              )
            )},
          ]}
          data={products}
          loading={loading}
          emptyMessage="No products"
          mobileCardRender={(r, i) => (
            <AdminMobileCard index={i}>
              <div className="flex items-center gap-3">
                {r.images?.[0] ? (
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                    <Image src={r.images[0]} alt="" width={40} height={40} className="w-full h-full object-cover" />
                  </div>
                ) : <div className="w-10 h-10 rounded-xl bg-[var(--admin-surface-3)]" />}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{r.name}</p>
                  {editingId === r._id ? <StockEditor id={r._id} /> : (
                    <button type="button" onClick={() => { setEditingId(r._id); setEditValue(String(r.stock ?? 0)); }} className="mt-1">
                      <AdminStockBadge stock={Number(r.stock ?? 0)} />
                    </button>
                  )}
                </div>
              </div>
            </AdminMobileCard>
          )}
        />
      </AdminPanel>
    </div>
  );
}
