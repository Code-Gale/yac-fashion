'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import {
  AdminPageHeader, AdminButton, AdminCard, AdminField, AdminInput, AdminTextarea,
  AdminBadge, AdminFab, AdminModalActions,
} from '@/components/admin/ui';

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
      <AdminPageHeader
        title="Categories"
        action={<AdminButton onClick={openAdd} className="hidden lg:inline-flex">Add Category</AdminButton>}
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="admin-skeleton aspect-[3/2] rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c) => (
            <AdminCard key={c._id} padding={false} className="overflow-hidden">
              <div className="aspect-[3/2] relative bg-[var(--admin-surface-3)]">
                {c.image ? (
                  <Image src={c.image} alt="" fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--admin-text-muted)]">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-medium truncate">{c.name}</h3>
                  <AdminBadge tone="muted">{c.productCount ?? 0} products</AdminBadge>
                </div>
                <div className="flex gap-2 mt-3">
                  <AdminButton variant="ghost" onClick={() => openEdit(c)}>Edit</AdminButton>
                  <AdminButton variant="danger" onClick={() => handleDelete(c._id)}>Delete</AdminButton>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      <AdminFab onClick={openAdd} label="Add Category" />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Category' : 'Add Category'} variant="dark">
        <div className="space-y-4">
          <AdminField label="Name" required>
            <AdminInput type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </AdminField>
          <AdminField label="Description">
            <AdminTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} />
          </AdminField>
          <AdminField label="Image">
            <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" id="cat-img" />
            <label htmlFor="cat-img" className="block min-h-[100px] border-2 border-dashed border-[var(--admin-border)] rounded-lg p-4 text-center cursor-pointer hover:border-[var(--admin-accent)] text-[var(--admin-text-muted)]">
              {form.image ? <Image src={form.image} alt="" width={200} height={100} className="mx-auto rounded" /> : uploading ? 'Uploading...' : 'Click to upload'}
            </label>
          </AdminField>
          <AdminModalActions>
            <AdminButton onClick={handleSave} disabled={saving}>Save</AdminButton>
            <AdminButton variant="secondary" onClick={() => setModalOpen(false)}>Cancel</AdminButton>
          </AdminModalActions>
        </div>
      </Modal>
    </div>
  );
}
