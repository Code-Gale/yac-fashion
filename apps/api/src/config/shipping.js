// Server-side shipping rate configuration
// Prices are in Naira (NGN)

const SHIPPING_OPTIONS = [
  {
    id: 'standard',
    label: 'Standard Delivery (3-5 business days)',
    price: 2500,
    isActive: true,
  },
  {
    id: 'express',
    label: 'Express Delivery (1-2 business days)',
    price: 5000,
    isActive: true,
  },
  {
    id: 'pickup',
    label: 'Pickup from Store',
    price: 0,
    isActive: true,
  },
];

const getShippingOption = (id) => {
  return SHIPPING_OPTIONS.find(opt => opt.id === id && opt.isActive);
};

const getAllActiveShippingOptions = () => {
  return SHIPPING_OPTIONS.filter(opt => opt.isActive);
};

const validateShippingOption = (shippingOption) => {
  if (!shippingOption || !shippingOption.id) {
    return { valid: false, error: 'Shipping option ID required' };
  }
  
  const serverOption = getShippingOption(shippingOption.id);
  if (!serverOption) {
    return { valid: false, error: 'Invalid shipping option' };
  }
  
  // Verify the price matches server-side rate
  if (shippingOption.price !== serverOption.price) {
    return { valid: false, error: 'Shipping price mismatch' };
  }
  
  return { valid: true, option: serverOption };
};

module.exports = {
  SHIPPING_OPTIONS,
  getShippingOption,
  getAllActiveShippingOptions,
  validateShippingOption,
};
