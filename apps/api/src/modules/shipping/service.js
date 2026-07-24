const ShippingMethod = require('./methodModel');
const ShippingRate = require('./rateModel');

// Preserves the original hardcoded rates (apps/api/src/config/shipping.js)
// as the initial seed so existing deployments keep working the first time
// this runs against a database with no shipping methods configured yet.
const DEFAULT_METHODS = [
  { key: 'standard', label: 'Standard Delivery', estimatedDays: '3-5 business days', price: 2500, sortOrder: 0, isActive: true },
  { key: 'express', label: 'Express Delivery', estimatedDays: '1-2 business days', price: 5000, sortOrder: 1, isActive: true },
  { key: 'pickup', label: 'Pickup from Store', estimatedDays: '', price: 0, sortOrder: 2, isActive: true },
];

let seeded = false;
const seedDefaultsIfEmpty = async () => {
  if (seeded) return;
  const count = await ShippingMethod.countDocuments();
  if (count === 0) {
    await ShippingMethod.insertMany(DEFAULT_METHODS);
  }
  seeded = true;
};

const normalizeState = (state) => (state || '').trim();

/**
 * Public: resolve the active shipping methods for a given state, applying
 * any per-state price/estimate override. If no state is provided (or a
 * method has no override for it), the method's default price/estimate is
 * used.
 */
const getOptionsForState = async (state) => {
  await seedDefaultsIfEmpty();
  const methods = await ShippingMethod.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 });
  const normalized = normalizeState(state);
  let rateByMethodId = new Map();
  if (normalized && methods.length) {
    const rates = await ShippingRate.find({
      method: { $in: methods.map((m) => m._id) },
      state: normalized,
    });
    rateByMethodId = new Map(rates.map((r) => [r.method.toString(), r]));
  }
  return methods.map((m) => {
    const override = rateByMethodId.get(m._id.toString());
    return {
      id: m.key,
      label: m.label,
      description: m.description || '',
      estimatedDays: (override?.estimatedDays || m.estimatedDays || '').trim(),
      price: override ? override.price : m.price,
    };
  });
};

/**
 * Server-side resolution of a single shipping option by key, for a given
 * state. Returns null if the method doesn't exist or is inactive. Always
 * computed from the DB — never trusts client-supplied prices.
 */
const resolveShippingOption = async (key, state) => {
  await seedDefaultsIfEmpty();
  if (!key) return null;
  const method = await ShippingMethod.findOne({ key: String(key).trim().toLowerCase(), isActive: true });
  if (!method) return null;
  const normalized = normalizeState(state);
  let price = method.price;
  let estimatedDays = method.estimatedDays || '';
  if (normalized) {
    const rate = await ShippingRate.findOne({ method: method._id, state: normalized });
    if (rate) {
      price = rate.price;
      estimatedDays = rate.estimatedDays || estimatedDays;
    }
  }
  return { id: method.key, label: method.label, price, estimatedDays };
};

module.exports = {
  seedDefaultsIfEmpty,
  getOptionsForState,
  resolveShippingOption,
};
