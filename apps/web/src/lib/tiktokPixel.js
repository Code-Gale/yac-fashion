export function trackPageView() {
  if (typeof window === 'undefined') return;
  if (window.ttq) {
    window.ttq.page();
  }
}

export function trackViewContent(product) {
  if (typeof window === 'undefined') return;
  if (window.ttq) {
    window.ttq.track('ViewContent', {
      content_id: product?._id,
      content_type: 'product',
      content_name: product?.name,
    });
  }
}

export function trackAddToCart(product, quantity = 1) {
  if (typeof window === 'undefined') return;
  if (window.ttq) {
    const price = product?.flashSalePrice && product?.flashSaleEndsAt && new Date(product.flashSaleEndsAt) > new Date()
      ? product.flashSalePrice
      : product?.price;
    window.ttq.track('AddToCart', {
      content_id: product?._id,
      content_type: 'product',
      content_name: product?.name,
      value: (price ?? 0) * quantity,
      currency: 'NGN',
    });
  }
}

export function trackInitiateCheckout(value) {
  if (typeof window === 'undefined') return;
  if (window.ttq) {
    window.ttq.track('InitiateCheckout', {
      value: value ?? 0,
      currency: 'NGN',
    });
  }
}

export function trackCompletePayment(value, orderId) {
  if (typeof window === 'undefined') return;
  if (window.ttq) {
    window.ttq.track('CompletePayment', {
      value: value ?? 0,
      currency: 'NGN',
      order_id: orderId,
    });
  }
}
