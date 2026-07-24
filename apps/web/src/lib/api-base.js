/**
 * Normalize API base URL — always returns origin + /api (never /api/api).
 * Accepts NEXT_PUBLIC_API_URL with or without trailing /api.
 */
export function normalizeApiBaseUrl(url) {
  let base = String(url || 'http://localhost:4001').trim().replace(/\/+$/, '');
  if (base.endsWith('/api')) {
    return base;
  }
  return `${base}/api`;
}

export function getClientApiBaseUrl() {
  // In production the shop and API share one origin (nginx proxies /api). Using
  // the page's own host avoids cross-origin calls when users hit www vs apex
  // (e.g. NEXT_PUBLIC_API_URL=https://yacfashionhouse.com but visit www.).
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return normalizeApiBaseUrl(window.location.origin);
    }
  }
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
}

export function getServerApiBaseUrl() {
  const internal = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  return normalizeApiBaseUrl(internal);
}
