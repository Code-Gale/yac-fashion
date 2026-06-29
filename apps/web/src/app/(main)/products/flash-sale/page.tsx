'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';

export default function FlashSalePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get('/products/flash-sale')
      .then(({ data }) => {
        const arr = data?.data ?? data;
        setProducts(Array.isArray(arr) ? arr : []);
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header />
      <main className="min-h-screen pt-[72px]">
        <div className="max-w-7xl mx-auto px-4 lg:px-10 py-8">
          <div className="text-center mb-8">
            <h1 className="text-heading-1 font-display font-bold mb-2">Flash Sale</h1>
            <p className="text-body text-text-muted">
              Limited time offers on selected items. Grab them before they're gone!
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
              {products.map((product, index) => (
                <ProductCard key={product._id} product={product} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <svg
                className="mx-auto h-16 w-16 text-text-muted mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h2 className="text-heading-2 font-display font-semibold mb-2">
                No Flash Sales Right Now
              </h2>
              <p className="text-body text-text-muted mb-6">
                Check back soon for amazing deals and limited-time offers!
              </p>
              <a
                href="/shop"
                className="inline-block px-6 py-3 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition"
              >
                Browse All Products
              </a>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
