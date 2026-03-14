import { HomeHero } from '@/components/home/HomeHero';
import { TrustStrip } from '@/components/home/TrustStrip';
import { CategoriesStrip } from '@/components/home/CategoriesStrip';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { FlashSaleStrip } from '@/components/home/FlashSaleStrip';
import { BrandStoryBlock } from '@/components/home/BrandStoryBlock';
import { NewArrivals } from '@/components/home/NewArrivals';
import { NewsletterBlock } from '@/components/home/NewsletterBlock';
import { fetchApi } from '@/lib/api-client';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.CLIENT_URL || 'http://localhost:3000';

export default async function HomePage() {
  const [banners, categories, featured, flashSale, newArrivals] = await Promise.all([
    fetchApi('/banners').catch(() => []),
    fetchApi('/categories').catch(() => []),
    fetchApi('/products/featured').catch(() => []),
    fetchApi('/products/flash-sale').catch(() => []),
    fetchApi('/products?sort=newest&limit=8').catch(() => ({ products: [] })),
  ]);

  const newProducts = Array.isArray(newArrivals) ? newArrivals : newArrivals?.products ?? [];
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
      <FeaturedProducts products={Array.isArray(featured) ? featured : []} />
      {Array.isArray(flashSale) && flashSale.length > 0 && (
        <FlashSaleStrip products={flashSale} />
      )}
      <BrandStoryBlock />
      <NewArrivals products={newProducts} />
      <NewsletterBlock />
    </div>
  );
}
