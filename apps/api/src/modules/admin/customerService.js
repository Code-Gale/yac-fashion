const User = require('../users/model');
const Order = require('../orders/model');

const getCustomers = async (page = 1, limit = 20, search = '') => {
  const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
  const query = { role: 'customer' };
  if (search && search.trim()) {
    const s = search.trim();
    query.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
    ];
  }
  const [users, total] = await Promise.all([
    User.find(query).select('-passwordHash').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(query),
  ]);
  const customerIds = users.map((u) => u._id);
  const customerStats = customerIds.length > 0
    ? await Order.aggregate([
        { $match: { userId: { $in: customerIds }, paymentStatus: 'paid' } },
        { $group: { _id: '$userId', totalSpent: { $sum: '$total' }, orderCount: { $sum: 1 } } },
      ])
    : [];
  const statMap = Object.fromEntries(customerStats.map((s) => [s._id?.toString(), { orderCount: s.orderCount, totalSpent: s.totalSpent }]));
  const customers = users.map((u) => ({ ...u, orderCount: statMap[u._id?.toString()]?.orderCount ?? 0, totalSpent: statMap[u._id?.toString()]?.totalSpent ?? 0 }));
  return { customers, total, page: Math.max(1, page), totalPages: Math.ceil(total / Math.min(100, Math.max(1, limit))) };
};

const getCustomerById = async (id) => {
  const customer = await User.findOne({ _id: id, role: 'customer' }).select('-passwordHash');
  if (!customer) return null;
  const [orderCount, totalSpentResult] = await Promise.all([
    Order.countDocuments({ userId: id, paymentStatus: 'paid' }),
    Order.aggregate([
      { $match: { userId: customer._id, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
  ]);
  const totalSpent = totalSpentResult[0]?.total || 0;
  return { ...customer.toObject(), orderCount, totalSpent };
};

const updateCustomerStatus = async (id, isActive) => {
  return User.findOneAndUpdate(
    { _id: id, role: 'customer' },
    { isActive: !!isActive },
    { new: true }
  ).select('-passwordHash');
};

const updateCustomerRole = async (id, role) => {
  if (!['admin', 'staff', 'customer'].includes(role)) return null;
  return User.findByIdAndUpdate(
    id,
    { role },
    { new: true }
  ).select('-passwordHash');
};

module.exports = {
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  updateCustomerRole,
};
