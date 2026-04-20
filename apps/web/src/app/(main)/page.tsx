import { Suspense } from 'react';
import { HomeHero } from '@/components/home/HomeHero';
import { TrustStrip } from '@/components/home/TrustStrip';
import { CategoriesStrip } from '@/components/home/CategoriesStrip';
import {
  HomeDeferredFeatured,
  HomeDeferredFlashSale,
  HomeDeferredNewArrivals,
} from '@/components/home/HomeDeferredSections';
import { BrandStoryBlock } from '@/components/home/BrandStoryBlock';
import { NewsletterBlock } from '@/components/home/NewsletterBlock';
import { fetchApi } from '@/lib/api-client';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:3000';

export default async function HomePage() {
  const [banners, categories] = await Promise.all([
    fetchApi('/banners').catch(() => []),
    fetchApi('/categories').catch(() => []),
  ]);

  const heroBanners = Array.isArray(banners)
    ? banners.filter((b) => (b.position || 'hero') === 'hero')
    : [];
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'YAC Fashion House',
    url: BASE_URL,
    logo: `${BASE_URL}/og-default.jpg`,
    sameAs: [
      process.env.NEXT_PUBLIC_INSTAGRAM_URL,
      process.env.NEXT_PUBLIC_FACEBOOK_URL,
      process.env.NEXT_PUBLIC_TIKTOK_URL,
    ].filter(Boolean),
  };

  return (
    <div className="overflow-x-hidden">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} />
      <HomeHero banners={heroBanners} />
      <TrustStrip />
      <CategoriesStrip categories={Array.isArray(categories) ? categories : []} />
      <Suspense fallback={null}>
        <HomeDeferredFeatured />
      </Suspense>
      <Suspense fallback={null}>
        <HomeDeferredFlashSale />
      </Suspense>
      <BrandStoryBlock />
      <Suspense fallback={null}>
        <HomeDeferredNewArrivals />
      </Suspense>
      <NewsletterBlock />
    </div>
  );
}
