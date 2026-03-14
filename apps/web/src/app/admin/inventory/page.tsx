'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { AdminTable } from '@/components/admin/AdminTable';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';

const FILTER_TABS = [
  { value: '', label: 'All' },
  { value: 'low_stock', label: 'Low Stock (≤10)' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export default function AdminInventoryPage() {
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  useEffect(() => {
    setFilter(searchParams?.get('filter') || '');
  }, [searchParams]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const startEdit = (p: any) => {
    setEditingId(p._id);
    setEditValue(String(p.stock ?? 0));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveStock = async (productId: string) => {
    const val = parseInt(editValue, 10);
    if (isNaN(val) || val < 0) {
      toast('Invalid stock', 'error');
      return;
    }
    setSavingId(productId);
    try {
      await api.put(`/admin/inventory/${productId}`, { stock: val });
      toast('Stock updated', 'success');
      setEditingId(null);
      setEditValue('');
      fetchProducts();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === 'Enter') saveStock(productId);
    if (e.key === 'Escape') cancelEdit();
  };

  const stockBadge = (stock: number) => {
    if (stock === 0) return <span className="text-xs px-2 py-0.5 rounded-full bg-[#ef4444]/20 text-[#ef4444]">Out of Stock</span>;
    if (stock <= 5) return <span className="text-xs px-2 py-0.5 rounded-full bg-[#ef4444]/20 text-[#ef4444]">{stock}</span>;
    if (stock <= 10) return <span className="text-xs px-2 py-0.5 rounded-full bg-[#f59e0b]/20 text-[#f59e0b]">{stock}</span>;
    return <span className="text-xs px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e]">{stock}</span>;
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-[#f0f0f0] mb-6">Inventory</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
        {FILTER_TABS.map((tab) => (
          <button key={tab.value} type="button" onClick={() => setFilter(tab.value)} className={cn('min-h-[44px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap', filter === tab.value ? 'bg-[#c9a84c] text-[#0f1117]' : 'bg-[#1a1d26] border border-white/10 text-[#8b92a5] hover:text-[#f0f0f0]')}>{tab.label}</button>
        ))}
      </div>

      <div className="bg-[#1a1d26] border border-white/10 rounded-xl overflow-hidden">
        <AdminTable
          columns={[
            { key: 'product', label: 'Product', render: (r) => (
              <div className="flex items-center gap-3">
                {r.images?.[0] ? (
                  <div className="w-8 h-8 rounded overflow-hidden bg-[#222634] flex-shrink-0">
                    <Image src={r.images[0]} alt="" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                ) : <div className="w-8 h-8 rounded bg-[#222634]" />}
                <span className="text-[#f0f0f0] truncate max-w-[180px]">{r.name}</span>
              </div>
            )},
            { key: 'sku', label: 'SKU', hideOnMobile: true, render: (r) => <span className="font-mono text-sm text-[#8b92a5]">{r.sku || '—'}</span> },
            { key: 'stock', label: 'Stock', render: (r) => (
              <div className="flex items-center gap-2">
                {editingId === r._id ? (
                  <>
                    <input type="number" min="0" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => handleKeyDown(e, r._id)} onBlur={() => saveStock(r._id)} autoFocus className="w-20 min-h-[44px] px-2 py-1 bg-[#0f1117] border border-[#c9a84c] rounded text-[#f0f0f0] focus:outline-none" />
                    {savingId === r._id ? <span className="animate-spin w-4 h-4 border-2 border-[#c9a84c] border-t-transparent rounded-full" /> : <button type="button" onClick={() => saveStock(r._id)} className="p-1 text-[#22c55e]">✓</button>}
                    <button type="button" onClick={cancelEdit} className="p-1 text-[#ef4444]">×</button>
                  </>
                ) : (
                  <button type="button" onClick={() => startEdit(r)} className="text-left hover:bg-white/5 rounded px-2 py-1 -m-1 min-h-[44px] flex items-center">
                    {stockBadge(Number(r.stock ?? 0))}
                  </button>
                )}
              </div>
            )},
            { key: 'status', label: 'Status', hideOnMobile: true, render: (r) => stockBadge(Number(r.stock ?? 0)) },
          ]}
          data={products}
          loading={loading}
          emptyMessage="No products"
          mobileCardRender={(r) => (
            <div className="bg-[#222634] rounded-lg p-4 border border-white/10">
              <div className="flex items-center gap-3">
                {r.images?.[0] ? (
                  <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                    <Image src={r.images[0]} alt="" width={32} height={32} className="w-full h-full object-cover" />
                  </div>
                ) : <div className="w-8 h-8 rounded bg-[#222634]" />}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#f0f0f0] truncate">{r.name}</p>
                  {editingId === r._id ? (
                    <div className="flex items-center gap-2 mt-2">
                      <input type="number" min="0" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => handleKeyDown(e, r._id)} onBlur={() => saveStock(r._id)} autoFocus className="w-20 min-h-[44px] px-2 py-1 bg-[#0f1117] border border-[#c9a84c] rounded text-[#f0f0f0]" />
                      <button type="button" onClick={() => saveStock(r._id)} disabled={savingId === r._id} className="min-h-[44px] px-2 text-[#22c55e]">Save</button>
                      <button type="button" onClick={cancelEdit} className="min-h-[44px] px-2 text-[#ef4444]">Cancel</button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => startEdit(r)} className="mt-1">{stockBadge(Number(r.stock ?? 0))}</button>
                  )}
                </div>
              </div>
            </div>
          )}
        />
      </div>
    </div>
  );
}
