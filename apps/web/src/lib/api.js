import axios from 'axios';
import { getSessionId } from './session';

const baseURL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/api`;

export const api = axios.create({
  baseURL,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

let authStore = null;

export function setAuthStoreForApi(store) {
  authStore = store;
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    if (authStore?.getState?.()) {
      const token = authStore.getState().accessToken;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    const sessionId = getSessionId();
    if (sessionId && !config.headers['x-session-id']) {
      config.headers['x-session-id'] = sessionId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && !original._retry && authStore?.getState?.()) {
      original._retry = true;
      const refreshToken = authStore.getState().refreshToken;
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, {
            refreshToken,
          });
          const payload = data?.data ?? data;
          authStore.getState().updateTokens?.(payload.accessToken, payload.refreshToken);
          original.headers.Authorization = `Bearer ${payload.accessToken}`;
          return api(original);
        } catch (refreshErr) {
          authStore.getState().clearAuth?.();
          if (typeof window !== 'undefined') {
            const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
            window.location.href = `/login?returnUrl=${returnUrl}`;
          }
        }
      } else {
        authStore.getState().clearAuth?.();
        if (typeof window !== 'undefined') {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?returnUrl=${returnUrl}`;
        }
      }
    }
    if (err.message === 'Network Error') {
      err.message = 'Unable to connect. Please check your connection.';
    }
    return Promise.reject(err);
  }
);
