const baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api`;

export async function fetchApi(path, options = {}) {
  const url = `${baseURL}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data?.data ?? data;
}
