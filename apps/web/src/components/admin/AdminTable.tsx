'use client';

import { cn } from '@/lib/utils';
import { AdminMobileCard } from './ui/AdminMobileCard';

type Column<T> = {
  key: string;
  label: string;
  render: (row: T, index?: number) => React.ReactNode;
  width?: string;
  hideOnMobile?: boolean;
};

export function AdminTable<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  loading,
  emptyMessage = 'No data',
  onRowClick,
  keyField = '_id',
  mobileCardRender,
}: {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  keyField?: string;
  mobileCardRender?: (row: T, index: number) => React.ReactNode;
}) {
  if (loading) {
    return (
      <>
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--admin-border)]">
                {columns.map((c) => (
                  <th key={c.key} className={cn('text-left py-3 px-4 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider', c.hideOnMobile && 'hidden lg:table-cell')} style={c.width ? { width: c.width } : undefined}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--admin-border)]">
                  {columns.map((c) => (
                    <td key={c.key} className={cn('py-4 px-4', c.hideOnMobile && 'hidden lg:table-cell')}>
                      <div className="admin-skeleton h-4 rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="lg:hidden space-y-3 p-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="admin-skeleton h-20 rounded-2xl" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      </>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-14 px-4 text-center">
        <p className="text-[var(--admin-text-muted)] text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--admin-border)]">
              {columns.map((c) => (
                <th key={c.key} className={cn('text-left py-3 px-4 text-xs font-semibold text-[var(--admin-text-muted)] uppercase tracking-wider', c.hideOnMobile && 'hidden lg:table-cell')} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-[var(--admin-border)] transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-white/[0.03]'
                )}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('py-3 px-4', c.hideOnMobile && 'hidden lg:table-cell')}>
                    {c.render(row, idx)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {mobileCardRender && (
        <div className="lg:hidden space-y-3 p-3">
          {data.map((row, idx) => (
            <div key={String(row[keyField])}>
              {mobileCardRender(row, idx)}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export { AdminMobileCard };
