export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
] as const;

export const PAYMENT_METHODS = [
  'paystack',
  'flutterwave',
  'bank_transfer',
  'cash_on_delivery',
] as const;

export const USER_ROLES = ['user', 'admin'] as const;

export const COUPON_TYPES = ['percentage', 'fixed'] as const;
