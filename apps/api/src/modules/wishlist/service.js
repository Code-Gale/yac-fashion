const User = require('../users/model');
const Product = require('../products/model');

const getWishlist = async (userId) => {
  const user = await User.findById(userId).populate({
    path: 'wishlist',
    select: 'name slug images price compareAtPrice stock isActive',
  });
  if (!user) return [];
  return (user.wishlist || []).filter((p) => p != null);
};

const addItem = async (userId, productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    const err = new Error('Product not found');
    err.statusCode = 404;
    throw err;
  }
  await User.findByIdAndUpdate(userId, { $addToSet: { wishlist: productId } });
  return getWishlist(userId);
};

const removeItem = async (userId, productId) => {
  await User.findByIdAndUpdate(userId, { $pull: { wishlist: productId } });
  return getWishlist(userId);
};

module.exports = {
  getWishlist,
  addItem,
  removeItem,
};
