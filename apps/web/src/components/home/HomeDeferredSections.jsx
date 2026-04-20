'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { FlashSaleStrip } from '@/components/home/FlashSaleStrip';
import { NewArrivals } from '@/components/home/NewArrivals';
import { SkeletonProductCard } from '@/components/ui/Skeleton';

function FeaturedSkeleton() {
  return (
    <section className="home-section px-6 lg:px-16 xl:px-24 bg-[#fafaf8]">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 lg:mb-14 space-y-3">
          <div className="h-3 w-24 bg-bg-alt rounded animate-pulse" />
          <div className="h-9 w-64 max-w-full bg-bg-alt rounded animate-pulse" />
          <div className="h-4 w-full max-w-xl bg-bg-alt rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonProductCard key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FlashSaleSkeleton() {
  return (
    <section className="py-16 lg:py-24 bg-[#0f0f1a] text-white relative overflow-hidden">
      <div className="relative px-6 lg:px-16 xl:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-12">
            <div className="h-10 w-48 bg-white/10 rounded animate-pulse" />
            <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-6 overflow-hidden lg:grid lg:grid-cols-4 lg:gap-8">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-72">
                <SkeletonProductCard />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function HomeDeferredFeatured() {
  const [products, setProducts] = useState(null);
  useEffect(() => {
    api
      .get('/products/featured')
      .then(({ data }) => {
        const arr = data?.data ?? data;
        setProducts(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setProducts([]));
  }, []);
  if (products === null) return <FeaturedSkeleton />;
  return <FeaturedProducts products={products} />;
}

export function HomeDeferredFlashSale() {
  const [products, setProducts] = useState(null);
  useEffect(() => {
    api
      .get('/products/flash-sale')
      .then(({ data }) => {
        const arr = data?.data ?? data;
        setProducts(Array.isArray(arr) ? arr : []);
      })
      .catch(() => setProducts([]));
  }, []);
  if (products === null) return <FlashSaleSkeleton />;
  if (!products.length) return null;
  return <FlashSaleStrip products={products} />;
}

export function HomeDeferredNewArrivals() {
  const [products, setProducts] = useState(null);
  useEffect(() => {
    api
      .get('/products?sort=newest&limit=8')
      .then(({ data }) => {
        const raw = data?.data ?? data;
        const list = Array.isArray(raw) ? raw : raw?.products ?? [];
        setProducts(Array.isArray(list) ? list : []);
      })
      .catch(() => setProducts([]));
  }, []);
  if (products === null) return <FeaturedSkeleton />;
  return <NewArrivals products={products} />;
}
