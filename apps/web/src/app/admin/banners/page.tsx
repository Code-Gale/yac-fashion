'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';

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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-[#f0f0f0]">Banners</h1>
        <button type="button" onClick={openAdd} className="min-h-[44px] px-4 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg hover:bg-[#c9a84c]/90">Add Banner</button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="bg-[#1a1d26] border border-white/10 rounded-xl p-4 h-24 animate-pulse" />)}
        </div>
      ) : (
        <div className="bg-[#1a1d26] border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-xs font-medium text-[#8b92a5] uppercase">Image</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#8b92a5] uppercase">Title</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#8b92a5] uppercase hidden lg:table-cell">Position</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#8b92a5] uppercase hidden lg:table-cell">Date Range</th>
                <th className="text-left py-3 px-4 text-xs font-medium text-[#8b92a5] uppercase">Status</th>
                <th className="text-right py-3 px-4 text-xs font-medium text-[#8b92a5] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {banners.map((b) => (
                <tr key={b._id} className="border-b border-white/10 hover:bg-white/5">
                  <td className="py-3 px-4">
                    <div className="w-16 h-10 rounded overflow-hidden bg-[#222634] flex-shrink-0">
                      {b.imageUrl ? <Image src={b.imageUrl} alt="" width={60} height={40} className="w-full h-full object-cover" /> : null}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-[#f0f0f0]">{b.title || '—'}</p>
                    {b.subtitle && <p className="text-xs text-[#8b92a5]">{b.subtitle}</p>}
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#222634] text-[#8b92a5]">{b.position || 'hero'}</span>
                  </td>
                  <td className="py-3 px-4 hidden lg:table-cell text-sm text-[#8b92a5]">
                    {b.startDate ? new Date(b.startDate).toLocaleDateString() : '—'} – {b.endDate ? new Date(b.endDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <button type="button" onClick={() => toggleActive(b)} className={cn('relative w-14 h-8 rounded-full transition-colors min-w-[56px]', b.isActive !== false ? 'bg-[#c9a84c]' : 'bg-[#222634]')}>
                      <span className={cn('absolute top-1 w-6 h-6 rounded-full bg-white transition-transform', b.isActive !== false ? 'left-7' : 'left-1')} />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button type="button" onClick={() => openEdit(b)} className="min-h-[44px] px-3 py-2 text-[#c9a84c] hover:bg-[#c9a84c]/20 rounded">Edit</button>
                    <button type="button" onClick={() => api.delete(`/admin/banners/${b._id}`).then(() => { toast('Deleted'); fetchBanners(); }).catch(() => toast('Failed', 'error'))} className="min-h-[44px] px-3 py-2 text-[#ef4444] hover:bg-[#ef4444]/20 rounded ml-2">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {banners.length === 0 && <div className="py-12 text-center text-[#8b92a5]">No banners</div>}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Banner' : 'Add Banner'} variant="dark">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Subtitle</label>
            <input type="text" value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Image *</label>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="banner-img" />
            <label htmlFor="banner-img" className="block min-h-[120px] border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-lg p-4 text-center cursor-pointer hover:border-[#c9a84c] text-[#8b92a5]">
              {form.imageUrl ? <Image src={form.imageUrl} alt="" width={300} height={120} className="mx-auto rounded max-h-32 object-cover" /> : uploading ? 'Uploading...' : 'Click to upload'}
            </label>
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">CTA Text</label>
            <input type="text" value={form.ctaText} onChange={(e) => setForm((f) => ({ ...f, ctaText: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">CTA Link</label>
            <input type="text" value={form.ctaLink} onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Position</label>
            <select value={form.position} onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]">
              {POSITIONS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Start Date</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
            </div>
            <div>
              <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">End Date</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
            </div>
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
