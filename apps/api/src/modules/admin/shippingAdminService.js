const ShippingMethod = require('../shipping/methodModel');
const ShippingRate = require('../shipping/rateModel');
const { seedDefaultsIfEmpty } = require('../shipping/service');
const { NIGERIAN_STATES } = require('../../config/states');

const getMethods = async () => {
  await seedDefaultsIfEmpty();
  const methods = await ShippingMethod.find().sort({ sortOrder: 1, createdAt: 1 });
  const counts = await ShippingRate.aggregate([
    { $group: { _id: '$method', count: { $sum: 1 } } },
  ]);
  const countByMethod = new Map(counts.map((c) => [c._id.toString(), c.count]));
  return methods.map((m) => ({ ...m.toObject(), rateCount: countByMethod.get(m._id.toString()) || 0 }));
};

const createMethod = async (data) => {
  const key = String(data.key || data.label || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!key) {
    const err = new Error('A key or label is required');
    err.statusCode = 400;
    throw err;
  }
  const existing = await ShippingMethod.findOne({ key });
  if (existing) {
    const err = new Error('A shipping method with this key already exists');
    err.statusCode = 400;
    throw err;
  }
  const maxSort = await ShippingMethod.findOne().sort({ sortOrder: -1 }).select('sortOrder');
  return ShippingMethod.create({
    key,
    label: data.label,
    description: data.description || '',
    estimatedDays: data.estimatedDays || '',
    price: data.price,
    isActive: data.isActive !== false,
    sortOrder: data.sortOrder ?? ((maxSort?.sortOrder ?? -1) + 1),
  });
};

const updateMethod = async (id, data) => {
  const update = {};
  if (data.label !== undefined) update.label = data.label;
  if (data.description !== undefined) update.description = data.description;
  if (data.estimatedDays !== undefined) update.estimatedDays = data.estimatedDays;
  if (data.price !== undefined) update.price = data.price;
  if (data.isActive !== undefined) update.isActive = data.isActive;
  if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder;
  return ShippingMethod.findByIdAndUpdate(id, update, { new: true, runValidators: true });
};

const deleteMethod = async (id) => {
  const doc = await ShippingMethod.findByIdAndDelete(id);
  if (doc) {
    await ShippingRate.deleteMany({ method: id });
  }
  return doc;
};

const getRates = async (methodId) => {
  return ShippingRate.find({ method: methodId }).sort({ state: 1 });
};

const upsertRate = async (methodId, state, data) => {
  const trimmedState = String(state || '').trim();
  if (!NIGERIAN_STATES.includes(trimmedState)) {
    const err = new Error('Invalid state');
    err.statusCode = 400;
    throw err;
  }
  const method = await ShippingMethod.findById(methodId);
  if (!method) return null;
  return ShippingRate.findOneAndUpdate(
    { method: methodId, state: trimmedState },
    { price: data.price, estimatedDays: data.estimatedDays || '' },
    { new: true, upsert: true, runValidators: true }
  );
};

const deleteRate = async (rateId) => {
  return ShippingRate.findByIdAndDelete(rateId);
};

module.exports = {
  getMethods,
  createMethod,
  updateMethod,
  deleteMethod,
  getRates,
  upsertRate,
  deleteRate,
};
