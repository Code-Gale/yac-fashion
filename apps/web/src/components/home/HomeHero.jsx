'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const TRUST_ITEMS = [
  { icon: 'shield', label: 'Secure Checkout' },
  { icon: 'truck', label: 'Nationwide Delivery' },
  { icon: 'badge', label: '100% Authentic' },
];

function TrustIcon({ name }) {
  const cls = 'w-4 h-4 text-[#c9a84c]';
  if (name === 'shield') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
  if (name === 'truck') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 13h13V6H3v7zm13 0h2.5l2.5 3v3h-5v-6zM6 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm11 0a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg>;
  if (name === 'badge') return <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3a2 2 0 00-2 2v14l4-2 4 2 4-2 4 2V5a2 2 0 00-2-2H5zm4.5 6.5l1.5 1.5 3.5-3.5" /></svg>;
  return null;
}

function HeroTrustRow() {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-8">
      {TRUST_ITEMS.map((item) => (
        <span
          key={item.label}
          className="flex items-center gap-1.5 bg-white/10 border border-white/15 backdrop-blur-sm rounded-full pl-2.5 pr-3.5 py-1.5 text-white/90 text-[11px] sm:text-xs font-medium tracking-wide"
        >
          <TrustIcon name={item.icon} />
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function HomeHero({ banners }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const items = banners?.length > 0 ? banners : [null];
  const current = items[activeIndex];

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const t = setInterval(() => {
      setActiveIndex((i) => (i + 1) % items.length);
    }, 6000);
    return () => clearInterval(t);
  }, [paused, items.length]);

  return (
    <section
      className="relative min-h-[95svh] lg:min-h-[92vh] flex flex-col justify-end overflow-hidden"
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setTimeout(() => setPaused(false), 3000)}
    >
      {current?.imageUrl ? (
        <>
          <Image
            src={current.imageUrl}
            alt={current.title || 'Hero'}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a]/95 via-[#0f0f1a]/40 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(201,168,76,0.08),transparent)]" />
        </>
      ) : (
        <div className="absolute inset-0 bg-[#0f0f1a]">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 60px,
                rgba(201,168,76,0.15) 60px,
                rgba(201,168,76,0.15) 120px
              )`,
            }}
          />
        </div>
      )}
      <div className="relative z-10 px-6 sm:px-10 lg:px-16 xl:px-24 pb-20 lg:pb-28 pt-32">
        <div className="max-w-4xl">
          {current ? (
            <div className="animate-fade-up">
              {current.subtitle && (
                <p className="text-[#c9a84c] uppercase tracking-[0.35em] text-xs lg:text-sm font-medium mb-4">
                  {current.subtitle}
                </p>
              )}
              <h1 className="font-display font-bold text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem] xl:text-[5rem] text-white leading-[1.05] tracking-tight">
                {current.title || 'YAC Fashion House'}
              </h1>
              {current.ctaText && current.ctaText !== current.subtitle && (
                <p className="text-white/75 text-lg lg:text-xl mt-4 max-w-xl leading-relaxed">
                  {current.subtitle || 'Luxury-accessible Nigerian fashion. Timeless pieces for the modern wardrobe.'}
                </p>
              )}
              <div className="flex flex-wrap gap-4 mt-10">
                <Link href={current.ctaLink || '/shop'}>
                  <Button variant="accent" size="lg" className="min-h-[52px] px-8 text-base font-semibold rounded-sm">
                    {current.ctaText || 'Shop Now'}
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button variant="ghost" size="lg" className="min-h-[52px] px-8 text-base text-white/90 hover:bg-white/10 hover:text-white border border-white/20 rounded-sm">
                    Explore Categories
                  </Button>
                </Link>
              </div>
              <HeroTrustRow />
            </div>
          ) : (
            <div className="animate-fade-up">
              <p className="text-[#c9a84c] uppercase tracking-[0.35em] text-xs lg:text-sm font-medium mb-4">
                Nigerian Luxury Fashion
              </p>
              <h1 className="font-display font-bold text-[2.75rem] sm:text-[3.5rem] lg:text-[4.5rem] xl:text-[5rem] text-white leading-[1.05] tracking-tight">
                YAC Fashion House
              </h1>
              <p className="text-white/75 text-lg lg:text-xl mt-4 max-w-xl leading-relaxed">
                Timeless pieces crafted for the modern Nigerian. Where heritage meets contemporary style.
              </p>
              <div className="flex flex-wrap gap-4 mt-10">
                <Link href="/shop">
                  <Button variant="accent" size="lg" className="min-h-[52px] px-8 text-base font-semibold rounded-sm">
                    Shop the Collection
                  </Button>
                </Link>
                <Link href="/categories">
                  <Button variant="ghost" size="lg" className="min-h-[52px] px-8 text-base text-white/90 hover:bg-white/10 hover:text-white border border-white/20 rounded-sm">
                    Explore Categories
                  </Button>
                </Link>
              </div>
              <HeroTrustRow />
            </div>
          )}
        </div>
      </div>
      {items.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-10">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={cn(
                'h-1 rounded-full transition-all duration-300',
                i === activeIndex ? 'w-8 bg-[#c9a84c]' : 'w-1 bg-white/40 hover:bg-white/60'
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
