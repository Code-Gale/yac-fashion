import { getClientApiBaseUrl } from './api-base';

/** Extract stored object filename from MinIO or API file URLs. */
function extractFilename(src) {
  if (src.includes('/api/files/')) {
    return src.split('/api/files/').pop()?.split(/[?#]/)[0] || '';
  }
  if (src.includes('/yac-images/')) {
    return src.split('/yac-images/').pop()?.split(/[?#]/)[0] || '';
  }
  if (/:\d+\/[^/]+\.[a-z0-9]+$/i.test(src)) {
    return src.split('/').pop()?.split(/[?#]/)[0] || '';
  }
  return '';
}

/**
 * Rewrite direct MinIO / localhost upload URLs to the public API files route.
 * Seeded external URLs (picsum, etc.) are returned unchanged.
 */
export function resolveImageUrl(src) {
  if (!src || typeof src !== 'string') return src;

  const isDirectMinio =
    /localhost:9000|127\.0\.0\.1:9000|:9000\//i.test(src) ||
    src.includes('/yac-images/');

  if (src.startsWith('/api/files/')) {
    return `${getClientApiBaseUrl()}${src.slice(4)}`;
  }

  if (!isDirectMinio) return src;

  const filename = extractFilename(src);
  if (!filename || filename.includes('..') || filename.includes('/')) return src;

  return `${getClientApiBaseUrl()}/files/${filename}`;
}
