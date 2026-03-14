const User = require('../users/model');
const mongoose = require('mongoose');

const MAX_ADDRESSES = 5;

const getAddresses = async (userId) => {
  const user = await User.findById(userId).select('addresses');
  return user?.addresses || [];
};

const addAddress = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) return null;
  if ((user.addresses || []).length >= MAX_ADDRESSES) {
    const err = new Error('Maximum 5 addresses allowed');
    err.statusCode = 400;
    throw err;
  }
  const address = {
    _id: new mongoose.Types.ObjectId(),
    label: data.label || '',
    name: data.name || '',
    street: data.street || '',
    city: data.city || '',
    state: data.state || '',
    phone: data.phone || '',
    isDefault: (user.addresses || []).length === 0,
  };
  user.addresses = user.addresses || [];
  user.addresses.push(address);
  await user.save();
  return address;
};

const updateAddress = async (userId, addressId, data) => {
  const user = await User.findById(userId);
  if (!user) return null;
  const idx = (user.addresses || []).findIndex((a) => a._id.toString() === addressId);
  if (idx < 0) return null;
  if (data.label != null) user.addresses[idx].label = data.label;
  if (data.name != null) user.addresses[idx].name = data.name;
  if (data.street != null) user.addresses[idx].street = data.street;
  if (data.city != null) user.addresses[idx].city = data.city;
  if (data.state != null) user.addresses[idx].state = data.state;
  if (data.phone != null) user.addresses[idx].phone = data.phone;
  await user.save();
  return user.addresses[idx];
};

const deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  const idx = (user.addresses || []).findIndex((a) => a._id.toString() === addressId);
  if (idx < 0) return null;
  user.addresses.splice(idx, 1);
  await user.save();
  return true;
};

const setDefaultAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  const idx = (user.addresses || []).findIndex((a) => a._id.toString() === addressId);
  if (idx < 0) return null;
  const updates = {};
  user.addresses.forEach((_, i) => {
    updates[`addresses.${i}.isDefault`] = i === idx;
  });
  await User.findByIdAndUpdate(userId, { $set: updates });
  const updated = await User.findById(userId).select('addresses');
  return updated?.addresses?.[idx] || null;
};

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
