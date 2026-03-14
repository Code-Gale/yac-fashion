const Product = require('../products/model');
const Category = require('../categories/model');
const { CLIENT_URL } = require('../../config/env');

const SITEMAP_CACHE_KEY = 'sitemap:xml';
const SITEMAP_TTL = 60 * 60;

const buildSitemapXml = async () => {
  const base = (CLIENT_URL || 'http://localhost:3000').replace(/\/$/, '');
  const staticUrls = [
    { loc: `${base}/`, changefreq: 'daily', priority: 1 },
    { loc: `${base}/products`, changefreq: 'daily', priority: 0.9 },
    { loc: `${base}/categories`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${base}/contact`, changefreq: 'monthly', priority: 0.5 },
  ];
  const products = await Product.find({ isActive: true }).select('slug updatedAt').lean();
  const categories = await Category.find({ isActive: true }).select('slug updatedAt').lean();
  const productUrls = products.map((p) => ({
    loc: `${base}/products/${p.slug}`,
    lastmod: p.updatedAt ? new Date(p.updatedAt).toISOString().slice(0, 10) : null,
    changefreq: 'weekly',
    priority: 0.7,
  }));
  const categoryUrls = categories.map((c) => ({
    loc: `${base}/categories/${c.slug}`,
    lastmod: c.updatedAt ? new Date(c.updatedAt).toISOString().slice(0, 10) : null,
    changefreq: 'weekly',
    priority: 0.7,
  }));
  const urlEntries = [
    ...staticUrls.map((u) => `  <url><loc>${escapeXml(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`),
    ...productUrls.map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '';
      return `  <url><loc>${escapeXml(u.loc)}</loc>${lastmod}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`;
    }),
    ...categoryUrls.map((u) => {
      const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '';
      return `  <url><loc>${escapeXml(u.loc)}</loc>${lastmod}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`;
    }),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join('\n')}
</urlset>`;
};

const escapeXml = (s) => {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const getSitemap = async () => {
  const { getRedis } = require('../../config/redis');
  const redis = await getRedis();
  if (redis) {
    const cached = await redis.get(SITEMAP_CACHE_KEY);
    if (cached) return cached;
  }
  const xml = await buildSitemapXml();
  if (redis) {
    await redis.setEx(SITEMAP_CACHE_KEY, SITEMAP_TTL, xml);
  }
  return xml;
};

module.exports = { getSitemap };
