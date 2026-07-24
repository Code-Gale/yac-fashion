'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { StarRating } from '@/components/ui/StarRating';
import { api } from '@/lib/api';

export function TestimonialsBlock() {
  const [reviews, setReviews] = useState(null);
    
  useEffect(() => {
    api
      .get('/reviews/featured')
      .then(({ data }) => {
        const list = data?.data ?? data ?? [];
        setReviews(Array.isArray(list) ? list : []);
      })
      .catch(() => setReviews([]));
  }, []);

      // Only real, verified-purchase reviews are shown here — nothing
  // fabricated. If there aren't at least a handful yet, skip the section
  // rather than show a sparse/empty-looking block.
  if (!reviews || reviews.length < 3) return null;

  return (
    <section className="home-section px-6 lg:px-16 xl:px-24 bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 lg:mb-14">
          <p className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-medium mb-2">
                Verified Reviews
          </p>
          <h2 className="font-display font-semibold text-[2rem] lg:text-[2.75rem] text-[#1a1a2e] leading-tight">
            Loved by Our Customers
          </h2>
        </div>
        <div className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:gap-8">
          {reviews.slice(0, 6).map((r) => (
            <div
              key={r._id}
                  className="flex-shrink-0 w-[85vw] sm:w-96 lg:w-auto snap-center bg-white rounded-xl border border-[#e8e6e1] p-6 lg:p-8 flex flex-col"
            >
              <StarRating rating={r.rating} size="sm" />
              <p className="text-[#1a1a2e] text-base leading-relaxed mt-4 flex-1 line-clamp-5">
                &ldquo;{r.comment}&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[#e8e6e1]">
                {r.product?.image && (
                  <Link href={`/products/${r.product.slug}`} className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#f4f2ee] flex-shrink-0">
                        <Image src={r.product.image} alt="" fill sizes="40px" className="object-cover" />
                  </Link>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-[#1a1a2e] text-sm">{r.customerName}</p>
                  {r.product?.slug ? (
                    <Link href={`/products/${r.product.slug}`} className="text-xs text-[#6b7280] hover:text-[#c9a84c] truncate block">
                      {r.product.name}
                    </Link>
                  ) : (
                    <p className="text-xs text-[#6b7280]">Verified Purchase</p>
                      )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
