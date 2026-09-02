'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning';

const variants: Record<Variant, string> = {
  primary: 'admin-btn admin-btn-primary',
  secondary: 'admin-btn admin-btn-secondary',
  ghost: 'admin-btn admin-btn-ghost',
  danger: 'admin-btn admin-btn-danger',
  success: 'admin-btn admin-btn-success',
  warning: 'admin-btn admin-btn-warning',
};

type Props = {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
  href?: string;
  type?: 'button' | 'submit';
  onClick?: () => void;
  fullWidth?: boolean;
};

export function AdminButton({
  variant = 'primary',
  className,
  children,
  disabled,
  href,
  type = 'button',
  onClick,
  fullWidth,
}: Props) {
  const cls = cn(variants[variant], fullWidth && 'w-full', className);

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} disabled={disabled} onClick={onClick}>
      {children}
    </button>
  );
}
