'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProductCard } from '@/components/shared/ProductCard';
import { SkeletonProductCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterDrawer } from '@/components/shop/FilterDrawer';
import { SortSheet } from '@/components/shop/SortSheet';
import { fetchApi } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
];

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get('q') || '';
  const [products, setProducts] = useState<{ _id: string; slug: string; name?: string; price?: number; images?: string[] }[]>([]);
  const [suggested, setSuggested] = useState<{ _id: string; slug: string; name?: string; price?: number; images?: string[] }[]>([]);
  const [categories, setCategories] = useState<{ _id: string; slug: string; name?: string }[]>([]);
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

  const navigateTo = useCallback(
    (query: string) => {
      router.push(query ? `/search?${query}` : '/search');
    },
    [router]
  );

  useEffect(() => {
    if (!q.trim()) {
      setProducts([]);
      setTotal(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const params = new URLSearchParams();
    params.set('q', q);
    if (category) params.set('category', category);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (sort) params.set('sort', sort);
    params.set('page', String(page));
    if (inStock) params.set('inStock', inStock);
    if (minRating) params.set('minRating', minRating);

    Promise.all([
      fetchApi(`/products?${params}`),
      fetchApi('/categories'),
      fetchApi('/products/featured').catch(() => []),
    ])
      .then(([data, cats, feat]) => {
        setProducts(data?.products ?? []);
        setTotal(data?.total ?? 0);
        setTotalPages(data?.totalPages ?? 0);
        setCategories(Array.isArray(cats) ? cats : []);
        const featured = Array.isArray(feat) ? feat : feat?.products ?? [];
        setSuggested(featured.slice(0, 4));
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [q, category, minPrice, maxPrice, sort, page, inStock, minRating]);

  const currentSort = SORT_OPTIONS.find((o) => o.value === sort)?.label || 'Newest';
  const hasResults = !loading && products.length > 0;
  const noResults = !loading && q.trim() && products.length === 0;

  return (
    <div className="min-h-screen">
      <div className="px-4 lg:px-10 pt-6">
        <h1 className="font-display font-semibold text-2xl lg:text-3xl text-primary">
          Results for &quot;{q || '...'}&quot;
        </h1>
        {q.trim() && (
          <p className="text-sm text-text-muted mt-1">
            {loading ? '...' : `${total} result${total !== 1 ? 's' : ''}`}
          </p>
        )}
      </div>

      {q.trim() ? (
        <>
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
              ) : noResults ? (
                <div className="space-y-8">
                  <EmptyState
                    heading="No results found"
                    description={`We couldn't find anything matching "${q}". Try a different search term.`}
                    action={
                      <Link href="/shop" className="text-accent font-medium hover:underline">
                        Browse all products
                      </Link>
                    }
                  />
                  {suggested.length > 0 && (
                    <div>
                      <h2 className="font-display font-semibold text-xl mb-4">Suggested for you</h2>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
                        {suggested.map((p, i) => (
                          <ProductCard key={p._id} product={p} index={i} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
                    {products.map((p, i) => (
                      <ProductCard key={p._id} product={p} index={i} />
                    ))}
                  </div>

                  {totalPages > 1 && (
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
                </>
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
        </>
      ) : (
        <div className="px-4 lg:px-10 py-12">
          <EmptyState
            heading="Search for products"
            description="Enter a search term above to find what you're looking for."
            action={
              <Link href="/shop" className="text-accent font-medium hover:underline">
                Browse all products
              </Link>
            }
          />
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-text-muted">Loading...</div>
      </div>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
