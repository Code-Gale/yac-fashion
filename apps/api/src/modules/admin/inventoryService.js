const Product = require('../products/model');

const getInventory = async (filter) => {
  const query = { isActive: true };
  if (filter === 'low_stock') {
    query.stock = { $lte: 10 };
  } else if (filter === 'out_of_stock') {
    query.stock = 0;
  }
  return Product.find(query)
    .populate('category', 'name')
    .select('name slug sku stock price images')
    .sort({ stock: 1 });
};

const updateStock = async (productId, stock) => {
  return Product.findByIdAndUpdate(
    productId,
    { stock: Math.max(0, parseInt(stock, 10) || 0) },
    { new: true }
  ).select('name slug stock');
};

module.exports = {
  getInventory,
  updateStock,
};
