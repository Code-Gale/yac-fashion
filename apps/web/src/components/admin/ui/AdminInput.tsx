'use client';

import { cn } from '@/lib/utils';

export function AdminInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('admin-input', className)} {...props} />;
}

export function AdminSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn('admin-input admin-select', className)} {...props}>
      {children}
    </select>
  );
}

export function AdminTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('admin-input admin-textarea', className)} {...props} />;
}

export function AdminLabel({
  children,
  className,
  required,
}: {
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <label className={cn('admin-label', className)}>
      {children}
      {required && <span className="text-[var(--admin-error)] ml-0.5">*</span>}
    </label>
  );
}

export function AdminField({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <AdminLabel required={required}>{label}</AdminLabel>
      {children}
    </div>
  );
}
