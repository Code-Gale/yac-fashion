export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT', 'Gombe', 'Imo',
  'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa',
  'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara',
];

export const SHIPPING_OPTIONS = [
  { label: 'Standard Delivery', description: '5-7 business days', price: 2500, estimatedDays: '5-7' },
  { label: 'Express Delivery', description: '2-3 business days', price: 5000, estimatedDays: '2-3' },
  { label: 'Same Day (Lagos)', description: 'Lagos only', price: 8000, estimatedDays: 'Same day' },
];

export const PAYMENT_METHODS = {
  paystack: { id: 'paystack', label: 'Paystack', description: 'Pay securely with card, bank transfer, USSD' },
  flutterwave: { id: 'flutterwave', label: 'Flutterwave', description: 'Card, bank transfer, mobile money' },
  bank_transfer: { id: 'bank_transfer', label: 'Bank Transfer', description: 'Manual bank transfer' },
  cash_on_delivery: { id: 'cash_on_delivery', label: 'Cash on Delivery', description: 'Pay when your order arrives' },
};

export const BANK_TRANSFER = {
  accountName: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME || 'YAC Fashion House',
  accountNumber: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER || '0123456789',
  bankName: process.env.NEXT_PUBLIC_BANK_NAME || 'GTBank',
};

export const COD_AVAILABLE = process.env.NEXT_PUBLIC_COD_AVAILABLE !== 'false';
