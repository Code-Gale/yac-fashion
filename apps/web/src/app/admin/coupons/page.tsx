'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { AdminTable, AdminMobileCard } from '@/components/admin/AdminTable';
import {
  AdminPageHeader, AdminButton, AdminPanel, AdminField, AdminInput, AdminSelect,
  AdminBadge, AdminFab, AdminModalActions, AdminToggle,
} from '@/components/admin/ui';

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

  const handleDelete = (id: string) => {
    api.delete(`/admin/coupons/${id}`).then(() => { toast('Deleted'); fetchCoupons(); }).catch(() => toast('Failed', 'error'));
  };

  const expiryTone = (expiresAt: string | null): 'error' | 'warning' | 'muted' => {
    if (!expiresAt) return 'muted';
    const d = new Date(expiresAt);
    if (d < new Date()) return 'error';
    const daysLeft = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (daysLeft < 7) return 'warning';
    return 'muted';
  };

  const columns = [
    { key: 'code', label: 'Code', render: (r: any) => (
      <button type="button" onClick={() => copyCode(r.code)} className="font-mono text-[var(--admin-accent)] hover:underline">{r.code}</button>
    )},
    { key: 'type', label: 'Type', render: (r: any) => (
      <AdminBadge tone={r.type === 'percent' ? 'info' : 'accent'}>{r.type}</AdminBadge>
    )},
    { key: 'value', label: 'Value', render: (r: any) => (
      <span className="font-medium">{r.type === 'percent' ? `${r.value}%` : `₦${(r.value ?? 0).toLocaleString()}`}</span>
    )},
    { key: 'minOrder', label: 'Min Order', hideOnMobile: true, render: (r: any) => (
      <span>{r.minOrderAmount ? `₦${(r.minOrderAmount ?? 0).toLocaleString()}` : '—'}</span>
    )},
    { key: 'usage', label: 'Usage', render: (r: any) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-[var(--admin-border)] rounded-full overflow-hidden">
          <div className="h-full bg-[var(--admin-accent)] rounded-full" style={{ width: `${r.usageLimit ? Math.min(100, ((r.usedCount ?? 0) / r.usageLimit) * 100) : 0}%` }} />
        </div>
        <span className="text-xs text-[var(--admin-text-muted)]">{r.usedCount ?? 0}/{r.usageLimit ?? '∞'}</span>
      </div>
    )},
    { key: 'expiry', label: 'Expiry', hideOnMobile: true, render: (r: any) => (
      <AdminBadge tone={expiryTone(r.expiresAt)}>{r.expiresAt ? new Date(r.expiresAt).toLocaleDateString() : '—'}</AdminBadge>
    )},
    { key: 'status', label: 'Status', render: (r: any) => (
      <AdminBadge tone={r.isActive !== false ? 'success' : 'muted'}>{r.isActive !== false ? 'Active' : 'Inactive'}</AdminBadge>
    )},
    { key: 'actions', label: '', width: '100px', render: (r: any) => (
      <div className="flex gap-1">
        <AdminButton variant="ghost" onClick={() => openEdit(r)} className="!min-h-[36px] !px-2">Edit</AdminButton>
        <AdminButton variant="ghost" onClick={() => handleDelete(r._id)} className="!min-h-[36px] !px-2 hover:!text-[var(--admin-error)]">Delete</AdminButton>
      </div>
    )},
  ];

  return (
    <div>
      <AdminPageHeader
        title="Coupons"
        action={<AdminButton onClick={openAdd} className="hidden lg:inline-flex">Add Coupon</AdminButton>}
      />

      <AdminPanel>
        <AdminTable
          columns={columns}
          data={coupons}
          loading={loading}
          emptyMessage="No coupons"
          mobileCardRender={(r, i) => (
            <AdminMobileCard onClick={() => openEdit(r)} index={i}>
              <div className="flex items-start justify-between gap-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); copyCode(r.code); }} className="font-mono font-semibold text-[var(--admin-accent)]">{r.code}</button>
                <AdminBadge tone={r.isActive !== false ? 'success' : 'muted'}>{r.isActive !== false ? 'Active' : 'Inactive'}</AdminBadge>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <AdminBadge tone={r.type === 'percent' ? 'info' : 'accent'}>{r.type}</AdminBadge>
                <span className="font-medium">{r.type === 'percent' ? `${r.value}%` : `₦${(r.value ?? 0).toLocaleString()}`}</span>
              </div>
              <div className="flex items-center justify-between mt-2 text-sm text-[var(--admin-text-muted)]">
                <span>{r.usedCount ?? 0}/{r.usageLimit ?? '∞'} used</span>
                {r.expiresAt && <AdminBadge tone={expiryTone(r.expiresAt)}>{new Date(r.expiresAt).toLocaleDateString()}</AdminBadge>}
              </div>
            </AdminMobileCard>
          )}
        />
      </AdminPanel>

      <AdminFab onClick={openAdd} label="Add Coupon" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Coupon' : 'Add Coupon'} variant="dark">
        <div className="space-y-4">
          <AdminField label="Code" required>
            <AdminInput type="text" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} required className="font-mono" placeholder="SUMMER20" />
          </AdminField>
          <AdminField label="Type">
            <AdminSelect value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="percent">Percent</option>
              <option value="flat">Flat</option>
            </AdminSelect>
          </AdminField>
          <AdminField label="Value" required>
            <AdminInput type="number" min="0" step="0.01" value={form.value} onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))} required placeholder={form.type === 'percent' ? '%' : '₦'} />
          </AdminField>
          <AdminField label="Min Order (₦)">
            <AdminInput type="number" min="0" value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
          </AdminField>
          <AdminField label="Usage Limit">
            <AdminInput type="number" min="0" value={form.usageLimit} onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))} />
          </AdminField>
          <AdminField label="Expires At">
            <AdminInput type="date" value={form.expiresAt} onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))} />
          </AdminField>
          <AdminToggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active" />
          <AdminModalActions>
            <AdminButton onClick={handleSave} disabled={saving}>Save</AdminButton>
            <AdminButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AdminButton>
          </AdminModalActions>
        </div>
      </Modal>
    </div>
  );
}
