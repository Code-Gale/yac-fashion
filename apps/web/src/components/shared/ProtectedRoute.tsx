'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Spinner } from '@/components/ui/Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = !!(accessToken && user);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname || '/');
      router.replace(`/login?returnUrl=${returnUrl}`);
    }
  }, [hydrated, isAuthenticated, router, pathname]);

  if (!hydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <Spinner size="lg" className="text-accent" />
      </div>
    );
  }

  return <>{children}</>;
}
