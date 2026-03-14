import type { MetadataRoute } from 'next';
import { fetchApi } from '@/lib/api-client';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:3000';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productsRes, categoriesRes] = await Promise.all([
    fetchApi('/products?limit=10000&status=active').catch(() => ({ products: [] })),
    fetchApi('/categories').catch(() => []),
  ]);

  const products = Array.isArray(productsRes) ? productsRes : productsRes?.products ?? [];
  const categories = Array.isArray(categoriesRes) ? categoriesRes : [];

  const productUrls = products
    .filter((p: { slug?: string }) => p?.slug)
    .map((p: { slug: string; updatedAt?: string }) => ({
      url: `${BASE_URL}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));

  const categoryUrls = categories
    .filter((c: { slug?: string }) => c?.slug)
    .map((c: { slug: string }) => ({
      url: `${BASE_URL}/categories/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
  ];

  return [...staticUrls, ...categoryUrls, ...productUrls];
}
