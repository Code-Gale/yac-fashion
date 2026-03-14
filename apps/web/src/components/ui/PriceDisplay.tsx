'use client';

import { cn } from '@/lib/utils';

export function PriceDisplay({
  price,
  compareAtPrice,
  size = 'md',
  className = '',
}: {
  price?: number;
  compareAtPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  if (price === undefined || price === null) return null;
  const discount =
    compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice > price
      ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
      : 0;

  const sizeClass =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
      ? 'text-xl'
      : 'text-lg';

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className={cn('font-display font-semibold text-primary', sizeClass)}>
        ₦{price.toLocaleString()}
      </span>
      {compareAtPrice !== undefined && compareAtPrice !== null && compareAtPrice > price && (
        <>
          <span className="text-small text-text-muted line-through">
            ₦{compareAtPrice.toLocaleString()}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-error/10 text-error font-medium">
            −{discount}%
          </span>
        </>
      )}
    </div>
  );
}
