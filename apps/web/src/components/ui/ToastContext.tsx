'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';

type ToastVariant = 'success' | 'error' | 'info';

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number;
  progress: number;
  undo?: () => void;
};

const ToastContext = createContext<{
  toast: (message: string, variant?: ToastVariant, options?: { undo?: () => void }) => void;
} | null>(null);

const MAX_TOASTS = 3;
const DEFAULT_DURATION = 4000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const progressRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  const removeToast = useCallback((id: string) => {
    timersRef.current.get(id) && clearTimeout(timersRef.current.get(id)!);
    progressRef.current.get(id) && clearInterval(progressRef.current.get(id)!);
    timersRef.current.delete(id);
    progressRef.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, variant: ToastVariant = 'info', options?: { undo?: () => void }) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const duration = options?.undo ? 6000 : DEFAULT_DURATION;

      setToasts((prev) => {
        const next = [...prev, { id, message, variant, duration, progress: 100, undo: options?.undo }];
        return next.slice(-MAX_TOASTS);
      });

      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);

      const start = Date.now();
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.max(0, 100 - (elapsed / duration) * 100);
        setToasts((prev) =>
          prev.map((t) => (t.id === id ? { ...t, progress: p } : t))
        );
      }, 50);
      progressRef.current.set(id, progressInterval);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed z-[100] bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-[380px] flex flex-col gap-3 pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto">
          {toasts.map((t) => (
            <ToastItem key={t.id} {...t} onClose={() => removeToast(t.id)} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  id,
  message,
  variant,
  progress,
  undo,
  onClose,
}: Toast & { onClose: () => void }) {
  const borderColor =
    variant === 'success'
      ? 'border-l-success'
      : variant === 'error'
      ? 'border-l-error'
      : 'border-l-accent';

  const handleUndo = () => {
    undo?.();
    onClose();
  };

  return (
    <div
      role="alert"
      className={`relative flex items-center gap-3 p-4 bg-surface rounded-lg shadow-lg border-l-4 ${borderColor} animate-slide-in`}
    >
      <p className="flex-1 text-body text-text">{message}</p>
      {undo && (
        <button
          type="button"
          onClick={handleUndo}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center px-3 py-2 text-sm font-medium text-accent hover:bg-accent-light rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Undo
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center p-1 -m-1 rounded hover:bg-bg-alt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Dismiss"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-b-lg opacity-30"
        style={{
          width: `${progress}%`,
          backgroundColor: 'var(--color-text)',
          transition: 'width 50ms linear',
        }}
      />
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
