'use client';

import { ToastProvider } from '@/components/ui/ToastContext';
import { CartDrawer } from '@/components/cart/CartDrawer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <CartDrawer />
    </ToastProvider>
  );
}
