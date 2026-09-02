'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { AdminIcon } from './AdminIcons';

export function AdminFab({
  href,
  onClick,
  label = 'Add',
  icon = 'plus',
}: {
  href?: string;
  onClick?: () => void;
  label?: string;
  icon?: string;
}) {
  const cls = 'admin-fab';
  const content = (
    <>
      <AdminIcon name={icon} className="w-6 h-6" />
      <span className="sr-only">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls} aria-label={label}>
      {content}
    </button>
  );
}

export function AdminStickyBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('admin-sticky-bar lg:hidden', className)}>{children}</div>;
}

export function AdminModalActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('admin-modal-actions', className)}>{children}</div>;
}
