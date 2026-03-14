'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/shared/ProductCard';
import { cn } from '@/lib/utils';

function Countdown({ endsAt }) {
  const [left, setLeft] = useState({ h: 0, m: 0, s: 0 });

  useEffect(() => {
    const update = () => {
      const end = new Date(endsAt).getTime();
      const now = Date.now();
      if (now >= end) {
        setLeft({ h: 0, m: 0, s: 0 });
        return;
      }
      const d = Math.floor((end - now) / 1000);
      setLeft({
        h: Math.floor(d / 3600),
        m: Math.floor((d % 3600) / 60),
        s: d % 60,
      });
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  const pad = (n) => String(n).padStart(2, '0');
  return (
    <span className="font-mono text-xl lg:text-2xl font-semibold tabular-nums">
      {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
    </span>
  );
}

export function FlashSaleStrip({ products }) {
  const endAt = products[0]?.flashSaleEndsAt;

  if (!products?.length) return null;

  return (
    <section className="py-16 lg:py-24 bg-[#0f0f1a] text-white relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `repeating-linear-gradient(
            -45deg,
            transparent,
            transparent 30px,
            rgba(201,168,76,0.5) 30px,
            rgba(201,168,76,0.5) 60px
          )`,
        }}
      />
      <div className="relative px-6 lg:px-16 xl:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-[#c9a84c]/20 flex items-center justify-center">
                <span className="text-2xl" aria-hidden>🔥</span>
              </div>
              <div>
                <h2 className="font-display font-semibold text-2xl lg:text-3xl">
                  Flash Sale
                </h2>
                <p className="text-white/75 text-sm mt-4">
                  Limited time offers — don&apos;t miss out
                </p>
              </div>
            </div>
            {endAt && (
              <div className="flex items-center gap-3">
                <span className="text-white/75 text-sm uppercase tracking-wider">Ends in</span>
                <Countdown endsAt={endAt} />
              </div>
            )}
          </div>
          <div
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-hide -mx-6 px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((p, i) => (
              <div key={p._id} className="flex-shrink-0 w-72 snap-center lg:flex-shrink">
                <ProductCard product={p} variant="flash" index={i} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
