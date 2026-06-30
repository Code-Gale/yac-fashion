import { getClientApiBaseUrl, getServerApiBaseUrl } from './api-base';

function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    return getServerApiBaseUrl();
  }
  return getClientApiBaseUrl();
}

export async function fetchApi(path, options = {}) {
  const baseURL = getApiBaseUrl();
  const url = `${baseURL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data?.data ?? data;
}
