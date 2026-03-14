'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const MARQUEE_TEXT =
  'FREE DELIVERY ON ORDERS OVER ₦50,000 · YAC FASHION HOUSE · NEW ARRIVALS EVERY WEEK';

export function AnnouncementBar() {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setDismissed(sessionStorage.getItem('yac-announcement-dismissed') === '1');
  }, []);

  const handleClose = () => {
    setDismissed(true);
    sessionStorage.setItem('yac-announcement-dismissed', '1');
  };

  if (dismissed) return null;

  return (
    <div className="relative bg-primary text-white text-xs text-center py-2 overflow-hidden">
      <div className="lg:hidden animate-marquee whitespace-nowrap">
        <span className="inline-block pr-8">{MARQUEE_TEXT}</span>
        <span className="inline-block pr-8">{MARQUEE_TEXT}</span>
      </div>
      <div className="hidden lg:block">{MARQUEE_TEXT}</div>
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded"
        aria-label="Close announcement"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
