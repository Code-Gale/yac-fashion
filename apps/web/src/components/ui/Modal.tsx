'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export function Modal({
  open,
  onClose,
  title,
  children,
  className = '',
  variant = 'light',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, handleKeyDown]);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center lg:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
        style={{ animation: 'adminFadeIn 0.25s ease-out' }}
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full max-w-lg rounded-t-2xl lg:rounded-2xl',
          'max-h-[92dvh] overflow-y-auto',
          'lg:mx-4',
          variant === 'dark'
            ? 'bg-[var(--admin-surface,#141820)] border border-[var(--admin-border)] text-[var(--admin-text)] animate-slide-in lg:animate-fade-up'
            : 'bg-surface animate-slide-in lg:animate-fade-up',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className={cn('flex items-center justify-between p-4 lg:p-6 border-b', variant === 'dark' ? 'border-[rgba(255,255,255,0.08)]' : 'border-border')}>
            <h2
              id="modal-title"
              className={cn('text-heading-3 font-display', variant === 'dark' ? 'text-[#f0f0f0]' : 'text-primary')}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={cn('p-2 -m-2 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent', variant === 'dark' ? 'hover:bg-white/5' : 'hover:bg-bg-alt')}
              aria-label="Close"
            >
              <svg
                className={cn('w-5 h-5', variant === 'dark' ? 'text-[#8b92a5]' : 'text-text-muted')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
        <div className="p-4 lg:p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
