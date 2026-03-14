'use client';

import { cn } from '@/lib/utils';

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  const showPrev = currentPage > 1;
  const showNext = currentPage < totalPages;

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | 'ellipsis')[] = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 'ellipsis', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, 'ellipsis', currentPage, 'ellipsis', totalPages);
    }
    return pages;
  };

  return (
    <nav
      className={cn('flex items-center justify-center gap-2', className)}
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!showPrev}
        className="p-2 rounded-md hover:bg-bg-alt disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Previous page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <div className="hidden sm:flex items-center gap-1">
        {getPageNumbers().map((p, i) =>
          p === 'ellipsis' ? (
            <span key={`ellipsis-${i}`} className="px-2 text-text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-[36px] h-9 px-3 rounded-md font-medium transition-colors',
                currentPage === p
                  ? 'bg-primary text-white'
                  : 'hover:bg-bg-alt text-text'
              )}
            >
              {p}
            </button>
          )
        )}
      </div>
      <span className="sm:hidden text-small text-text-muted">
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!showNext}
        className="p-2 rounded-md hover:bg-bg-alt disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        aria-label="Next page"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </nav>
  );
}
