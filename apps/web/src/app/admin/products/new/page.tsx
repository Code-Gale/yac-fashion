'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';

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
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products" className="text-[#8b92a5] hover:text-[#f0f0f0]">← Products</Link>
        <h1 className="font-display text-2xl text-[#f0f0f0]">Add Product</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Basic Info</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">Product Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="w-full min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
                  <p className="text-xs text-[#8b92a5] mt-1">yacfashion.com/products/{slugPreview}</p>
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">Description *</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required rows={6} className="w-full min-h-[160px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c] resize-y" />
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">Category *</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} required className="w-full min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]">
                    <option value="">Select category</option>
                    {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Pricing & Inventory</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">Price (₦) *</label>
                  <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required className="w-full min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">Compare-at Price (₦)</label>
                  <input type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">Stock</label>
                  <input type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
                </div>
                <div>
                  <label className="block text-sm text-[#8b92a5] mb-1">SKU</label>
                  <input type="text" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
                </div>
              </div>
            </div>

            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Tags</h2>
              <div className="flex gap-2 mb-2">
                <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Type tag + Enter" className="flex-1 min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] placeholder:text-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" />
                <button type="button" onClick={addTag} className="min-h-[44px] px-4 py-2 bg-[#222634] rounded-lg text-[#f0f0f0] hover:bg-white/5">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.tags.map((t) => (
                  <span key={t} onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((x) => x !== t) }))} className="px-3 py-1 rounded-full bg-[#222634] text-sm text-[#f0f0f0] cursor-pointer hover:bg-[#ef4444]/20">× {t}</span>
                ))}
              </div>
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-3">
                <button type="button" role="switch" aria-checked={form.isFeatured} onClick={() => setForm((f) => ({ ...f, isFeatured: !f.isFeatured }))} className={cn('relative w-14 h-8 rounded-full transition-colors min-w-[56px]', form.isFeatured ? 'bg-[#c9a84c]' : 'bg-[#222634]')}>
                  <span className={cn('absolute top-1 w-6 h-6 rounded-full bg-white transition-transform', form.isFeatured ? 'left-7' : 'left-1')} />
                </button>
                <span className="text-sm text-[#f0f0f0]">Featured</span>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" role="switch" aria-checked={form.isActive} onClick={() => setForm((f) => ({ ...f, isActive: !f.isActive }))} className={cn('relative w-14 h-8 rounded-full transition-colors min-w-[56px]', form.isActive ? 'bg-[#c9a84c]' : 'bg-[#222634]')}>
                  <span className={cn('absolute top-1 w-6 h-6 rounded-full bg-white transition-transform', form.isActive ? 'left-7' : 'left-1')} />
                </button>
                <span className="text-sm text-[#f0f0f0]">Active</span>
              </div>
            </div>
          </div>

          <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Images</h2>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files); }}
              onClick={() => document.getElementById('img-upload')?.click()}
              className={cn('border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors min-h-[120px] flex flex-col items-center justify-center', dragOver ? 'border-[#c9a84c] bg-[#c9a84c]/10' : 'border-white/10 hover:border-white/20')}
            >
              <input id="img-upload" type="file" accept="image/jpeg,image/png,image/gif,image/webp" multiple hidden onChange={(e) => handleFileSelect(e.target.files)} />
              {uploading ? <span className="text-[#8b92a5]">Uploading...</span> : <><svg className="w-12 h-12 text-[#8b92a5] mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg><span className="text-sm text-[#8b92a5]">Drop images or click to browse (max 5, 5MB each)</span></>}
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {form.images.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-[#222634]">
                  <Image src={url} alt="" fill className="object-cover" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#ef4444] text-white flex items-center justify-center text-sm">×</button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:hidden sticky bottom-0 left-0 right-0 p-4 bg-[#0f1117] border-t border-white/10">
          <button type="submit" disabled={saving} className="w-full min-h-[44px] py-3 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg disabled:opacity-50">Save Product</button>
        </div>
        <div className="hidden lg:flex justify-end">
          <button type="submit" disabled={saving} className="min-h-[44px] px-6 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg disabled:opacity-50">Save Product</button>
        </div>
      </form>
    </div>
  );
}
