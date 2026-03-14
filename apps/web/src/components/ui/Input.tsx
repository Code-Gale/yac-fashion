'use client';

import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    error?: string;
    helperText?: string;
  }
>(function Input({ label, error, helperText, className = '', ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-label text-text-muted mb-1.5">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          'h-11 w-full border rounded-md px-4 font-body text-base',
          'transition-colors duration-150',
          'focus:outline-none focus:border-primary focus:ring-0',
          error
            ? 'border-error focus:border-error'
            : 'border-border hover:border-border-strong',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? 'input-error' : helperText ? 'input-helper' : undefined
        }
        {...props}
      />
      {error && (
        <p id="input-error" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id="input-helper" className="mt-1.5 text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});
