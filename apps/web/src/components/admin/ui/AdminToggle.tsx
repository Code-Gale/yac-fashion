'use client';

import { cn } from '@/lib/utils';

export function AdminToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative w-14 h-8 rounded-full transition-colors duration-200 shrink-0',
          checked ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-surface-3)]'
        )}
      >
        <span
          className={cn(
            'absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'left-7' : 'left-1'
          )}
        />
      </button>
      {label && <span className="text-sm text-[var(--admin-text)]">{label}</span>}
    </div>
  );
}
