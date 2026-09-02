'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';
import {
  AdminPageHeader, AdminCard, AdminButton, AdminSelect, AdminInput,
  AdminStatusBadge, AdminLoading, AdminField,
} from '@/components/admin/ui';
import { cn } from '@/lib/utils';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [statusSelect, setStatusSelect] = useState('');
  const [savingStatus, setSavingStatus] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [savingPayment, setSavingPayment] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/orders/${id}`).then((r) => {
      const data = r.data?.data ?? r.data;
      setOrder(data);
      setStatusSelect(data?.status ?? '');
      setPaymentStatus(data?.paymentStatus ?? '');
      setPaymentRef(data?.paymentRef ?? '');
    }).catch(() => router.push('/admin/orders')).finally(() => setLoading(false));
  }, [id, router]);

  const nextStatuses = order ? (STATUS_TRANSITIONS[order.status] ?? []) : [];
  const currentStepIdx = STEPS.indexOf(order?.status ?? '');
  const isBankTransfer = order?.paymentMethod === 'bank_transfer';
  const needsManualConfirm = isBankTransfer && order?.paymentStatus !== 'paid';

  const saveStatus = async () => {
    if (!statusSelect || statusSelect === order?.status) return;
    setSavingStatus(true);
    try {
      const res = await api.put(`/admin/orders/${id}/status`, { status: statusSelect });
      const updated = res.data?.data ?? res.data;
      setOrder(updated);
      toast('Status updated', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSavingStatus(false);
    }
  };

  const confirmPayment = async () => {
    setSavingPayment(true);
    try {
      const res = await api.put(`/admin/orders/${id}/payment`, { paymentStatus: 'paid', paymentRef: paymentRef || undefined });
      const updated = res.data?.data ?? res.data;
      setOrder(updated);
      setPaymentStatus('paid');
      toast('Payment confirmed', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed', 'error');
    } finally {
      setSavingPayment(false);
    }
  };

  if (loading || !order) {
    return <AdminLoading />;
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title={`Order ${order.orderNumber}`}
        subtitle={order.createdAt ? new Date(order.createdAt).toLocaleString() : undefined}
        action={<AdminStatusBadge status={order.status} />}
      />

      {nextStatuses.length > 0 ? (
        <AdminCard>
          <h2 className="text-sm font-medium mb-4">Update Status</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <AdminSelect value={statusSelect} onChange={(e) => setStatusSelect(e.target.value)} className="flex-1">
              <option value={order.status}>{order.status}</option>
              {nextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </AdminSelect>
            <AdminButton onClick={saveStatus} disabled={savingStatus || statusSelect === order.status}>Save</AdminButton>
          </div>
        </AdminCard>
      ) : (
        <AdminCard>
          <p>{order.status === 'delivered' ? 'This order is complete' : 'This order was cancelled'}</p>
        </AdminCard>
      )}

      <AdminCard>
        <h2 className="text-sm font-medium mb-4">Status Timeline</h2>
        <div className="flex flex-col">
          {STEPS.map((step, i) => {
            const isCompleted = i < currentStepIdx || (i === currentStepIdx && order.status === step);
            const isCurrent = i === currentStepIdx && order.status === step;
            return (
              <div key={step} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={cn('w-4 h-4 rounded-full flex-shrink-0 mt-0.5', isCompleted && 'bg-[var(--admin-accent)]', isCurrent && 'bg-[var(--admin-accent)] animate-pulse', !isCompleted && !isCurrent && 'bg-white/20')} />
                  {i < STEPS.length - 1 && <div className={cn('w-0.5 flex-1 min-h-[24px]', isCompleted ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-border)]')} />}
                </div>
                <div className="pb-6">
                  <p className="font-medium capitalize">{step}</p>
                </div>
              </div>
            );
          })}
        </div>
      </AdminCard>

      <AdminCard>
        <h2 className="text-sm font-medium mb-4">Items</h2>
        <div className="space-y-4">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--admin-surface-3)] flex-shrink-0">
                {item.image ? <Image src={item.image} alt="" width={48} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-[var(--admin-text-muted)]">Qty: {item.quantity} × ₦{item.price?.toLocaleString()}</p>
              </div>
              <span className="font-display text-[var(--admin-accent)]">₦{item.subtotal?.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </AdminCard>

      {order.shippingAddress && (
        <AdminCard>
          <h2 className="text-sm font-medium mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--admin-accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
            Shipping Address
          </h2>
          <p>{order.shippingAddress.name}</p>
          <p className="text-[var(--admin-text-muted)]">{order.shippingAddress.street}</p>
          <p className="text-[var(--admin-text-muted)]">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
          <p className="text-[var(--admin-text-muted)] mt-1">{order.shippingAddress.phone}</p>
        </AdminCard>
      )}

      <AdminCard>
        <h2 className="text-sm font-medium mb-4">Customer</h2>
        <p>{order.userId?.name ?? order.guestEmail ?? '—'}</p>
        <p className="text-sm text-[var(--admin-text-muted)]">{order.userId?.email ?? order.guestEmail ?? ''}</p>
      </AdminCard>

      <AdminCard>
        <h2 className="text-sm font-medium mb-4">Payment</h2>
        <p className="text-[var(--admin-text-muted)] capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
        <AdminStatusBadge status={order.paymentStatus} />
        {order.paymentRef && <p className="text-sm text-[var(--admin-text-muted)] mt-2">Ref: {order.paymentRef}</p>}
        {needsManualConfirm && (
          <div className="mt-4 pt-4 border-t border-[var(--admin-border)]">
            <p className="text-sm text-[var(--admin-text-muted)] mb-2">Manual confirmation (bank transfer)</p>
            <AdminField label="Reference (optional)">
              <AdminInput type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Reference (optional)" />
            </AdminField>
            <AdminButton variant="success" onClick={confirmPayment} disabled={savingPayment} fullWidth className="mt-3">Confirm Payment</AdminButton>
          </div>
        )}
      </AdminCard>

      <AdminCard>
        <h2 className="text-sm font-medium mb-4">Total</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-[var(--admin-text-muted)]">Subtotal</span><span>₦{(order.subtotal ?? 0).toLocaleString()}</span></div>
          {order.discount > 0 && <div className="flex justify-between"><span className="text-[var(--admin-text-muted)]">Discount</span><span className="text-[var(--admin-success)]">−₦{(order.discount ?? 0).toLocaleString()}</span></div>}
          <div className="flex justify-between"><span className="text-[var(--admin-text-muted)]">Shipping</span><span>₦{(order.shippingFee ?? 0).toLocaleString()}</span></div>
          <div className="flex justify-between font-display text-lg text-[var(--admin-accent)] pt-2 border-t border-[var(--admin-border)]"><span>Total</span><span>₦{(order.total ?? 0).toLocaleString()}</span></div>
        </div>
      </AdminCard>
    </div>
  );
}
