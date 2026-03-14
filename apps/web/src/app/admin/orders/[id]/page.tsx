'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#8b92a5',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  shipped: '#f59e0b',
  delivered: '#22c55e',
  cancelled: '#ef4444',
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
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin w-10 h-10 border-2 border-[#c9a84c] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/orders" className="text-[#8b92a5] hover:text-[#f0f0f0]">← Orders</Link>
        <h1 className="font-display text-2xl text-[#f0f0f0]">Order {order.orderNumber}</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Status</h2>
            <div className="flex flex-col">
              {STEPS.map((step, i) => {
                const isCompleted = i < currentStepIdx || (i === currentStepIdx && order.status === step);
                const isCurrent = i === currentStepIdx && order.status === step;
                return (
                  <div key={step} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn('w-4 h-4 rounded-full flex-shrink-0 mt-0.5', isCompleted && 'bg-[#c9a84c]', isCurrent && 'bg-[#c9a84c] animate-pulse', !isCompleted && !isCurrent && 'bg-white/20')} />
                      {i < STEPS.length - 1 && <div className={cn('w-0.5 flex-1 min-h-[24px]', isCompleted ? 'bg-[#c9a84c]' : 'bg-white/10')} />}
                    </div>
                    <div className="pb-6">
                      <p className="font-medium text-[#f0f0f0] capitalize">{step}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Items</h2>
            <div className="space-y-4">
              {order.items?.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-[#222634] flex-shrink-0">
                    {item.image ? <Image src={item.image} alt="" width={48} height={48} className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#f0f0f0]">{item.name}</p>
                    <p className="text-sm text-[#8b92a5]">Qty: {item.quantity} × ₦{item.price?.toLocaleString()}</p>
                  </div>
                  <span className="font-display text-[#c9a84c]">₦{item.subtotal?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {order.shippingAddress && (
            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#f0f0f0] mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                Shipping Address
              </h2>
              <p className="text-[#f0f0f0]">{order.shippingAddress.name}</p>
              <p className="text-[#8b92a5]">{order.shippingAddress.street}</p>
              <p className="text-[#8b92a5]">{order.shippingAddress.city}, {order.shippingAddress.state}</p>
              <p className="text-[#8b92a5] mt-1">{order.shippingAddress.phone}</p>
            </div>
          )}
        </div>

        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {nextStatuses.length > 0 ? (
            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Update Status</h2>
              <div className="flex gap-2">
                <select value={statusSelect} onChange={(e) => setStatusSelect(e.target.value)} className="flex-1 min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] focus:outline-none focus:ring-2 focus:ring-[#c9a84c]">
                  <option value={order.status}>{order.status}</option>
                  {nextStatuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button type="button" onClick={saveStatus} disabled={savingStatus || statusSelect === order.status} className="min-h-[44px] px-4 py-2 bg-[#c9a84c] text-[#0f1117] font-medium rounded-lg disabled:opacity-50">Save</button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
              <p className="text-[#f0f0f0]">{order.status === 'delivered' ? 'This order is complete' : 'This order was cancelled'}</p>
            </div>
          )}

          <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Customer</h2>
            <p className="text-[#f0f0f0]">{order.userId?.name ?? order.guestEmail ?? '—'}</p>
            <p className="text-sm text-[#8b92a5]">{order.userId?.email ?? order.guestEmail ?? ''}</p>
          </div>

          <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Payment</h2>
            <p className="text-[#8b92a5] capitalize">{order.paymentMethod?.replace('_', ' ')}</p>
            <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${order.paymentStatus === 'paid' ? '#22c55e' : order.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b'}20`, color: order.paymentStatus === 'paid' ? '#22c55e' : order.paymentStatus === 'failed' ? '#ef4444' : '#f59e0b' }}>{order.paymentStatus}</span>
            {order.paymentRef && <p className="text-sm text-[#8b92a5] mt-2">Ref: {order.paymentRef}</p>}
            {needsManualConfirm && (
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-sm text-[#8b92a5] mb-2">Manual confirmation (bank transfer)</p>
                <input type="text" value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} placeholder="Reference (optional)" className="w-full min-h-[44px] px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-[#f0f0f0] mb-2" />
                <button type="button" onClick={confirmPayment} disabled={savingPayment} className="min-h-[44px] w-full py-2 bg-[#22c55e] text-white font-medium rounded-lg disabled:opacity-50">Confirm Payment</button>
              </div>
            )}
          </div>

          <div className="bg-[#1a1d26] border border-white/10 rounded-xl p-5">
            <h2 className="text-sm font-medium text-[#f0f0f0] mb-4">Total</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#8b92a5]">Subtotal</span><span className="text-[#f0f0f0]">₦{(order.subtotal ?? 0).toLocaleString()}</span></div>
              {order.discount > 0 && <div className="flex justify-between"><span className="text-[#8b92a5]">Discount</span><span className="text-[#22c55e]">−₦{(order.discount ?? 0).toLocaleString()}</span></div>}
              <div className="flex justify-between"><span className="text-[#8b92a5]">Shipping</span><span className="text-[#f0f0f0]">₦{(order.shippingFee ?? 0).toLocaleString()}</span></div>
              <div className="flex justify-between font-display text-lg text-[#c9a84c] pt-2 border-t border-white/10"><span>Total</span><span>₦{(order.total ?? 0).toLocaleString()}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
