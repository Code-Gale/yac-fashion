'use client';

import { cn } from '@/lib/utils';

export function AdminFilterTabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cn('admin-filter-tabs scrollbar-hide', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          onClick={() => onChange(tab.value)}
          className={cn('admin-filter-tab', value === tab.value && 'admin-filter-tab-active')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
