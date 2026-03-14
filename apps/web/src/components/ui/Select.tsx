'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
    helperText?: string;
  }
>(function Select({ label, error, helperText, className = '', ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-label text-text-muted mb-1.5">
          {label}
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          'h-11 w-full border rounded-md px-4 font-body text-base bg-surface',
          'transition-colors duration-150',
          'focus:outline-none focus:border-primary focus:ring-0',
          error
            ? 'border-error focus:border-error'
            : 'border-border hover:border-border-strong',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? 'select-error' : helperText ? 'select-helper' : undefined
        }
        {...props}
      />
      {error && (
        <p id="select-error" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id="select-helper" className="mt-1.5 text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});
