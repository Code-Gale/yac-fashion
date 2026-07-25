'use client';

import { cn } from '@/lib/utils';

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
  mobileCardRender?: (row: T, index?: number) => React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((c) => (
                <th key={c.key} className={cn('text-left py-3 px-4 text-xs font-medium text-[#8b92a5] uppercase tracking-wider', c.hideOnMobile && 'hidden lg:table-cell')} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-white/10 animate-pulse">
                {columns.map((c) => (
                  <td key={c.key} className={cn('py-4 px-4', c.hideOnMobile && 'hidden lg:table-cell')}>
                    <div className="h-4 bg-white/10 rounded w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center text-[#8b92a5]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((c) => (
                <th key={c.key} className={cn('text-left py-3 px-4 text-xs font-medium text-[#8b92a5] uppercase tracking-wider', c.hideOnMobile && 'hidden lg:table-cell')} style={c.width ? { width: c.width } : undefined}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr
                key={String(row[keyField])}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'border-b border-white/10 transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-white/5'
                )}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn('py-3 px-4', c.hideOnMobile && 'hidden lg:table-cell')}>
                    {c.render(row, data.indexOf(row))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden space-y-4">
        {data.map((row, i) => (
          <div key={String(row[keyField])}>
            {mobileCardRender
              ? mobileCardRender(row, i)
              : (
                <div
                  onClick={() => onRowClick?.(row)}
                  className={cn('bg-[#222634] rounded-lg p-4 border border-white/10 space-y-2', onRowClick && 'cursor-pointer active:bg-white/5')}
                >
                  {columns.filter((c) => c.label).map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-[#8b92a5] flex-shrink-0">{c.label}</span>
                      <span className="text-right min-w-0">{c.render(row, i)}</span>
                    </div>
                  ))}
                </div>
              )}
          </div>
        ))}
      </div>
    </>
  );
}
