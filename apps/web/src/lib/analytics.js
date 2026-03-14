export function trackPageView(url) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('config', process.env.NEXT_PUBLIC_GA4_ID, { page_path: url });
  }
}

export function trackViewItem(product) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    const price = product?.flashSalePrice && product?.flashSaleEndsAt && new Date(product.flashSaleEndsAt) > new Date()
      ? product.flashSalePrice
      : product?.price;
    window.gtag('event', 'view_item', {
      currency: 'NGN',
      value: price ?? 0,
      items: [{
        item_id: product?._id,
        item_name: product?.name,
        price: price ?? 0,
        quantity: 1,
      }],
    });
  }
}

export function trackAddToCart(product, quantity = 1) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    const price = product?.flashSalePrice && product?.flashSaleEndsAt && new Date(product.flashSaleEndsAt) > new Date()
      ? product.flashSalePrice
      : product?.price;
    window.gtag('event', 'add_to_cart', {
      currency: 'NGN',
      value: (price ?? 0) * quantity,
      items: [{
        item_id: product?._id,
        item_name: product?.name,
        price: price ?? 0,
        quantity,
      }],
    });
  }
}

export function trackBeginCheckout(items, value) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'begin_checkout', {
      currency: 'NGN',
      value: value ?? 0,
      items: (items ?? []).map((i) => ({
        item_id: i.productId,
        item_name: i.name,
        price: i.price ?? 0,
        quantity: i.quantity ?? 1,
      })),
    });
  }
}

export function trackPurchase(transactionId, value, items) {
  if (typeof window === 'undefined') return;
  if (window.gtag) {
    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      currency: 'NGN',
      value: value ?? 0,
      items: (items ?? []).map((i) => ({
        item_id: i.productId ?? i._id,
        item_name: i.name,
        price: i.price ?? 0,
        quantity: i.quantity ?? 1,
      })),
    });
  }
}
