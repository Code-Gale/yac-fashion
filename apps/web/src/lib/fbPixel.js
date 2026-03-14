export function trackPageView() {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'PageView');
  }
}

export function trackViewContent(product) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_ids: [product?._id],
      content_type: 'product',
      content_name: product?.name,
    });
  }
}

export function trackAddToCart(product, quantity = 1) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    const price = product?.flashSalePrice && product?.flashSaleEndsAt && new Date(product.flashSaleEndsAt) > new Date()
      ? product.flashSalePrice
      : product?.price;
    window.fbq('track', 'AddToCart', {
      content_ids: [product?._id],
      content_type: 'product',
      content_name: product?.name,
      value: (price ?? 0) * quantity,
      currency: 'NGN',
    });
  }
}

export function trackInitiateCheckout(value) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'InitiateCheckout', {
      value: value ?? 0,
      currency: 'NGN',
    });
  }
}

export function trackPurchase(value, items) {
  if (typeof window === 'undefined') return;
  if (window.fbq) {
    window.fbq('track', 'Purchase', {
      value: value ?? 0,
      currency: 'NGN',
      content_ids: (items ?? []).map((i) => i.productId ?? i._id),
      content_type: 'product',
    });
  }
}
