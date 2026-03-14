'use client';

import { useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export function CategoriesStrip({ categories }) {
  const scrollRef = useRef(null);

  if (!categories?.length) return null;

  const [featured, ...rest] = categories;
  const hasFeatured = featured && rest.length > 0;

  return (
    <section className="home-section px-6 lg:px-16 xl:px-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 lg:mb-14">
          <div>
            <p className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-medium mb-2">Browse by</p>
            <h2 className="font-display font-semibold text-[2rem] lg:text-[2.75rem] text-[#1a1a2e] leading-tight">
              Categories
            </h2>
          </div>
          <Link
            href="/categories"
            className="text-[#1a1a2e] font-medium text-sm hover:text-[#c9a84c] transition-colors inline-flex items-center gap-2 group"
          >
            View all
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div
          ref={scrollRef}
          className={cn(
            'flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0',
            hasFeatured ? 'lg:grid lg:grid-cols-12 lg:gap-6' : 'lg:grid lg:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 lg:gap-6'
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {hasFeatured ? (
            <>
              <Link
                href={`/categories/${featured.slug}`}
                className="flex-shrink-0 w-[85vw] sm:w-[400px] lg:col-span-6 lg:w-auto snap-center group"
              >
                <div className="aspect-[4/5] lg:aspect-[3/4] rounded-xl overflow-hidden relative bg-[#f4f2ee]">
                  {featured.image ? (
                    <Image
                      src={featured.image}
                      alt={featured.name}
                      fill
                      sizes="(max-width: 1024px) 85vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#1a1a2e]/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a]/80 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-8">
                    <span className="text-[#c9a84c] text-xs uppercase tracking-wider font-medium">Featured</span>
                    <h3 className="font-display font-semibold text-white text-2xl lg:text-3xl mt-1">
                      {featured.name}
                    </h3>
                    <span className="inline-flex items-center gap-2 text-white/80 text-sm mt-2 group-hover:gap-3 transition-all">
                      Shop now
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
              <div className="flex gap-4 lg:col-span-6 lg:grid lg:grid-cols-2 lg:gap-6 overflow-x-auto lg:overflow-visible scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0 snap-x snap-mandatory">
                {rest.slice(0, 4).map((cat) => (
                  <Link
                    key={cat._id || cat.slug}
                    href={`/categories/${cat.slug}`}
                    className="flex-shrink-0 w-[calc(45vw-0.5rem)] sm:w-56 lg:w-auto snap-center group"
                  >
                    <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-[#f4f2ee]">
                      {cat.image ? (
                        <Image
                          src={cat.image}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 224px, 25vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#1a1a2e]/10" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-display font-semibold text-white text-lg">{cat.name}</h3>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            categories.map((cat) => (
              <Link
                key={cat._id || cat.slug}
                href={`/categories/${cat.slug}`}
                className="flex-shrink-0 w-[calc(45vw-0.5rem)] sm:w-48 lg:flex-shrink snap-center group"
              >
                <div className="aspect-[3/4] rounded-xl overflow-hidden relative bg-[#f4f2ee]">
                  {cat.image ? (
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 640px) 45vw, 192px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#1a1a2e]/10" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <h3 className="font-display font-semibold text-white text-lg">{cat.name}</h3>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
