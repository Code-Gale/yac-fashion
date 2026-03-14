'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { AdminTable } from '@/components/admin/AdminTable';
import { cn } from '@/lib/utils';

export default function AdminCouponsPage() {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    code: '',
    type: 'percent',
    value: '',
    minOrderAmount: '',
    usageLimit: '',
    expiresAt: '',
    isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchCoupons = async () => {
    try {
      const { data } = await api.get('/admin/coupons');
      const list = data?.data ?? data;
      setCoupons(Array.isArray(list) ? list : []);
    } catch (_) {
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ code: '', type: 'percent', value: '', minOrderAmount: '', usageLimit: '', expiresAt: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({
      code: c.code ?? '',
      type: c.type ?? 'percent',
      value: String(c.value ?? ''),
      minOrderAmount: c.minOrderAmount ? String(c.minOrderAmount) : '',
      usageLimit: c.usageLimit != null ? String(c.usageLimit) : '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive !== false,
    });
    setModalOpen(true);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast('Copied', 'success');
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast('Code is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        isActive: form.isActive,
      };
      if (form.minOrderAmount) payload.minOrderAmount = parseFloat(form.minOrderAmount);
      if (form.usageLimit) payload.usageLimit = parseInt(form.usageLimit, 10);
      if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
      if (editing) {
        await api.put(`/admin/coupons/${editing._id}`, payload);
        toast('Coupon updated', 'success');
      } else {
        await api.post('/admin/coupons', payload);
        toast('Coupon created', 'success');
      }
      fetchCoupons();
      setModalOpen(false);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const expiryColor = (expiresAt: string | null) => {
    if (!expiresAt) return 'text-[#f0f0f0]';
    const d = new Date(expiresAt);
    if (d < new Date()) return 'text-[#ef4444]';
    const daysLeft = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 7) return 'text-[#f59e0b]';
    return 'text-[#f0f0f0]';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-[#f0f0f0]">Coupons</h1>
        <button type="button" onClick={openAdd} className="min-h-[44px] px-4 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg hover:bg-[#c9a84c]/90">Add Coupon</button>
      </div>

      <div className="bg-[#1a1d26] border border-white/10 rounded-xl overflow-hidden">
        <AdminTable
          columns={[
            { key: 'code', label: 'Code', render: (r) => (
              <button type="button" onClick={() => copyCode(r.code)} className="font-mono text-[#c9a84c] hover:underline">{r.code}</button>
            )},
            { key: 'type', label: 'Type', render: (r) => <span className={cn('text-xs px-2 py-0.5 rounded-full', r.type === 'percent' ? 'bg-[#7c3aed]/20 text-[#a78bfa]' : 'bg-[#0891b2]/20 text-[#67e8f9]')}>{r.type}</span> },
            { key: 'value', label: 'Value', render: (r) => <span className="text-[#f0f0f0] font-medium">{r.type === 'percent' ? `${r.value}%` : `₦${(r.value ?? 0).toLocaleString()}`}</span> },
            { key: 'minOrder', label: 'Min Order', hideOnMobile: true, render: (r) => <span className="text-[#f0f0f0]">{r.minOrderAmount ? `₦${(r.minOrderAmount ?? 0).toLocaleString()}` : '—'}</span> },
            { key: 'usage', label: 'Usage', render: (r) => (
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[rgba(255,255,255,0.1)] rounded-full overflow-hidden">
                  <div className="h-full bg-[#c9a84c] rounded-full" style={{ width: `${r.usageLimit ? Math.min(100, ((r.usedCount ?? 0) / r.usageLimit) * 100) : 0}%` }} />
                </div>
                <span className="text-xs text-[#8b92a5] ml-2">{r.usedCount ?? 0}/{r.usageLimit ?? '∞'}</span>
              </div>
            )},
            { key: 'expiry', label: 'Expiry', hideOnMobile: true, render: (r) => <span className={expiryColor(r.expiresAt)}>{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—'}</span> },
            { key: 'status', label: 'Status', render: (r) => <span className={cn('text-xs px-2 py-0.5 rounded-full', r.isActive !== false ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#8b92a5]/20 text-[#8b92a5]')}>{r.isActive !== false ? 'Active' : 'Inactive'}</span> },
            { key: 'actions', label: '', width: '100px', render: (r) => (
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(r)} className="p-2 rounded hover:bg-white/5 text-[#8b92a5] hover:text-[#f0f0f0]">Edit</button>
                <button type="button" onClick={() => api.delete(`/admin/coupons/${r._id}`).then(() => { toast('Deleted'); fetchCoupons(); }).catch(() => toast('Failed', 'error'))} className="p-2 rounded hover:bg-[#ef4444]/20 text-[#8b92a5] hover:text-[#ef4444]">Delete</button>
              </div>
            )},
          ]}
          data={coupons}
          loading={loading}
          emptyMessage="No coupons"
        />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'} variant="dark">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Code *</label>
            <input type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] font-mono placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" placeholder="SUMMER20" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]">
              <option value="percent">Percent</option>
              <option value="flat">Flat</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Value *</label>
            <input type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} required className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" placeholder={form.type === 'percent' ? '%' : '₦'} />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Min Order (₦)</label>
            <input type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Usage Limit</label>
            <input type="number" min="0" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Expires At</label>
            <input type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div className="flex items-center gap-3">
            <button type="button" role="switch" aria-checked={form.isActive} onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} className={cn('relative w-14 h-8 rounded-full transition-colors', form.isActive ? 'bg-[#c9a84c]' : 'bg-[#222634]')}>
              <span className={cn('absolute top-1 w-6 h-6 rounded-full bg-white transition-transform', form.isActive ? 'left-7' : 'left-1')} />
            </button>
            <span className="text-sm text-[#f0f0f0]">Active</span>
          </div>
          <div className="flex gap-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
            <button type="button" onClick={handleSave} disabled={saving} className="min-h-[44px] px-4 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg disabled:opacity-50">Save</button>
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-[44px] px-4 py-2 border border-[rgba(255,255,255,0.08)] rounded-lg text-[#8b92a5] hover:text-[#f0f0f0]">Cancel</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
