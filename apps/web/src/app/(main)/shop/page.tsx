'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import { FilterDrawer } from '@/components/shop/FilterDrawer';
import { SortSheet } from '@/components/shop/SortSheet';
import { PriceRangeSlider } from '@/components/shop/PriceRangeSlider';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

export default function ShopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<{ _id: string; slug: string; name?: string; price?: number; images?: string[] }[]>([]);
  const [categories, setCategories] = useState<{ _id?: string; slug?: string; name?: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const inStock = searchParams.get('inStock') || '';
  const minRating = searchParams.get('minRating') || '';

  const updateParams = useCallback(
    (updates: Record<string, string | number | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === undefined || v === '' || v === null) params.delete(k);
        else params.set(k, String(v));
      });
      params.delete('page');
      return params.toString();
    },
    [searchParams]
  );

  const navigateTo = (query: string) => {
    router.push(query ? `/shop?${query}` : '/shop');
  };

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (category) q.set('category', category);
    if (minPrice) q.set('minPrice', minPrice);
    if (maxPrice) q.set('maxPrice', maxPrice);
    if (sort) q.set('sort', sort);
    q.set('page', String(page));
    if (inStock) q.set('inStock', inStock);
    if (minRating) q.set('minRating', minRating);

    Promise.all([
      api.get(`/products?${q}`),
      api.get('/categories'),
    ])
      .then(([productsRes, categoriesRes]) => {
        const data = productsRes.data?.data ?? productsRes.data;
        const cats = categoriesRes.data?.data ?? categoriesRes.data;
        setProducts(data?.products ?? []);
        setTotal(data?.total ?? 0);
        setTotalPages(data?.totalPages ?? 0);
        setCategories(Array.isArray(cats) ? cats : []);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [category, minPrice, maxPrice, sort, page, inStock, minRating]);

  const currentSort = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Newest';

  return (
    <div className="min-h-screen">
      <div className="lg:hidden sticky top-14 z-30 bg-surface border-b border-border px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-text-muted">
          {loading ? '...' : `${total} results`}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filter
          </button>
          <button
            type="button"
            onClick={() => setSortOpen(true)}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm font-medium"
          >
            {currentSort}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex">
        <aside className="hidden lg:block w-60 flex-shrink-0 sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto border-r border-border p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Filters</h3>
        <FilterDrawer
          open={false}
          onClose={() => {}}
          categories={categories as any}
          category={category}
          minPrice={minPrice}
          maxPrice={maxPrice}
          inStock={inStock}
          minRating={minRating}
          updateParams={(u: Record<string, string | number | undefined>) => navigateTo(updateParams(u))}
          embedded
        />
        </aside>

        <main className="flex-1 px-4 lg:px-10 py-6">
          <div className="hidden lg:flex items-center justify-between mb-6">
            <span className="text-sm text-text-muted">{total} results</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-muted">Sort:</span>
              <SortSheet
                open={false}
                onClose={() => {}}
                options={SORT_OPTIONS as any}
                value={sort}
                onChange={(v: string) => navigateTo(updateParams({ sort: v }))}
                embedded
              />
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonProductCard key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
              {products.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex gap-2">
                {page > 1 && (
                  <button
                    type="button"
                    onClick={() => navigateTo(updateParams({ page: page - 1 }))}
                    className="px-4 py-2 border border-border rounded-md hover:bg-bg-alt"
                  >
                    Previous
                  </button>
                )}
                <span className="px-4 py-2 text-text-muted">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <button
                    type="button"
                    onClick={() => navigateTo(updateParams({ page: page + 1 }))}
                    className="px-4 py-2 border border-border rounded-md hover:bg-bg-alt"
                  >
                    Load More
                  </button>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={categories as any}
        category={category}
        minPrice={minPrice}
        maxPrice={maxPrice}
        inStock={inStock}
        minRating={minRating}
        updateParams={(u: Record<string, string | number | undefined>) => {
          navigateTo(updateParams(u));
          setFilterOpen(false);
        }}
      />

      <SortSheet
        open={sortOpen}
        onClose={() => setSortOpen(false)}
        options={SORT_OPTIONS as any}
        value={sort}
        onChange={(v: string) => {
          navigateTo(updateParams({ sort: v }));
          setSortOpen(false);
        }}
      />
    </div>
  );
}
