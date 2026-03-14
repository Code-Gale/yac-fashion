'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastContext';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'pending', label: 'Order Placed' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Processing' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

function getCurrentStepIndex(status: string) {
  const idx = STATUS_ORDER.indexOf(status);
  return idx >= 0 ? idx : 0;
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState<{ productId: string; name: string; image?: string } | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/account/orders/${id}`),
      api.get(`/account/orders/${id}/reviewed-products`),
    ])
      .then(([orderRes, reviewedRes]) => {
        const data = orderRes.data?.data ?? orderRes.data;
        const reviewed = reviewedRes.data?.data ?? reviewedRes.data;
        setOrder(data);
        setReviewedIds(new Set(reviewed?.productIds ?? []));
      })
      .catch(() => router.push('/account/orders'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const submitReview = async () => {
    if (!reviewModal || reviewRating < 1 || reviewComment.length < 10) return;
    setReviewSubmitting(true);
    try {
      await api.post(`/products/${reviewModal.productId}/reviews`, {
        orderId: id,
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewedIds((prev) => new Set(Array.from(prev).concat(reviewModal.productId)));
      setReviewModal(null);
      setReviewRating(0);
      setReviewComment('');
      toast('Review submitted', 'success');
    } catch (err: any) {
      toast(err?.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const closeReviewModal = () => {
    setReviewModal(null);
    setReviewRating(0);
    setReviewComment('');
  };

  if (loading || !order) {
    return (
      <div className="max-w-3xl flex items-center justify-center min-h-[200px]">
        <div className="animate-spin w-10 h-10 border-2 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const currentStepIdx = getCurrentStepIndex(order.status);
  const eligibleForReview =
    order.status === 'delivered' &&
    order.items?.filter((item: any) => {
      const pid = item.productId?.toString?.() ?? item.productId;
      return pid && !reviewedIds.has(pid);
    });

  return (
    <div className="max-w-3xl">
      <Link href="/account/orders" className="text-sm text-accent hover:underline flex items-center gap-1 mb-6">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Orders
      </Link>

      <h1 className="font-display text-2xl lg:text-3xl text-primary">Order {order.orderNumber}</h1>
      <p className="text-text-muted mt-1">
        Placed on {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}
      </p>

      <section className="mt-8">
        <h2 className="font-display text-lg text-primary mb-4">Status</h2>
        <div className="flex flex-col">
          {STEPS.map((step, i) => {
            const isCompleted = i < currentStepIdx || (i === currentStepIdx && order.status === step.key);
            const isCurrent = i === currentStepIdx && order.status === step.key;
            return (
              <div key={step.key} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full flex-shrink-0 mt-0.5',
                      isCompleted && 'bg-accent',
                      isCurrent && 'bg-accent animate-pulse',
                      !isCompleted && !isCurrent && 'bg-border'
                    )}
                  />
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'w-0.5 flex-1 min-h-[24px]',
                        isCompleted ? 'bg-accent' : 'bg-border'
                      )}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <p className="font-medium text-primary">{step.label}</p>
                  {isCurrent && order.updatedAt && (
                    <p className="text-xs text-text-muted mt-0.5">
                      {new Date(order.updatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg text-primary mb-4">Items</h2>
        <div className="space-y-4">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex gap-4 items-center bg-surface border rounded-lg p-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-alt flex-shrink-0">
                {item.image ? (
                  <Image src={item.image} alt="" width={48} height={48} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-medium text-primary hover:text-accent line-clamp-2"
                >
                  {item.name}
                </Link>
                <p className="text-sm text-text-muted mt-0.5">
                  Qty: {item.quantity} × ₦{item.price?.toLocaleString?.() ?? '0'} = ₦
                  {item.subtotal?.toLocaleString?.() ?? '0'}
                </p>
              </div>
              <div className="font-display font-semibold text-accent">
                ₦{item.subtotal?.toLocaleString?.() ?? '0'}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 bg-surface border rounded-lg p-5">
        <h2 className="font-display text-lg text-primary mb-4">Price Breakdown</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Subtotal</span>
            <span>₦{order.subtotal?.toLocaleString?.() ?? '0'}</span>
          </div>
          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-text-muted">Discount</span>
              <span className="text-success">−₦{order.discount?.toLocaleString?.() ?? '0'}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Shipping</span>
            <span>₦{order.shippingFee?.toLocaleString?.() ?? '0'}</span>
          </div>
          <div className="flex justify-between font-display font-semibold text-accent text-lg pt-2 border-t border-border">
            <span>Total</span>
            <span>₦{order.total?.toLocaleString?.() ?? '0'}</span>
          </div>
        </div>
      </section>

      {order.shippingAddress && (
        <section className="mt-8 bg-surface border rounded-lg p-5">
          <h2 className="font-display text-lg text-primary mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
            </svg>
            Shipping Address
          </h2>
          <p className="text-primary">{order.shippingAddress.name}</p>
          <p className="text-text-muted">{order.shippingAddress.street}</p>
          <p className="text-text-muted">
            {order.shippingAddress.city}, {order.shippingAddress.state}
          </p>
          <p className="text-text-muted mt-1">{order.shippingAddress.phone}</p>
        </section>
      )}

      <section className="mt-8 bg-surface border rounded-lg p-5">
        <h2 className="font-display text-lg text-primary mb-4">Payment</h2>
        <div className="flex flex-wrap items-center gap-2">
          <span className="capitalize">{order.paymentMethod?.replace('_', ' ')}</span>
          <span
            className={cn(
              'text-xs px-2 py-0.5 rounded-full',
              order.paymentStatus === 'paid' && 'bg-success/20 text-success',
              order.paymentStatus === 'failed' && 'bg-error/20 text-error',
              order.paymentStatus === 'pending' && 'bg-warning/20 text-warning'
            )}
          >
            {order.paymentStatus}
          </span>
          {order.paymentRef && (
            <span className="text-sm text-text-muted">Ref: {order.paymentRef}</span>
          )}
        </div>
      </section>

      {eligibleForReview && eligibleForReview.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg text-primary mb-4">Write a Review</h2>
          <div className="space-y-4">
            {eligibleForReview.map((item: any) => (
              <div
                key={item.productId}
                className="flex gap-4 items-center bg-surface border rounded-lg p-4"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-bg-alt flex-shrink-0">
                  {item.image ? (
                    <Image src={item.image} alt="" width={48} height={48} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary">{item.name}</p>
                </div>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() =>
                    setReviewModal({
                      productId: item.productId?.toString?.() ?? item.productId,
                      name: item.name,
                      image: item.image,
                    })
                  }
                  className="min-h-[44px]"
                >
                  Write a Review
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={!!reviewModal}
        onClose={closeReviewModal}
        title={reviewModal ? `Review: ${reviewModal.name}` : ''}
      >
        {reviewModal && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-primary mb-2">Your rating</p>
              <StarRating
                rating={0}
                interactive
                value={reviewRating}
                onChange={setReviewRating}
                size="md"
              />
            </div>
            <div>
              <label htmlFor="review-comment" className="block text-sm font-medium text-primary mb-2">
                Your review (min 10 characters)
              </label>
              <textarea
                id="review-comment"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience..."
                rows={4}
                className="w-full px-4 py-3 border border-border rounded-lg bg-bg text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                variant="accent"
                onClick={submitReview}
                disabled={reviewRating < 1 || reviewComment.length < 10 || reviewSubmitting}
                loading={reviewSubmitting}
                className="min-h-[44px] flex-1"
              >
                Submit
              </Button>
              <Button variant="outline" onClick={closeReviewModal} className="min-h-[44px]">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
