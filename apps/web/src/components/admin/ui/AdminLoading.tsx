'use client';

export function AdminLoading({ className }: { className?: string }) {
  return (
    <div className={className ?? 'flex items-center justify-center min-h-[280px]'}>
      <div className="admin-spinner" aria-label="Loading" />
    </div>
  );
}

export function AdminPageSkeleton() {
  return (
    <div className="space-y-4 admin-animate-in">
      <div className="h-8 w-40 admin-skeleton rounded-lg" />
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="admin-skeleton h-28 rounded-2xl" />
        ))}
      </div>
      <div className="admin-skeleton h-48 rounded-2xl" />
    </div>
  );
}
