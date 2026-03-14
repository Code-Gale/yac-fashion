import { notFound } from 'next/navigation';
import { CategoryPageClient } from './CategoryPageClient';
import { fetchApi } from '@/lib/api-client';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:3000';

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params?.slug;
  if (!slug) notFound();
  let category = await fetchApi(`/categories/${slug}`).catch(() => null);
  if (!category) {
    const categories = await fetchApi('/categories').catch(() => []);
    category = Array.isArray(categories) ? categories.find((c: { slug?: string }) => c.slug === slug) : null;
  }
  if (!category) notFound();

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
      { '@type': 'ListItem', position: 2, name: category?.name, item: `${BASE_URL}/categories/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <CategoryPageClient
        category={category}
        slug={slug}
      />
    </>
  );
}
