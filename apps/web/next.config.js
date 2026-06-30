/** @type {import('next').NextConfig} */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.CLIENT_URL || '';
let siteHostname = 'localhost';
try {
  if (siteUrl) siteHostname = new URL(siteUrl).hostname;
} catch (_) {}

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'via.placeholder.com', pathname: '/**' },
      { protocol: 'https', hostname: 'placehold.co', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', pathname: '/**' },
      { protocol: 'http', hostname: 'localhost', pathname: '/**' },
      { protocol: 'https', hostname: siteHostname, pathname: '/api/files/**' },
      { protocol: 'http', hostname: siteHostname, pathname: '/api/files/**' },
    ],
    dangerouslyAllowSVG: true,
  },
};

module.exports = nextConfig;
