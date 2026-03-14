const Order = require('../orders/model');
const User = require('../users/model');
const Product = require('../products/model');

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDashboard = async () => {
  const todayStart = startOfToday();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const [totalRevenueResult, totalOrders, totalCustomers, totalProducts, revenueTodayResult, ordersToday, lowStockProducts, recentOrders, revenueByDay, ordersByStatus] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.countDocuments(),
    User.countDocuments({ role: 'customer' }),
    Product.countDocuments({ isActive: true }),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: todayStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: todayStart } }),
    Product.find({ isActive: true, stock: { $lte: 10 } }).sort({ stock: 1 }).limit(5).select('name slug stock images'),
    Order.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(5),
    Order.aggregate([
      { $match: { paymentStatus: 'paid', createdAt: { $gte: thirtyDaysAgo } } },
      { $addFields: { dateDay: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } } } },
      { $group: { _id: '$dateDay', revenue: { $sum: '$total' } } },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', revenue: 1, _id: 0 } },
    ]),
    Order.aggregate([
      { $match: { status: { $in: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
  ]);
  const totalRevenue = totalRevenueResult[0]?.total || 0;
  const revenueToday = revenueTodayResult[0]?.total || 0;
  const prevDayStart = new Date(todayStart);
  prevDayStart.setDate(prevDayStart.getDate() - 1);
  const revenueYesterdayResult = await Order.aggregate([
    { $match: { paymentStatus: 'paid', createdAt: { $gte: prevDayStart, $lt: todayStart } } },
    { $group: { _id: null, total: { $sum: '$total' } } },
  ]);
  const revenueYesterday = revenueYesterdayResult[0]?.total || 0;
  const revenueChange = revenueYesterday > 0 ? ((revenueToday - revenueYesterday) / revenueYesterday) * 100 : 0;
  return {
    totalRevenue,
    totalOrders,
    totalCustomers,
    totalProducts,
    revenueToday,
    ordersToday,
    lowStockProducts,
    recentOrders,
    revenueByDay,
    ordersByStatus,
    revenueChange,
  };
};

module.exports = { getDashboard };
