'use client';

import { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductCard } from '@/components/shared/ProductCard';
import { cn } from '@/lib/utils';

export function FeaturedProducts({ products }) {
  const sectionRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const ob = new IntersectionObserver(
      ([e]) => setVisible(e.isIntersecting),
      { threshold: 0.1 }
    );
    if (sectionRef.current) ob.observe(sectionRef.current);
    return () => ob.disconnect();
  }, []);

  if (!products?.length) return null;

  return (
    <section
      ref={sectionRef}
      className="home-section px-6 lg:px-16 xl:px-24 bg-[#fafaf8]"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 lg:mb-14">
          <div>
            <p className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-medium mb-2">Curated for you</p>
            <h2 className="font-display font-semibold text-[2rem] lg:text-[2.75rem] text-[#1a1a2e] leading-tight">
              Featured Pieces
            </h2>
            <p className="text-[#6b7280] text-base mt-2 max-w-xl">
              Handpicked selections from our latest collection
            </p>
          </div>
          <Link
            href="/shop?featured=true"
            className="text-[#1a1a2e] font-medium text-sm hover:text-[#c9a84c] transition-colors inline-flex items-center gap-2 group shrink-0"
          >
            View all
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div
          className={cn(
            'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8',
            visible && 'opacity-100'
          )}
        >
          {products.map((p, i) => (
            <div
              key={p._id}
              className={cn(visible && 'animate-fade-up')}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
