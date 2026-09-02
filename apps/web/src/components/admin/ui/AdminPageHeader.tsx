'use client';

import { cn } from '@/lib/utils';

export function AdminPageHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('admin-page-header', className)}>
      <div className="min-w-0 flex-1">
        <h1 className="admin-page-title">{title}</h1>
        {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="admin-page-action shrink-0">{action}</div>}
    </div>
  );
}
