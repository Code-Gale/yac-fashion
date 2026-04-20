function getApiBaseUrl() {
  if (typeof window === 'undefined') {
    const internal = process.env.INTERNAL_API_URL || 'http://localhost:4001';
    return `${String(internal).replace(/\/+$/, '')}/api`;
  }
  const pub = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  return `${String(pub).replace(/\/+$/, '')}/api`;
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
