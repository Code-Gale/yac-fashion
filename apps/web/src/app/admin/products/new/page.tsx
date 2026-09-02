'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';
import {
  AdminPageHeader, AdminCard, AdminField, AdminInput, AdminSelect,
  AdminTextarea, AdminButton, AdminStickyBar, AdminToggle,
} from '@/components/admin/ui';

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function NewProductPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    compareAtPrice: '',
    stock: '0',
    sku: '',
    tags: [] as string[],
    images: [] as string[],
    isFeatured: false,
    isActive: true,
  });
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    api.get('/admin/categories').then((r) => {
      const list = r.data?.data ?? r.data;
      setCategories(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0 || form.images.length >= 5) return;
    setUploading(true);
    try {
      const fd = new FormData();
      const toAdd = Math.min(5 - form.images.length, files.length);
      for (let i = 0; i < toAdd; i++) {
        if (files[i].size <= 5 * 1024 * 1024 && /^image\/(jpeg|png|gif|webp)$/.test(files[i].type)) {
          fd.append('images', files[i]);
        }
      }
      if (fd.getAll('images').length === 0) {
        toast('Invalid files (max 5MB, jpeg/png/gif/webp)', 'error');
        setUploading(false);
        return;
      }
      const { data } = await api.post('/admin/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      const urls = data?.data ?? data;
      setForm((f) => ({ ...f, images: [...f.images, ...(Array.isArray(urls) ? urls : [])].slice(0, 5) }));
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (i: number) => {
    setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }));
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm((f) => ({ ...f, tags: [...f.tags, t] }));
      setTagInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.category || !form.images.length || !form.price) {
      toast('Fill required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      const { data } = await api.post('/admin/products', {
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        images: form.images,
        price: parseFloat(form.price) || 0,
        compareAtPrice: form.compareAtPrice ? parseFloat(form.compareAtPrice) : undefined,
        stock: parseInt(form.stock, 10) || 0,
        sku: form.sku.trim() || undefined,
        tags: form.tags,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
      });
      toast('Product created', 'success');
      router.push('/admin/products');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to create', 'error');
    } finally {
      setSaving(false);
    }
  };

  const slugPreview = slugify(form.name) || 'product-slug';

  return (
    <div>
      <AdminPageHeader title="Add Product" />

      <form onSubmit={handleSubmit} className="space-y-4 pb-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-4">
            <AdminCard>
              <h2 className="text-sm font-semibold mb-4">Basic Info</h2>
              <div className="space-y-4">
                <AdminField label="Product Name" required>
                  <AdminInput type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
                  <p className="text-xs text-[var(--admin-text-muted)] mt-1">yacfashion.com/products/{slugPreview}</p>
                </AdminField>
                <AdminField label="Description" required>
                  <AdminTextarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={6} />
                </AdminField>
                <AdminField label="Category" required>
                  <AdminSelect value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required>
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </AdminSelect>
                </AdminField>
              </div>
            </AdminCard>

            <AdminCard>
              <h2 className="text-sm font-semibold mb-4">Pricing & Inventory</h2>
              <div className="grid grid-cols-2 gap-3">
                <AdminField label="Price (₦)" required>
                  <AdminInput type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
                </AdminField>
                <AdminField label="Compare-at (₦)">
                  <AdminInput type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} />
                </AdminField>
                <AdminField label="Stock">
                  <AdminInput type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} />
                </AdminField>
                <AdminField label="SKU">
                  <AdminInput type="text" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
                </AdminField>
              </div>
            </AdminCard>

            <AdminCard>
              <h2 className="text-sm font-semibold mb-4">Tags</h2>
              <div className="flex gap-2 mb-2">
                <AdminInput type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Type tag + Enter" className="flex-1" />
                <AdminButton type="button" variant="secondary" onClick={addTag}>Add</AdminButton>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((t) => (
                  <span key={t} onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="admin-badge admin-badge-muted cursor-pointer">× {t}</span>
                ))}
              </div>
            </AdminCard>

            <div className="flex flex-wrap gap-6 px-1">
              <AdminToggle checked={form.isFeatured} onChange={(v) => setForm((f) => ({ ...f, isFeatured: v }))} label="Featured" />
              <AdminToggle checked={form.isActive} onChange={(v) => setForm((f) => ({ ...f, isActive: v }))} label="Active" />
            </div>
          </div>

          <AdminCard>
            <h2 className="text-sm font-semibold mb-4">Images</h2>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
              onClick={() => document.getElementById('img-upload')?.click()}
              className={cn('border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all min-h-[120px] flex flex-col items-center justify-center', dragOver ? 'border-[var(--admin-accent)] bg-[var(--admin-accent)]/10 scale-[1.01]' : 'border-[var(--admin-border)] hover:border-[var(--admin-accent)]/50')}
            >
              <input id="img-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={(e) => handleFileSelect(e.target.files)} />
              {uploading ? <span className="text-[var(--admin-text-muted)]">Uploading...</span> : <><svg className="w-10 h-10 text-[var(--admin-text-muted)] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm text-[var(--admin-text-muted)]">Tap to add images (max 5)</span></>}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {form.images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[var(--admin-surface-2)]">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-7 h-7 rounded-full bg-[var(--admin-error)] text-white flex items-center justify-center text-sm">×</button>
                </div>
              ))}
            </div>
          </AdminCard>
        </div>

        <AdminStickyBar>
          <AdminButton type="submit" disabled={saving} fullWidth>{saving ? 'Saving...' : 'Save Product'}</AdminButton>
        </AdminStickyBar>
        <div className="hidden lg:flex justify-end">
          <AdminButton type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Product'}</AdminButton>
        </div>
      </form>
    </div>
  );
}
