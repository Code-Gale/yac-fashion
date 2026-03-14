'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';
import { trackPageView as trackFbPageView } from '@/lib/fbPixel';
import { trackPageView as trackTikTokPageView } from '@/lib/tiktokPixel';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    trackPageView(pathname);
    trackFbPageView();
    trackTikTokPageView();
  }, [pathname]);

  return <>{children}</>;
}
