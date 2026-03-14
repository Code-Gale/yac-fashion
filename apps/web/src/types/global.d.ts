declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    ttq?: {
      page: () => void;
      track: (event: string, params?: Record<string, unknown>) => void;
      load: (id: string) => void;
    };
  }
}

export {};
