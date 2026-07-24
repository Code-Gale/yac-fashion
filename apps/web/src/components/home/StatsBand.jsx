'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Formats a real count for display without ever inflating it: exact
// numbers under 20 are shown as-is, larger numbers are floored to the
// nearest 10 and shown with a "+" (e.g. 47 -> "40+") so the figure never
// overstates what's actually in the database.
function formatCount(n) {
  if (!n || n <= 0) return '0';
  if (n < 20) return String(n);
      return `${Math.floor(n / 10) * 10}+`;
}

export function StatsBand() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api
      .get('/stats/homepage')
      .then(({ data }) => setStats(data?.data ?? data ?? null))
          .catch(() => setStats(null));
  }, []);

  if (!stats) return null;

  const items = [
    stats.customerCount > 0 && {
      value: formatCount(stats.customerCount),
      label: 'Happy Customers',
    },
    stats.productCount > 0 && {
          value: formatCount(stats.productCount),
      label: 'Curated Styles',
    },
    stats.statesCount > 0 && {
      value: formatCount(stats.statesCount),
      label: 'States Delivered To',
    },
    stats.reviewCount > 0 && {
      value: stats.avgRating.toFixed(1),
      label: `${formatCount(stats.reviewCount)} Reviews`,
          suffix: '★',
    },
  ].filter(Boolean);

  if (items.length < 2) return null;

  // Tailwind classes must be static strings for the compiler to pick them
  // up — can't interpolate `grid-cols-${n}` at runtime.
  const gridColsClass = { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4' }[items.length];

  return (
    <section className="border-y border-[#e8e6e1] bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-16 xl:px-24">
        <div className={`grid grid-cols-2 ${gridColsClass} divide-x divide-y lg:divide-y-0 divide-[#e8e6e1]`}>
              {items.map((item, i) => (
            <div key={i} className="py-8 lg:py-12 px-4 text-center">
              <p className="font-display font-semibold text-3xl lg:text-4xl text-[#1a1a2e]">
                {item.value}
                {item.suffix && <span className="text-[#c9a84c] ml-1">{item.suffix}</span>}
              </p>
              <p className="text-[#6b7280] text-xs lg:text-sm uppercase tracking-wider mt-2">
                {item.label}
              </p>
            </div>
          ))}
            </div>
      </div>
    </section>
  );
}
