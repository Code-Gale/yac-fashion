const KEY = 'yac-cart-session';

export function getSessionId() {
  if (typeof window === 'undefined') return null;
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(KEY, id);
  }
  return id;
}
