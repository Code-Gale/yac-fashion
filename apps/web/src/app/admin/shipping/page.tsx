'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/ToastContext';
import { AdminTable } from '@/components/admin/AdminTable';
import { NIGERIAN_STATES } from '@/lib/constants';
import { cn } from '@/lib/utils';

type ShippingMethod = {
      _id: string;
  key: string;
  label: string;
  description?: string;
  estimatedDays?: string;
  price: number;
  isActive: boolean;
  sortOrder: number;
  rateCount?: number;
};

    type ShippingRate = {
  _id: string;
  method: string;
  state: string;
  price: number;
  estimatedDays?: string;
};

export default function AdminShippingPage() {
  const { toast } = useToast();
      const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);

  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(null);
  const [methodForm, setMethodForm] = useState({ label: '', description: '', estimatedDays: '', price: '', isActive: true });
  const [savingMethod, setSavingMethod] = useState(false);

  const [ratesModalOpen, setRatesModalOpen] = useState(false);
  const [ratesMethod, setRatesMethod] = useState<ShippingMethod | null>(null);
      const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [rateForm, setRateForm] = useState({ state: '', price: '', estimatedDays: '' });
  const [savingRate, setSavingRate] = useState(false);

  const fetchMethods = useCallback(async () => {
    try {
      const { data } = await api.get('/admin/shipping/methods');
      const list = data?.data ?? data;
      setMethods(Array.isArray(list) ? list : []);
        } catch (_) {
      setMethods([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

      const openAddMethod = () => {
    setEditingMethod(null);
    setMethodForm({ label: '', description: '', estimatedDays: '', price: '', isActive: true });
    setMethodModalOpen(true);
  };

  const openEditMethod = (m: ShippingMethod) => {
    setEditingMethod(m);
    setMethodForm({
      label: m.label ?? '',
            description: m.description ?? '',
      estimatedDays: m.estimatedDays ?? '',
      price: String(m.price ?? ''),
      isActive: m.isActive !== false,
    });
    setMethodModalOpen(true);
  };

  const saveMethod = async () => {
    if (!methodForm.label.trim()) {
      toast('Label is required', 'error');
          return;
    }
    if (methodForm.price === '' || Number(methodForm.price) < 0) {
      toast('A valid default price is required', 'error');
      return;
    }
    setSavingMethod(true);
    try {
      const payload = {
        label: methodForm.label.trim(),
        description: methodForm.description.trim(),
            estimatedDays: methodForm.estimatedDays.trim(),
        price: parseFloat(methodForm.price) || 0,
        isActive: methodForm.isActive,
      };
      if (editingMethod) {
        await api.put(`/admin/shipping/methods/${editingMethod._id}`, payload);
        toast('Shipping method updated', 'success');
      } else {
        await api.post('/admin/shipping/methods', payload);
        toast('Shipping method created', 'success');
         }
      fetchMethods();
      setMethodModalOpen(false);
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSavingMethod(false);
    }
  };

  const deleteMethod = async (m: ShippingMethod) => {
       if (!confirm(`Delete "${m.label}"? This also removes any state-specific pricing for it.`)) return;
    try {
      await api.delete(`/admin/shipping/methods/${m._id}`);
      toast('Deleted', 'success');
      fetchMethods();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    }
  };

     const openRates = async (m: ShippingMethod) => {
    setRatesMethod(m);
    setRateForm({ state: '', price: '', estimatedDays: '' });
    setRatesModalOpen(true);
    setRatesLoading(true);
    try {
      const { data } = await api.get(`/admin/shipping/methods/${m._id}/rates`);
      const list = data?.data ?? data;
      setRates(Array.isArray(list) ? list : []);
    } catch (_) {
         setRates([]);
    } finally {
      setRatesLoading(false);
    }
  };

  const editRate = (r: ShippingRate) => {
    setRateForm({ state: r.state, price: String(r.price ?? ''), estimatedDays: r.estimatedDays ?? '' });
  };

  const saveRate = async () => {
       if (!ratesMethod) return;
    if (!rateForm.state) {
      toast('Select a state', 'error');
      return;
    }
    if (rateForm.price === '' || Number(rateForm.price) < 0) {
      toast('A valid price is required', 'error');
      return;
    }
    setSavingRate(true);
    try {
         await api.post(`/admin/shipping/methods/${ratesMethod._id}/rates`, {
        state: rateForm.state,
        price: parseFloat(rateForm.price) || 0,
        estimatedDays: rateForm.estimatedDays.trim(),
      });
      toast('Rate saved', 'success');
      const { data } = await api.get(`/admin/shipping/methods/${ratesMethod._id}/rates`);
      const list = data?.data ?? data;
      setRates(Array.isArray(list) ? list : []);
      fetchMethods();
         setRateForm({ state: '', price: '', estimatedDays: '' });
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSavingRate(false);
    }
  };

  const deleteRate = async (r: ShippingRate) => {
    if (!confirm(`Remove the custom rate for ${r.state}? It will fall back to the default price.`)) return;
       try {
      await api.delete(`/admin/shipping/rates/${r._id}`);
      setRates((prev) => prev.filter((x) => x._id !== r._id));
      toast('Rate removed', 'success');
      fetchMethods();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    }
  };

  const statesWithoutRate = NIGERIAN_STATES.filter((s) => !rates.some((r) => r.state === s));
   
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-[#f0f0f0]">Shipping</h1>
          <p className="text-sm text-[#8b92a5] mt-1">Delivery methods and per-state pricing overrides.</p>
        </div>
        <button type="button" onClick={openAddMethod} className="min-h-[44px] px-4 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg hover:bg-[#c9a84c]/90">Add Method</button>
         </div>

      <div className="bg-[#1a1d26] border border-white/10 rounded-xl overflow-hidden">
        <AdminTable
          columns={[
            { key: 'label', label: 'Method', render: (r: any) => (
              <div>
                <p className="text-[#f0f0f0] font-medium">{r.label}</p>
                {r.estimatedDays && <p className="text-xs text-[#8b92a5]">{r.estimatedDays}</p>}
              </div>
            )},
               { key: 'price', label: 'Default Price', render: (r: any) => <span className="font-display text-[#c9a84c]">₦{(r.price ?? 0).toLocaleString()}</span> },
            { key: 'rates', label: 'State Overrides', hideOnMobile: true, render: (r: any) => (
              <button type="button" onClick={() => openRates(r)} className="text-sm text-[#c9a84c] hover:underline">
                {r.rateCount > 0 ? `${r.rateCount} state${r.rateCount === 1 ? '' : 's'}` : 'Set prices'}
              </button>
            )},
            { key: 'status', label: 'Status', render: (r: any) => <span className={cn('text-xs px-2 py-0.5 rounded-full', r.isActive !== false ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#8b92a5]/20 text-[#8b92a5]')}>{r.isActive !== false ? 'Active' : 'Inactive'}</span> },
               { key: 'actions', label: '', width: '140px', render: (r: any) => (
              <div className="flex gap-2">
                <button type="button" onClick={() => openEditMethod(r)} className="p-2 rounded hover:bg-white/5 text-[#8b92a5] hover:text-[#f0f0f0]">Edit</button>
                <button type="button" onClick={() => deleteMethod(r)} className="p-2 rounded hover:bg-[#ef4444]/20 text-[#8b92a5] hover:text-[#ef4444]">Delete</button>
              </div>
            )},
          ]}
          data={methods}
          loading={loading}
          emptyMessage="No shipping methods yet"
          mobileCardRender={(r: any) => (
            <div className="bg-[#222634] rounded-lg p-4 border border-white/10">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="text-[#f0f0f0] font-medium truncate">{r.label}</p>
                  {r.estimatedDays && <p className="text-xs text-[#8b92a5]">{r.estimatedDays}</p>}
                </div>
                <span className={cn('text-xs px-2 py-0.5 rounded-full flex-shrink-0', r.isActive !== false ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-[#8b92a5]/20 text-[#8b92a5]')}>{r.isActive !== false ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="font-display text-[#c9a84c]">₦{(r.price ?? 0).toLocaleString()}</span>
                <button type="button" onClick={() => openRates(r)} className="text-sm text-[#c9a84c] hover:underline">
                  {r.rateCount > 0 ? `${r.rateCount} state${r.rateCount === 1 ? '' : 's'}` : 'Set prices'}
                </button>
              </div>
              <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                <button type="button" onClick={() => openEditMethod(r)} className="min-h-[40px] px-3 rounded hover:bg-white/5 text-[#8b92a5] hover:text-[#f0f0f0] text-sm">Edit</button>
                <button type="button" onClick={() => deleteMethod(r)} className="min-h-[40px] px-3 rounded hover:bg-[#ef4444]/20 text-[#8b92a5] hover:text-[#ef4444] text-sm">Delete</button>
              </div>
            </div>
          )}
        />
         </div>

      {/* Add/Edit method modal */}
      <Modal open={methodModalOpen} onClose={() => setMethodModalOpen(false)} title={editingMethod ? 'Edit Shipping Method' : 'Add Shipping Method'} variant="dark">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Label *</label>
            <input type="text" value={methodForm.label} onChange={(e) => setMethodForm((f) => ({ ...f, label: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" placeholder="Standard Delivery" />
          </div>
          <div>
               <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Estimated Days</label>
            <input type="text" value={methodForm.estimatedDays} onChange={(e) => setMethodForm((f) => ({ ...f, estimatedDays: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" placeholder="3-5 business days" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Description</label>
            <input type="text" value={methodForm.description} onChange={(e) => setMethodForm((f) => ({ ...f, description: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" placeholder="Optional note shown at checkout" />
          </div>
          <div>
            <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Default Price (₦) *</label>
               <input type="number" min="0" value={methodForm.price} onChange={(e) => setMethodForm((f) => ({ ...f, price: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" placeholder="2500" />
            <p className="text-xs text-[#8b92a5] mt-1">Used for any state without a custom price below.</p>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" role="switch" aria-checked={methodForm.isActive} onClick={() => setMethodForm((f) => ({ ...f, isActive: !f.isActive }))} className={cn('relative w-14 h-8 rounded-full transition-colors', methodForm.isActive ? 'bg-[#c9a84c]' : 'bg-[#222634]')}>
              <span className={cn('absolute top-1 w-6 h-6 rounded-full bg-white transition-transform', methodForm.isActive ? 'left-7' : 'left-1')} />
            </button>
            <span className="text-sm text-[#f0f0f0]">Active</span>
             </div>
          <div className="flex gap-3 pt-2 border-t border-[rgba(255,255,255,0.08)]">
            <button type="button" onClick={saveMethod} disabled={savingMethod} className="min-h-[44px] px-4 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg disabled:opacity-50">Save</button>
            <button type="button" onClick={() => setMethodModalOpen(false)} className="min-h-[44px] px-4 py-2 border border-[rgba(255,255,255,0.08)] rounded-lg text-[#8b92a5] hover:text-[#f0f0f0]">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* State pricing modal */}
         <Modal open={ratesModalOpen} onClose={() => setRatesModalOpen(false)} title={ratesMethod ? `State Pricing — ${ratesMethod.label}` : 'State Pricing'} variant="dark" className="max-w-2xl">
        <div className="space-y-6">
          <p className="text-sm text-[#8b92a5]">
            Set a custom price for specific states. Any state without a custom price below uses the default
            (₦{(ratesMethod?.price ?? 0).toLocaleString()}{ratesMethod?.estimatedDays ? `, ${ratesMethod.estimatedDays}` : ''}).
          </p>

          <div className="grid sm:grid-cols-3 gap-3 items-end p-4 bg-[#0f1117] border border-white/10 rounded-lg">
            <div>
                 <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">State</label>
              <select value={rateForm.state} onChange={(e) => setRateForm((f) => ({ ...f, state: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]">
                <option value="">Select state</option>
                {[...statesWithoutRate, ...(rates.some((r) => r.state === rateForm.state) ? [rateForm.state] : [])]
                  .sort()
                  .map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Price (₦)</label>
                 <input type="number" min="0" value={rateForm.price} onChange={(e) => setRateForm((f) => ({ ...f, price: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" placeholder="5000" />
            </div>
            <div>
              <label className="block text-xs text-[#8b92a5] uppercase tracking-wider mb-1">Days (optional)</label>
              <input type="text" value={rateForm.estimatedDays} onChange={(e) => setRateForm((f) => ({ ...f, estimatedDays: e.target.value }))} className="w-full min-h-[44px] px-4 py-2 bg-[#222634] border border-[rgba(255,255,255,0.12)] rounded-lg text-[#f0f0f0] placeholder-[#8b92a5] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]" placeholder="1-2 business days" />
            </div>
            <div className="sm:col-span-3">
              <button type="button" onClick={saveRate} disabled={savingRate} className="min-h-[44px] px-4 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg disabled:opacity-50 w-full sm:w-auto">
                    {rates.some((r) => r.state === rateForm.state) ? 'Update Price' : 'Add Price'}
              </button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {ratesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-[#c9a84c] border-t-transparent rounded-full" />
              </div>
            ) : rates.length === 0 ? (
                 <p className="text-sm text-[#8b92a5] text-center py-8">No custom state prices yet — every state uses the default.</p>
            ) : (
              <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-[#8b92a5] uppercase tracking-wider border-b border-white/10">
                    <th className="py-2 pr-4">State</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2 pr-4">Days</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                   <tbody>
                  {[...rates].sort((a, b) => a.state.localeCompare(b.state)).map((r) => (
                    <tr key={r._id} className="border-b border-white/5">
                      <td className="py-2 pr-4 text-[#f0f0f0]">{r.state}</td>
                      <td className="py-2 pr-4 text-[#c9a84c] font-display">₦{(r.price ?? 0).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-[#8b92a5]">{r.estimatedDays || '—'}</td>
                      <td className="py-2 flex gap-2">
                        <button type="button" onClick={() => editRate(r)} className="text-[#8b92a5] hover:text-[#f0f0f0]">Edit</button>
                        <button type="button" onClick={() => deleteRate(r)} className="text-[#8b92a5] hover:text-[#ef4444]">Remove</button>
                      </td>
                       </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
