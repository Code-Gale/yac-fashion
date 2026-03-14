'use client';

import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  accent: 'bg-accent text-white hover:bg-accent-hover',
  outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-primary hover:bg-bg-alt',
  danger: 'bg-error text-white hover:bg-error/90',
};

const sizes = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-5 text-sm',
  lg: 'h-12 px-8 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  className = '',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-md transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
        'active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          <span className="opacity-80">{children}</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
