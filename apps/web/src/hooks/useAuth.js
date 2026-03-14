'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

export function useAuth() {
  const { user, accessToken, refreshToken, setAuth, clearAuth, updateTokens } =
    useAuthStore();
  const router = useRouter();

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      const payload = data?.data ?? data;
      setAuth(payload.user, payload.accessToken, payload.refreshToken);
      return payload;
    },
    [setAuth]
  );

  const register = useCallback(
    async (name, email, password) => {
      const { data } = await api.post('/auth/register', { name, email, password });
      const payload = data?.data ?? data;
      setAuth(payload.user, payload.accessToken, payload.refreshToken);
      return payload;
    },
    [setAuth]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch (_) {}
    clearAuth();
    router.push('/');
  }, [clearAuth, router]);

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated: !!(accessToken && user),
    login,
    register,
    logout,
    setAuth,
    clearAuth,
    updateTokens,
  };
}
