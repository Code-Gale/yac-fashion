'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { NIGERIAN_STATES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const MAX_ADDRESSES = 5;

type Address = {
  _id: string;
  label?: string;
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  phone?: string;
  isDefault?: boolean;
};

export default function AddressesPage() {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    label: '',
    name: '',
    street: '',
    city: '',
    state: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchAddresses = useCallback(async () => {
    try {
      const { data } = await api.get('/account/addresses');
      const list = data?.data ?? data;
      setAddresses(Array.isArray(list) ? list : []);
    } catch (_) {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  const openAdd = () => {
    setEditingId(null);
    setForm({ label: '', name: '', street: '', city: '', state: '', phone: '' });
    setModalOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr._id);
    setForm({
      label: addr.label || '',
      name: addr.name || '',
      street: addr.street || '',
      city: addr.city || '',
      state: addr.state || '',
      phone: addr.phone || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm({ label: '', name: '', street: '', city: '', state: '', phone: '' });
  };

  const handleSave = async () => {
    if (!form.street?.trim() || !form.city?.trim() || !form.state?.trim() || !form.phone?.trim()) {
      toast('Please fill all required fields', 'error');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/account/addresses/${editingId}`, form);
        toast('Address updated', 'success');
      } else {
        await api.post('/account/addresses', form);
        toast('Address added', 'success');
      }
      fetchAddresses();
      closeModal();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to save address', 'error');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (addressId: string) => {
    try {
      await api.post(`/account/addresses/${addressId}/default`);
      toast('Default address updated', 'success');
      fetchAddresses();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to update', 'error');
    }
  };

  const deleteAddress = async (addressId: string) => {
    try {
      await api.delete(`/account/addresses/${addressId}`);
      toast('Address removed', 'success');
      fetchAddresses();
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to delete', 'error');
    }
  };

  const atLimit = addresses.length >= MAX_ADDRESSES;

  return (
    <div>
      <h1 className="font-display text-2xl lg:text-3xl text-primary">Saved Addresses</h1>
      <p className="mt-1 text-text-muted">Manage your delivery addresses</p>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border rounded-lg p-5 animate-pulse h-40" />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr._id}
              className="bg-surface border rounded-lg p-5 relative"
            >
              {addr.isDefault && (
                <span className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full bg-accent-light text-accent font-medium">
                  Default
                </span>
              )}
              {addr.label && (
                <span className="inline-block text-xs px-2 py-0.5 rounded bg-bg-alt text-text-muted mb-2">
                  {addr.label}
                </span>
              )}
              {addr.name && <p className="font-medium text-primary">{addr.name}</p>}
              <p className="text-text-muted text-sm">{addr.street}</p>
              <p className="text-text-muted text-sm">
                {addr.city}, {addr.state}
              </p>
              <p className="text-text-muted text-sm mt-1">{addr.phone}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!addr.isDefault && (
                  <button
                    type="button"
                    onClick={() => setDefault(addr._id)}
                    className="min-h-[44px] px-3 py-2 text-sm font-medium text-accent hover:bg-accent-light rounded-md transition-colors"
                  >
                    Set as Default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(addr)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-md hover:bg-bg-alt transition-colors"
                  aria-label="Edit"
                >
                  <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => deleteAddress(addr._id)}
                  className="min-h-[44px] min-w-[44px] p-2 rounded-md hover:bg-error/10 hover:text-error transition-colors"
                  aria-label="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={atLimit ? undefined : openAdd}
            disabled={atLimit}
            title={atLimit ? 'Remove an address to add a new one' : ''}
            className={cn(
              'min-h-[120px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 transition-colors',
              atLimit
                ? 'border-border cursor-not-allowed opacity-60'
                : 'border-border hover:border-accent hover:bg-accent-light/5'
            )}
          >
            <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-medium text-text-muted">Add New Address</span>
          </button>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Address' : 'Add New Address'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="addr-label" className="block text-sm font-medium text-primary mb-1">
              Label (e.g. Home)
            </label>
            <input
              id="addr-label"
              type="text"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Home"
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="addr-name" className="block text-sm font-medium text-primary mb-1">
              Name
            </label>
            <input
              id="addr-name"
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Recipient name"
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="addr-street" className="block text-sm font-medium text-primary mb-1">
              Street *
            </label>
            <input
              id="addr-street"
              type="text"
              value={form.street}
              onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
              placeholder="Street address"
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="addr-city" className="block text-sm font-medium text-primary mb-1">
              City *
            </label>
            <input
              id="addr-city"
              type="text"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              placeholder="City"
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="addr-state" className="block text-sm font-medium text-primary mb-1">
              State *
            </label>
            <select
              id="addr-state"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary focus:outline-none focus:ring-2 focus:ring-accent min-h-[44px]"
            >
              <option value="">Select state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="addr-phone" className="block text-sm font-medium text-primary mb-1">
              Phone *
            </label>
            <input
              id="addr-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Phone number"
              className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button
              variant="accent"
              onClick={handleSave}
              disabled={saving}
              loading={saving}
              className="min-h-[44px] flex-1"
            >
              Save
            </Button>
            <Button variant="outline" onClick={closeModal} className="min-h-[44px]">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
