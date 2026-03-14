'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';

export default function AdminCategoriesPage() {
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', description: '', image: '' });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/admin/categories');
      const list = data?.data ?? data;
      setCategories(Array.isArray(list) ? list : []);
    } catch (_) {
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', description: '', image: '' });
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name ?? '', description: c.description ?? '', image: c.image ?? '' });
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
      if (url) setForm((f) => ({ ...f, image: url }));
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Name is required', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/admin/categories/${editing._id}`, { ...form, image: form.image || undefined });
        toast('Category updated', 'success');
      } else {
        await api.post('/admin/categories', { ...form, image: form.image || undefined });
        toast('Category created', 'success');
      }
      fetchCategories();
      setModalOpen(false);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/categories/${id}`);
      toast('Category deleted', 'success');
      fetchCategories();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl text-[#f0f0f0] mb-6">Categories</h1>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-[#1a1d26] border border-white/10 rounded-xl aspect-[3/2] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <div key={c._id} className="bg-[#1a1d26] border border-white/10 rounded-xl overflow-hidden">
              <div className="aspect-[3/2] relative bg-[#222634]">
                {c.image ? (
                  <Image src={c.image} alt="" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[#8b92a5]">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[#f0f0f0]">{c.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[#222634] text-[#8b92a5]">{c.productCount ?? 0} products</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button type="button" onClick={() => openEdit(c)} className="min-h-[44px] px-3 py-2 text-sm text-[#c9a84c] hover:bg-[#c9a84c]/20 rounded">Edit</button>
                  <button type="button" onClick={() => handleDelete(c._id)} className="min-h-[44px] px-3 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/20 rounded">Delete</button>
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={openAdd} className="min-h-[120px] aspect-[3/2] border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#c9a84c] hover:bg-[#c9a84c]/5 transition-colors">
            <svg className="w-12 h-12 text-[#8b92a5]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <span className="text-sm text-[#8b92a5]">Add Category</span>
          </button>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} variant="dark">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Name *</label>
            <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Image</label>
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="cat-img" />
            <label htmlFor="cat-img" className="block min-h-[100px] border-2 border-dashed border-[rgba(255,255,255,0.08)] rounded-lg p-4 text-center cursor-pointer hover:border-[#c9a84c] text-[#8b92a5]">
              {form.image ? <Image src={form.image} alt="" width={200} height={100} className="mx-auto rounded" /> : uploading ? 'Uploading...' : 'Click to upload'}
            </label>
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
