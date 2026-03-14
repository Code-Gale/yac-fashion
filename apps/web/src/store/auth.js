import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { setAuthStoreForApi } from '@/lib/api';

const initialState = {
  user: null,
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create(
  persist(
    (set) => ({
      ...initialState,
      isAuthenticated: () => {
        const state = useAuthStore.getState();
        return !!(state.accessToken && state.user);
      },
      setAuth: (user, accessToken, refreshToken) =>
        set({ user, accessToken, refreshToken }),
      updateTokens: (accessToken, refreshToken) =>
        set((s) => ({ ...s, accessToken, refreshToken })),
      clearAuth: () => set(initialState),
    }),
    { name: 'yac-auth' }
  )
);

if (typeof window !== 'undefined') {
  setAuthStoreForApi(useAuthStore);
}
