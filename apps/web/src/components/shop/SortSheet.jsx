'use client';

import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';

export function SortSheet({
  open,
  onClose,
  options = [],
  value,
  onChange,
  embedded = false,
}) {
  if (embedded) {
    return (
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="border border-border rounded-md px-3 py-2 text-sm bg-surface"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Sort by">
      <div className="space-y-0">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange?.(o.value)}
            className={cn(
              'w-full text-left py-4 px-0 border-b border-border last:border-0 font-medium',
              value === o.value ? 'text-accent' : 'text-primary'
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </Modal>
  );
}
