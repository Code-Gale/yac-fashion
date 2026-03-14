'use client';

import { cn } from '@/lib/utils';

const Star = ({ filled }: { filled: boolean }) => (
  <svg
    className={cn('inline-block', filled ? 'text-accent' : 'text-border')}
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export function StarRating({
  rating,
  count,
  size = 'md',
  interactive = false,
  value,
  onChange,
  className = '',
}: {
  rating: number;
  count?: number;
  size?: 'sm' | 'md';
  interactive?: boolean;
  value?: number;
  onChange?: (v: number) => void;
  className?: string;
}) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const displayRating = value ?? rating;
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    const filled = displayRating >= i;
    stars.push(
      interactive ? (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i)}
          className={cn('p-0.5 -m-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded', sizeClass)}
          aria-label={`Rate ${i} stars`}
        >
          <Star filled={value !== undefined ? value >= i : filled} />
        </button>
      ) : (
        <span key={i} className={sizeClass}>
          <Star filled={filled} />
        </span>
      )
    );
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex">{stars}</div>
      {count != null && (
        <span className="text-xs text-text-muted ml-1">({count})</span>
      )}
    </div>
  );
}
