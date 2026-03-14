'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuthStore } from '@/store/auth';
import { useToast } from '@/components/ui/ToastContext';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { Badge } from '@/components/ui/Badge';
import { ProductCard } from '@/components/shared/ProductCard';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { trackViewItem, trackAddToCart } from '@/lib/analytics';
import { trackViewContent, trackAddToCart as trackFbAddToCart } from '@/lib/fbPixel';
import { trackViewContent as trackTikTokViewContent, trackAddToCart as trackTikTokAddToCart } from '@/lib/tiktokPixel';

/** @param {{ product: object; relatedProducts?: object[] }} props */
export function ProductDetail({ product, relatedProducts = [] }) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [mainImage, setMainImage] = useState(product?.images?.[0]);
  const [reviews, setReviews] = useState({ reviews: [], total: 0, page: 1, totalPages: 0 });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [addState, setAddState] = useState('idle');
  const mainCtaRef = useRef(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();
  const { accessToken } = useAuthStore();
  const { toast } = useToast();

  const stock = product?.stock ?? 0;
  const outOfStock = stock <= 0;
  const lowStock = stock > 0 && stock <= 5;
  const maxQty = Math.min(stock, 10);
  const displayPrice = product?.flashSalePrice && product?.flashSaleEndsAt && new Date(product.flashSaleEndsAt) > new Date()
    ? product.flashSalePrice
    : product?.price;
  const comparePrice = displayPrice !== product?.price ? product?.price : product?.compareAtPrice;
  const inWishlist = isInWishlist(product?._id);

  useEffect(() => {
    setMainImage(product?.images?.[0]);
  }, [product]);

  useEffect(() => {
    if (!product?._id) return;
    trackViewItem(product);
    trackViewContent(product);
    trackTikTokViewContent(product);
  }, [product?._id]);

  useEffect(() => {
    if (!product?._id) return;
    setReviewLoading(true);
    api.get(`/products/${product._id}/reviews`).then(({ data }) => {
      const r = data?.data ?? data;
      setReviews(r || { reviews: [], total: 0, page: 1, totalPages: 0 });
    }).catch(() => setReviews({ reviews: [], total: 0, page: 1, totalPages: 0 })).finally(() => setReviewLoading(false));
  }, [product?._id]);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => setStickyVisible(!e.isIntersecting),
      { threshold: 0 }
    );
    if (mainCtaRef.current) ob.observe(mainCtaRef.current);
    return () => ob.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') setShareUrl(window.location.href);
  }, []);

  const handleAddToCart = async () => {
    if (outOfStock || addState !== 'idle') return;
    setAddState('loading');
    try {
      await addItem(product._id, quantity);
      trackAddToCart(product, quantity);
      trackFbAddToCart(product, quantity);
      trackTikTokAddToCart(product, quantity);
    } finally {
      setAddState('idle');
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareUrl);
    toast('Link copied', 'success');
  };

  const starBreakdown = [5, 4, 3, 2, 1].map((s) => {
    const count = reviews.reviews?.filter((r) => r.rating === s).length ?? 0;
    const pct = reviews.total > 0 ? (count / reviews.total) * 100 : 0;
    return { stars: s, count, pct };
  });

  return (
    <div className="pb-24 lg:pb-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: product?.name,
            image: product?.images,
            description: product?.description?.slice(0, 160),
            sku: product?.sku,
            offers: {
              '@type': 'Offer',
              price: displayPrice,
              priceCurrency: 'NGN',
              availability: outOfStock ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
            },
            aggregateRating: product?.ratings?.count > 0 ? {
              '@type': 'AggregateRating',
              ratingValue: product?.ratings?.average,
              reviewCount: product?.ratings?.count,
            } : undefined,
          }),
        }}
      />
      <div className="lg:flex lg:gap-12 lg:px-10 max-w-7xl mx-auto">
        <div className="lg:w-[60%]">
          <div className="lg:hidden overflow-x-auto snap-x snap-mandatory flex scrollbar-hide -mx-4 px-4">
            {(product?.images || []).map((img, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[85vw] sm:w-[75vw] aspect-square snap-center"
                onClick={() => setMainImage(img)}
              >
                <Image
                  src={img}
                  alt={`${product.name} ${i + 1}`}
                  width={600}
                  height={600}
                  sizes="(max-width: 640px) 85vw, 75vw"
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
          <div className="hidden lg:block">
            <div className="aspect-square max-w-xl relative overflow-hidden rounded-lg bg-bg-alt mb-4">
              {mainImage && (
                <Image
                  src={mainImage}
                  alt={product.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 576px"
                  className="object-cover"
                  priority
                />
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto">
              {(product?.images || []).map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMainImage(img)}
                  className={cn(
                    'flex-shrink-0 w-20 h-20 rounded overflow-hidden border-2',
                    mainImage === img ? 'border-accent' : 'border-transparent'
                  )}
                >
                  <Image src={img} alt="" width={80} height={80} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:w-[40%] px-4 lg:px-0 lg:sticky lg:top-24 lg:self-start">
          <nav className="text-xs text-text-muted mt-4 lg:mt-0 flex gap-1 flex-wrap">
            <Link href="/" className="hover:text-accent">Home</Link>
            {product?.category?.slug && (
              <>
                <span>/</span>
                <Link href={`/categories/${product.category.slug}`} className="hover:text-accent">
                  {product.category.name}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-primary">{product?.name}</span>
          </nav>
          {product?.category && (
            <Badge variant="accent" className="mt-2">
              {product.category.name}
            </Badge>
          )}
          <h1 className="font-display font-semibold text-[1.75rem] lg:text-[2.25rem] text-primary mt-2">
            {product?.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <StarRating
              rating={product?.ratings?.average ?? 0}
              count={product?.ratings?.count ?? 0}
              size="sm"
            />
            <Link
              href="#reviews"
              className="text-xs text-accent hover:underline"
            >
              Write a Review
            </Link>
          </div>
          <div className="mt-4">
            <PriceDisplay
              price={displayPrice}
              compareAtPrice={comparePrice}
              size="lg"
            />
          </div>
          <div className="mt-4">
            {outOfStock ? (
              <span className="text-error font-medium">Out of Stock</span>
            ) : lowStock ? (
              <span className="text-warning font-medium">Only {stock} left!</span>
            ) : (
              <span className="text-success font-medium">In Stock</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 rounded border border-border flex items-center justify-center disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="w-12 text-center font-medium">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="w-10 h-10 rounded border border-border flex items-center justify-center disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
          <div ref={mainCtaRef} className="mt-6">
            <Button
              variant="accent"
              size="lg"
              fullWidth
              className="lg:w-[280px]"
              onClick={handleAddToCart}
              disabled={outOfStock || addState === 'loading'}
              loading={addState === 'loading'}
            >
              Add to Cart
            </Button>
            <button
              type="button"
              onClick={() => toggle(product._id)}
              className="mt-3 flex items-center gap-2 text-sm text-text-muted hover:text-accent"
            >
              <svg
                className="w-5 h-5"
                fill={inWishlist ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {inWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </button>
            <div className="flex gap-4 mt-4">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(shareUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-text-muted hover:text-accent"
                aria-label="Share on WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
              <button type="button" onClick={handleCopyLink} className="text-text-muted hover:text-accent" aria-label="Copy link">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {stickyVisible && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border p-4 flex items-center gap-4">
          <div className="font-display font-semibold text-lg">₦{displayPrice?.toLocaleString()}</div>
          <Button variant="accent" size="lg" className="flex-1" onClick={handleAddToCart} disabled={outOfStock}>
            Add to Cart
          </Button>
        </div>
      )}

      <div className="px-4 lg:px-10 mt-12 max-w-4xl">
        <div className="flex border-b border-border">
          {['description', 'reviews'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-6 py-3 font-medium capitalize border-b-2 -mb-px transition-colors',
                activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-muted'
              )}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 'description' && (
          <div className="py-8 text-body leading-[1.7]" dangerouslySetInnerHTML={{ __html: product?.description?.replace(/\n/g, '<br />') || '' }} />
        )}
        {activeTab === 'reviews' && (
          <div id="reviews" className="py-8">
            <div className="flex items-center gap-6 mb-8">
              <div className="text-4xl font-display font-semibold">{product?.ratings?.average?.toFixed(1) || '0'}</div>
              <div>
                <StarRating rating={product?.ratings?.average ?? 0} count={product?.ratings?.count ?? 0} size="md" />
                <p className="text-sm text-text-muted mt-1">{reviews.total} reviews</p>
              </div>
              <div className="flex-1 space-y-1">
                {starBreakdown.map(({ stars, count, pct }) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-sm w-12">{stars} star</span>
                    <div className="flex-1 h-2 bg-bg-alt rounded-full overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-text-muted w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6">
              {reviews.reviews?.map((r) => (
                <div key={r._id} className="border-b border-border pb-6">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.userId?.name?.split(' ')[0]} {r.userId?.name?.split(' ')[1]?.[0] || ''}.</span>
                    <span className="text-xs text-text-muted">{new Date(r.createdAt).toLocaleDateString()}</span>
                    <StarRating rating={r.rating} size="sm" />
                  </div>
                  <p className="mt-2 text-body">{r.comment}</p>
                </div>
              ))}
            </div>
            {accessToken && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!reviewForm.rating || !reviewForm.comment.trim() || reviewSubmitting) return;
                  setReviewSubmitting(true);
                  try {
                    await api.post(`/products/${product._id}/reviews`, {
                      rating: reviewForm.rating,
                      comment: reviewForm.comment.trim(),
                    });
                    const { data } = await api.get(`/products/${product._id}/reviews`);
                    const r = data?.data ?? data;
                    setReviews(r || { reviews: [], total: 0, page: 1, totalPages: 0 });
                    setReviewForm({ rating: 0, comment: '' });
                    toast('Review submitted', 'success');
                  } catch (err) {
                    toast(err.response?.data?.message || 'Failed to submit review', 'error');
                  } finally {
                    setReviewSubmitting(false);
                  }
                }}
                className="mt-8 p-6 border border-border rounded-lg"
              >
                <h3 className="font-display font-semibold mb-4">Write a Review</h3>
                <div className="flex gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewForm((f) => ({ ...f, rating: s }))}
                      className={cn(
                        'w-10 h-10 rounded flex items-center justify-center transition-colors',
                        reviewForm.rating >= s ? 'text-accent' : 'text-border hover:text-accent/70'
                      )}
                    >
                      <svg className="w-6 h-6" fill={reviewForm.rating >= s ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </button>
                  ))}
                </div>
                <textarea
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Share your thoughts..."
                  rows={4}
                  className="w-full px-4 py-3 border border-border rounded-lg bg-surface text-primary placeholder:text-text-muted resize-none"
                  required
                />
                <Button type="submit" variant="accent" className="mt-4" disabled={reviewSubmitting || !reviewForm.rating}>
                  Submit Review
                </Button>
              </form>
            )}
          </div>
        )}
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 px-4 lg:px-10">
          <h2 className="font-display font-semibold text-heading-2 mb-6">You May Also Like</h2>
          <div className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-6">
            {relatedProducts.map((p, i) => (
              <div key={p._id} className="flex-shrink-0 w-64 snap-center lg:flex-shrink lg:w-auto">
                <ProductCard product={p} index={i} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
