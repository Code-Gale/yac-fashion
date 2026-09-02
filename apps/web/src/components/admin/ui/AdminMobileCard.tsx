'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

export function AdminMobileCard({
  children,
  href,
  onClick,
  className,
  index = 0,
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  index?: number;
}) {
  const cls = cn('admin-mobile-card', className);
  const style = { animationDelay: `${Math.min(index * 50, 300)}ms` } as React.CSSProperties;

  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {children}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cls, 'text-left w-full')} style={style}>
        {children}
      </button>
    );
  }

  return (
    <div className={cls} style={style}>
      {children}
    </div>
  );
}
