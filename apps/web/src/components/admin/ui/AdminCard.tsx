'use client';

import { cn } from '@/lib/utils';

export function AdminCard({
  children,
  className,
  padding = true,
  animate = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
  animate?: boolean;
}) {
  return (
    <div className={cn('admin-card', padding && 'admin-card-padded', animate && 'admin-animate-in', className)}>
      {children}
    </div>
  );
}

export function AdminStatCard({
  label,
  value,
  icon,
  change,
  tone = 'accent',
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  change?: { value: number; positive: boolean };
  tone?: 'accent' | 'success' | 'warning' | 'info';
}) {
  return (
    <div className={cn('admin-stat-card', `admin-stat-${tone}`)}>
      <div className="flex items-center gap-3 mb-2">
        {icon && <div className="admin-stat-icon">{icon}</div>}
        <span className="admin-stat-label">{label}</span>
      </div>
      <p className="admin-stat-value">{value}</p>
      {change != null && (
        <span className={cn('admin-stat-change', change.positive ? 'text-[var(--admin-success)]' : 'text-[var(--admin-error)]')}>
          {change.positive ? '↑' : '↓'}{Math.abs(change.value).toFixed(1)}%
        </span>
      )}
    </div>
  );
}

export function AdminPanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('admin-panel', className)}>{children}</div>;
}
