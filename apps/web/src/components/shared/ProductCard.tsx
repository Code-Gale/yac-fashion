'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { PriceDisplay } from '@/components/ui/PriceDisplay';
import { cn } from '@/lib/utils';
import { trackAddToCart } from '@/lib/analytics';
import { trackAddToCart as trackFbAddToCart } from '@/lib/fbPixel';
import { trackAddToCart as trackTikTokAddToCart } from '@/lib/tiktokPixel';

export function ProductCard({
  product,
  variant = 'default',
  index = 0,
  onWishlistRemove,
}: {
  product: {
    _id: string;
    slug: string;
    name?: string;
    price?: number;
    compareAtPrice?: number;
    flashSalePrice?: number;
    flashSaleEndsAt?: Date | string;
    images?: string[];
    category?: { name?: string; slug?: string };
    ratings?: { average?: number; count?: number };
    stock?: number;
  };
  variant?: 'default' | 'flash';
  index?: number;
  onWishlistRemove?: (productId: string) => Promise<void>;
}) {
  const [addState, setAddState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [isHovered, setIsHovered] = useState(false);
  const { addItem } = useCart();
  const { toggle, isInWishlist } = useWishlist();

  const primaryImage = product.images?.[0];
  const secondaryImage = product.images?.[1];
  const hasMultipleImages = product.images && product.images.length >= 2;
  const outOfStock = (product.stock ?? 0) <= 0;
  const displayPrice = (variant === 'flash' && product.flashSalePrice != null
    ? product.flashSalePrice
    : product.price) ?? 0;
  const comparePrice = variant === 'flash' && product.flashSalePrice != null
    ? product.price
    : product.compareAtPrice;
  const discount = comparePrice && displayPrice != null && comparePrice > displayPrice
    ? Math.round(((comparePrice - displayPrice) / comparePrice) * 100)
    : 0;
  const inWishlist = isInWishlist(product._id);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || addState !== 'idle') return;
    setAddState('loading');
    try {
      await addItem(product._id, 1);
      trackAddToCart(product, 1);
      trackFbAddToCart(product, 1);
      trackTikTokAddToCart(product, 1);
      setAddState('success');
      setTimeout(() => setAddState('idle'), 2000);
    } catch (_) {
      setAddState('idle');
    }
  };

  const handleWishlistClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onWishlistRemove && inWishlist) {
      await onWishlistRemove(product._id);
      return;
    }
    toggle(product._id);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'block bg-surface rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-250',
        'animate-fade-up'
      )}
      style={{ animationDelay: `${index * 60}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square overflow-hidden relative bg-bg-alt group">
        {primaryImage && (
          <Image
            src={primaryImage}
            alt={product.name || 'Product'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
            className={cn(
              'object-cover transition-transform duration-400',
              isHovered && 'scale-105'
            )}
          />
        )}
        {hasMultipleImages && secondaryImage && (
          <Image
            src={secondaryImage}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
            className={cn(
              'object-cover absolute inset-0 transition-opacity duration-300',
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
          />
        )}
        {outOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white/90 text-primary text-sm font-medium px-3 py-1.5 rounded-full">
              Out of Stock
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={handleWishlistClick}
          className={cn(
            'absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center transition-transform',
            'hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
            inWishlist && 'scale-110'
          )}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            className={cn('w-4 h-4 transition-colors', inWishlist ? 'text-accent fill-accent' : 'text-primary')}
            fill={inWishlist ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-error text-white text-xs px-2 py-0.5 rounded-full font-medium">
            −{discount}%
          </span>
        )}
      </div>
      <div className="p-3 lg:p-4">
        {product.category?.name && (
          <p className="text-xs text-text-muted uppercase tracking-wider">
            {product.category.name}
          </p>
        )}
        <h3 className="font-display font-semibold text-sm lg:text-base text-primary line-clamp-2 mt-0.5">
          {product.name || 'Product'}
        </h3>
        <div className="mt-1">
          <StarRating
            rating={product.ratings?.average ?? 0}
            count={product.ratings?.count ?? 0}
            size="sm"
          />
        </div>
        <div className="flex items-center gap-2 mt-2">
          <PriceDisplay
            price={displayPrice}
            compareAtPrice={comparePrice}
            size="md"
          />
        </div>
        <Button
          variant="accent"
          size="sm"
          fullWidth
          className="mt-2"
          onClick={handleAddToCart}
          disabled={outOfStock || addState === 'loading'}
          loading={addState === 'loading'}
        >
          {addState === 'success' ? (
            <span className="flex items-center justify-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Added
            </span>
          ) : (
            'Add to Cart'
          )}
        </Button>
      </div>
    </Link>
  );
}
