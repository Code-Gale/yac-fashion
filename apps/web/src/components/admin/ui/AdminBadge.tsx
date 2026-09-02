'use client';

import { cn } from '@/lib/utils';
import { STATUS_COLORS } from './constants';

type Tone = 'success' | 'error' | 'warning' | 'info' | 'muted' | 'accent';

const toneClasses: Record<Tone, string> = {
  success: 'admin-badge-success',
  error: 'admin-badge-error',
  warning: 'admin-badge-warning',
  info: 'admin-badge-info',
  muted: 'admin-badge-muted',
  accent: 'admin-badge-accent',
};

export function AdminBadge({
  children,
  tone = 'muted',
  color,
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  color?: string;
  className?: string;
}) {
  if (color) {
    return (
      <span
        className={cn('admin-badge', className)}
        style={{ backgroundColor: `${color}22`, color }}
      >
        {children}
      </span>
    );
  }
  return <span className={cn('admin-badge', toneClasses[tone], className)}>{children}</span>;
}

export function AdminStatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return <AdminBadge color={color}>{status}</AdminBadge>;
}

export function AdminStockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <AdminBadge tone="error">Out of Stock</AdminBadge>;
  if (stock <= 5) return <AdminBadge tone="error">{stock}</AdminBadge>;
  if (stock <= 10) return <AdminBadge tone="warning">{stock}</AdminBadge>;
  return <AdminBadge tone="success">{stock}</AdminBadge>;
}
