'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export function BrandStoryBlock() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid lg:grid-cols-2 min-h-[500px] lg:min-h-[600px]">
        <div className="relative order-2 lg:order-1 bg-[#0f0f1a]">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 40px,
                rgba(201,168,76,0.3) 40px,
                rgba(201,168,76,0.3) 80px
              )`,
            }}
          />
          <div className="relative z-10 flex flex-col justify-center p-10 lg:p-16 xl:p-24">
            <p className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-medium mb-4">
              Our Story
            </p>
            <h2 className="font-display font-semibold text-[2rem] lg:text-[2.75rem] text-white leading-tight">
              Crafted for the modern Nigerian
            </h2>
            <p className="mt-6 text-[#9ca3af] text-base lg:text-lg leading-relaxed max-w-xl">
              YAC Fashion House brings together timeless design and contemporary style.
              Each piece is thoughtfully created to celebrate Nigerian heritage while
              embracing global fashion trends. From statement pieces to everyday essentials,
              we deliver luxury that feels accessible.
            </p>
            <div className="flex flex-wrap gap-4 mt-10">
              <Link href="/shop">
                <Button variant="accent" size="lg" className="min-h-[48px] px-8 rounded-sm">
                  Discover the Collection
                </Button>
              </Link>
              <Link href="/categories">
                <Button variant="ghost" size="lg" className="min-h-[48px] px-8 text-white/90 hover:bg-white/10 hover:text-white border border-white/20 rounded-sm">
                  Browse Categories
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <div className="relative order-1 lg:order-2 aspect-[4/5] lg:aspect-auto min-h-[300px] lg:min-h-[600px]">
          <Image
            src="https://placehold.co/800x1000/f4f2ee/1a1a2e?text=YAC"
            alt="YAC Fashion House - Nigerian fashion"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f0f1a] via-transparent to-transparent lg:bg-none" />
        </div>
      </div>
    </section>
  );
}
