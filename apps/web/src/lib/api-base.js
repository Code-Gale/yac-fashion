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
  return normalizeApiBaseUrl(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001');
}

export function getServerApiBaseUrl() {
  const internal = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  return normalizeApiBaseUrl(internal);
}
