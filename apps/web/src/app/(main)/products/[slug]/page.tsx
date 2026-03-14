import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/product/ProductDetail';
import { fetchApi } from '@/lib/api-client';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await fetchApi(`/products/${params.slug}`).catch(() => null);
  if (!product) return { title: 'Product | YAC Fashion House' };

  const desc = (product.description || '').slice(0, 160);
  const image = product.images?.[0];

  return {
    title: `${product.name} | YAC Fashion House`,
    description: desc,
    openGraph: {
      title: `${product.name} | YAC Fashion House`,
      description: desc,
      images: image ? [{ url: image, width: 800, height: 800 }] : [],
      type: 'website',
      url: `${BASE_URL}/products/${product.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${product.name} | YAC Fashion House`,
      description: desc,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: { slug: string };
}) {
  const [product, related] = await Promise.all([
    fetchApi(`/products/${params.slug}`),
    fetchApi(`/products/${params.slug}/related`).catch(() => []),
  ]);

  if (!product) notFound();

  const relatedList = Array.isArray(related) ? related : [];
  const breadcrumbItems = [
    { name: 'Home', url: BASE_URL },
    ...(product?.category?.slug
      ? [{ name: product.category.name, url: `${BASE_URL}/categories/${product.category.slug}` }]
      : []),
    { name: product?.name, url: `${BASE_URL}/products/${product?.slug}` },
  ];
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <ProductDetail
        product={product}
        relatedProducts={relatedList}
      />
    </>
  );
}
