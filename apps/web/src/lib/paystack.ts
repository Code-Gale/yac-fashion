export type PaystackInitPayload = {
  authorizationUrl?: string;
  reference?: string;
  publicKey?: string;
  email?: string;
  amount?: number;
};

declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        currency?: string;
        callback: (response: { reference: string }) => void;
        onClose?: () => void;
      }) => { openIframe: () => void };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

export function loadPaystackScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Paystack is browser-only'));
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-paystack-inline]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Paystack')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.dataset.paystackInline = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack'));
    document.body.appendChild(script);
  });

  return scriptPromise;
}

export async function startPaystackPayment(
  init: PaystackInitPayload,
  onSuccess: (reference: string) => void,
  onCancel?: () => void,
): Promise<'popup' | 'redirect' | 'failed'> {
  const { publicKey, email, amount, reference, authorizationUrl } = init;

  if (publicKey && email && amount && reference) {
    try {
      await loadPaystackScript();
      if (!window.PaystackPop) throw new Error('Paystack unavailable');

      await new Promise<void>((resolve, reject) => {
        let completed = false;
        const handler = window.PaystackPop!.setup({
          key: publicKey,
          email,
          amount,
          ref: reference,
          currency: 'NGN',
          callback: (response) => {
            completed = true;
            onSuccess(response.reference);
            resolve();
          },
          onClose: () => {
            if (!completed) {
              onCancel?.();
              reject(new Error('cancelled'));
            }
          },
        });
        handler.openIframe();
      });

      return 'popup';
    } catch (err) {
      if (err instanceof Error && err.message === 'cancelled') {
        return 'failed';
      }
      // Fall through to redirect if inline popup fails to load/open.
    }
  }

  if (authorizationUrl) {
    window.location.assign(authorizationUrl);
    return 'redirect';
  }

  return 'failed';
}
