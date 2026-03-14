const addressService = require('./addressService');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const getAddresses = asyncHandler(async (req, res) => {
  const addresses = await addressService.getAddresses(req.user.userId);
  success(res, addresses);
});

const addAddress = asyncHandler(async (req, res) => {
  const address = await addressService.addAddress(req.user.userId, req.body);
  success(res, address, 201);
});

const updateAddress = asyncHandler(async (req, res) => {
  const address = await addressService.updateAddress(req.user.userId, req.params.addressId, req.body);
  if (!address) {
    return error(res, 'Address not found', 404);
  }
  success(res, address);
});

const deleteAddress = asyncHandler(async (req, res) => {
  const deleted = await addressService.deleteAddress(req.user.userId, req.params.addressId);
  if (!deleted) {
    return error(res, 'Address not found', 404);
  }
  success(res, { message: 'Address deleted' });
});

const setDefaultAddress = asyncHandler(async (req, res) => {
  const address = await addressService.setDefaultAddress(req.user.userId, req.params.addressId);
  if (!address) {
    return error(res, 'Address not found', 404);
  }
  success(res, address);
});

module.exports = {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
};
