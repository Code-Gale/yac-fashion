'use client';

import { cn } from '@/lib/utils';

export function Skeleton({
  variant = 'text',
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'text' | 'card' | 'circle';
}) {
  return (
    <div
      className={cn(
        'bg-bg-alt rounded overflow-hidden',
        'bg-gradient-to-r from-bg-alt via-border to-bg-alt bg-[length:200%_100%]',
        'animate-[shimmer_1.5s_infinite]',
        variant === 'circle' && 'rounded-full aspect-square',
        variant === 'card' && 'aspect-[3/4]',
        className
      )}
      {...props}
    />
  );
}

export function SkeletonProductCard() {
  return (
    <div className="flex flex-col">
      <Skeleton variant="card" className="w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4 mt-4" />
      <Skeleton className="h-4 w-1/2 mt-2" />
      <Skeleton className="h-5 w-16 mt-2" />
    </div>
  );
}
