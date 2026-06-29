'use client';

import { useEffect } from 'react';
import { ToastProvider } from '@/components/ui/ToastContext';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useCartStore } from '@/store/cart';

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrateCart = useCartStore((state) => state.hydrateCart);

  useEffect(() => {
    // Hydrate cart on app mount
    hydrateCart();
  }, [hydrateCart]);

  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
        <CartDrawer />
      </ToastProvider>
    </ErrorBoundary>
  );
}
