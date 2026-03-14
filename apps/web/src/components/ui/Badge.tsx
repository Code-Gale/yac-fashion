'use client';

import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-bg-alt text-text',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-error/10 text-error',
  info: 'bg-primary/10 text-primary',
  accent: 'bg-accent-light text-accent',
};

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
