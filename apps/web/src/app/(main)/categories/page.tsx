import Link from 'next/link';
import Image from 'next/image';
import { fetchApi } from '@/lib/api-client';

export const metadata = {
  title: 'Categories | YAC Fashion House',
  description: 'Browse all product categories.',
};

type Category = { _id?: string; slug?: string; name?: string; image?: string };

export default async function CategoriesIndexPage() {
  const raw = await fetchApi('/categories').catch(() => []);
  const categories: Category[] = Array.isArray(raw) ? raw : [];

  return (
    <div className="min-h-screen px-4 lg:px-10 py-10 lg:py-14 max-w-7xl mx-auto">
      <p className="text-[#c9a84c] uppercase tracking-[0.2em] text-xs font-medium mb-2">Browse by</p>
      <h1 className="font-display font-semibold text-3xl lg:text-4xl text-[#1a1a2e] mb-10">
        All categories
      </h1>

      {categories.length === 0 ? (
        <p className="text-text-muted">No categories yet. Check back soon.</p>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {categories.map((cat) => (
            <li key={cat._id || cat.slug}>
              <Link
                href={`/categories/${cat.slug}`}
                className="group block rounded-xl overflow-hidden bg-[#f4f2ee] aspect-[3/4] relative"
              >
                {cat.image ? (
                  <Image
                    src={cat.image}
                    alt={cat.name || 'Category'}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[#1a1a2e]/10" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h2 className="font-display font-semibold text-white text-lg lg:text-xl">
                    {cat.name}
                  </h2>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
