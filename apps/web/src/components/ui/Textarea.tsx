'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    error?: string;
    helperText?: string;
  }
>(function Textarea({ label, error, helperText, className = '', ...props }, ref) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-label text-text-muted mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'min-h-[88px] w-full border rounded-md px-4 py-3 font-body text-base resize-y',
          'transition-colors duration-150',
          'focus:outline-none focus:border-primary focus:ring-0',
          error
            ? 'border-error focus:border-error'
            : 'border-border hover:border-border-strong',
          className
        )}
        aria-invalid={!!error}
        aria-describedby={
          error ? 'textarea-error' : helperText ? 'textarea-helper' : undefined
        }
        {...props}
      />
      {error && (
        <p id="textarea-error" className="mt-1.5 text-xs text-error">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id="textarea-helper" className="mt-1.5 text-xs text-text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
});
