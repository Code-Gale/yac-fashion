'use client';

import { AdminButton } from './AdminButton';

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="admin-pagination">
      <AdminButton
        variant="secondary"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Previous
      </AdminButton>
      <span className="admin-pagination-info">
        {page} / {totalPages}
      </span>
      <AdminButton
        variant="secondary"
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
      >
        Next
      </AdminButton>
    </div>
  );
}
