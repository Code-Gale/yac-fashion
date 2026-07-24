import axios from 'axios';
import { getSessionId } from './session';
import { getClientApiBaseUrl, getServerApiBaseUrl } from './api-base';

export const api = axios.create({
  baseURL:
    typeof window === 'undefined'
      ? getServerApiBaseUrl()
      : getClientApiBaseUrl(),
  withCredentials: true, // Enable cookies for HttpOnly auth tokens
  headers: { 'Content-Type': 'application/json' },
});

let authStore = null;

export function setAuthStoreForApi(store) {
  authStore = store;
}

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    config.baseURL = getClientApiBaseUrl();
    // Send Authorization header as fallback (cookies are primary now)
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
      
      try {
        // Refresh endpoint will use cookie if available, or body refreshToken as fallback
        const { data } = await axios.post(`${baseURL}/auth/refresh`, 
          refreshToken ? { refreshToken } : {},
          { withCredentials: true } // Important: send cookies
        );
        const payload = data?.data ?? data;
        
        // Update tokens in store (cookies are managed by server)
        authStore.getState().updateTokens?.(payload.accessToken, payload.refreshToken);
        
        // Retry original request (cookies will be sent automatically)
        if (payload.accessToken) {
          original.headers.Authorization = `Bearer ${payload.accessToken}`;
        }
        return api(original);
      } catch (refreshErr) {
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
