'use client';

import { cn } from '@/lib/utils';

export function EmptyState({
  icon,
  heading,
  description,
  action,
  className = '',
}: {
  icon?: React.ReactNode;
  heading: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center bg-bg-alt/50 rounded-lg',
        className
      )}
    >
      {icon && (
        <div className="w-16 h-16 mb-4 text-text-muted flex items-center justify-center">
          {icon}
        </div>
      )}
      <h3 className="text-heading-3 font-display text-primary mb-2">{heading}</h3>
      {description && (
        <p className="text-body text-text-muted max-w-sm mb-6">{description}</p>
      )}
      {action}
    </div>
  );
}
