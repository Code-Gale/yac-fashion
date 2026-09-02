'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import {
  AdminPageHeader, AdminButton, AdminPanel, AdminField, AdminInput, AdminSelect,
  AdminBadge, AdminFab, AdminModalActions, AdminToggle, AdminLoading,
} from '@/components/admin/ui';
import { AdminMobileCard } from '@/components/admin/AdminTable';

const POSITIONS = [
  { value: 'hero', label: 'Hero' },
  { value: 'category', label: 'Category' },
  { value: 'sidebar', label: 'Sidebar' },
];

export default function AdminBannersPage() {
  const { toast } = useToast();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    ctaText: '',
    ctaLink: '',
    position: 'hero',
    startDate: '',
    endDate: '',
    isActive: true,
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchBanners = async () => {
    try {
      const { data } = await api.get('/admin/banners');
      const list = data?.data ?? data;
      setBanners(Array.isArray(list) ? list : []);
    } catch (_) {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: '', subtitle: '', imageUrl: '', ctaText: '', ctaLink: '', position: 'hero', startDate: '', endDate: '', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title: b.title ?? '',
      subtitle: b.subtitle ?? '',
      imageUrl: b.imageUrl ?? '',
      ctaText: b.ctaText ?? '',
      ctaLink: b.ctaLink ?? '',
      position: b.position ?? 'hero',
      startDate: b.startDate ? b.startDate.slice(0, 10) : '',
      endDate: b.endDate ? b.endDate.slice(0, 10) : '',
      isActive: b.isActive !== false,
    });
    setModalOpen(true);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.size > 5 * 1024 * 1024) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('images', file);
      const { data } = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const urls = data?.data ?? data;
      const url = Array.isArray(urls) ? urls[0] : urls;
      if (url) setForm((f) => ({ ...f, imageUrl: url }));
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.imageUrl.trim()) {
      toast('Image is required', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload: any = { ...form, imageUrl: form.imageUrl };
      if (form.startDate) payload.startDate = new Date(form.startDate).toISOString();
      if (form.endDate) payload.endDate = new Date(form.endDate).toISOString();
      if (editing) {
        await api.put(`/admin/banners/${editing._id}`, payload);
        toast('Banner updated', 'success');
      } else {
        await api.post('/admin/banners', payload);
        toast('Banner created', 'success');
      }
      fetchBanners();
      setModalOpen(false);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (b: any) => {
    try {
      await api.put(`/admin/banners/${b._id}`, { isActive: !b.isActive });
      toast(b.isActive ? 'Banner deactivated' : 'Banner activated', 'success');
      fetchBanners();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    }
  };

  const handleDelete = (id: string) => {
    api.delete(`/admin/banners/${id}`).then(() => { toast('Deleted'); fetchBanners(); }).catch(() => toast('Failed', 'error'));
  };

  return (
    <div>
      <AdminPageHeader
        title="Banners"
        action={<AdminButton onClick={openAdd} className="hidden lg:inline-flex">Add Banner</AdminButton>}
      />

      {loading ? (
        <AdminLoading />
      ) : banners.length === 0 ? (
        <AdminPanel>
          <div className="py-14 px-4 text-center">
            <p className="text-[var(--admin-text-muted)] text-sm">No banners</p>
          </div>
        </AdminPanel>
      ) : (
        <>
          <div className="lg:hidden space-y-3">
            {banners.map((b, i) => (
              <AdminMobileCard key={b._id} index={i}>
                <div className="flex gap-3">
                  <div className="w-16 h-10 rounded-lg overflow-hidden bg-[var(--admin-surface-3)] flex-shrink-0">
                    {b.imageUrl ? <Image src={b.imageUrl} alt="" width={64} height={40} className="w-full h-full object-cover" /> : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{b.title || '—'}</p>
                    {b.subtitle && <p className="text-xs text-[var(--admin-text-muted)] truncate">{b.subtitle}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <AdminBadge tone="muted">{b.position || 'hero'}</AdminBadge>
                      <AdminBadge tone={b.isActive !== false ? 'success' : 'muted'}>{b.isActive !== false ? 'Active' : 'Inactive'}</AdminBadge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--admin-border)]">
                  <AdminToggle checked={b.isActive !== false} onChange={() => toggleActive(b)} label="Active" />
                  <div className="flex gap-1">
                    <AdminButton variant="ghost" onClick={() => openEdit(b)} className="!min-h-[36px] !px-2">Edit</AdminButton>
                    <AdminButton variant="ghost" onClick={() => handleDelete(b._id)} className="!min-h-[36px] !px-2 hover:!text-[var(--admin-error)]">Delete</AdminButton>
                  </div>
                </div>
              </AdminMobileCard>
            ))}
          </div>

          <AdminPanel className="hidden lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--admin-border)]">
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">Image</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">Title</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">Position</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">Date Range</th>
                  <th className="text-left py-3 px-4 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">Status</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {banners.map((b) => (
                  <tr key={b._id} className="border-b border-[var(--admin-border)] hover:bg-white/[0.03]">
                    <td className="py-3 px-4">
                      <div className="w-16 h-10 rounded overflow-hidden bg-[var(--admin-surface-3)] flex-shrink-0">
                        {b.imageUrl ? <Image src={b.imageUrl} alt="" width={60} height={40} className="w-full h-full object-cover" /> : null}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium">{b.title || '—'}</p>
                      {b.subtitle && <p className="text-xs text-[var(--admin-text-muted)]">{b.subtitle}</p>}
                    </td>
                    <td className="py-3 px-4">
                      <AdminBadge tone="muted">{b.position || 'hero'}</AdminBadge>
                    </td>
                    <td className="py-3 px-4 text-sm text-[var(--admin-text-muted)]">
                      {b.startDate ? new Date(b.startDate).toLocaleDateString() : '—'} – {b.endDate ? new Date(b.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <AdminToggle checked={b.isActive !== false} onChange={() => toggleActive(b)} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <AdminButton variant="ghost" onClick={() => openEdit(b)} className="!min-h-[36px] !px-2">Edit</AdminButton>
                      <AdminButton variant="ghost" onClick={() => handleDelete(b._id)} className="!min-h-[36px] !px-2 hover:!text-[var(--admin-error)]">Delete</AdminButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </AdminPanel>
        </>
      )}

      <AdminFab onClick={openAdd} label="Add Banner" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Banner' : 'Add Banner'} variant="dark">
        <div className="space-y-4">
          <AdminField label="Title">
            <AdminInput type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
          </AdminField>
          <AdminField label="Subtitle">
            <AdminInput type="text" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} />
          </AdminField>
          <AdminField label="Image" required>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="banner-img" />
            <label htmlFor="banner-img" className="block min-h-[120px] border-2 border-dashed border-[var(--admin-border)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--admin-accent)] text-[var(--admin-text-muted)]">
              {form.imageUrl ? <Image src={form.imageUrl} alt="" width={300} height={120} className="mx-auto rounded max-h-32 object-cover" /> : uploading ? 'Uploading...' : 'Click to upload'}
            </label>
          </AdminField>
          <AdminField label="CTA Text">
            <AdminInput type="text" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} />
          </AdminField>
          <AdminField label="CTA Link">
            <AdminInput type="text" value={form.ctaLink} onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))} />
          </AdminField>
          <AdminField label="Position">
            <AdminSelect value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}>
              {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </AdminSelect>
          </AdminField>
          <div className="grid grid-cols-2 gap-4">
            <AdminField label="Start Date">
              <AdminInput type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </AdminField>
            <AdminField label="End Date">
              <AdminInput type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </AdminField>
          </div>
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
