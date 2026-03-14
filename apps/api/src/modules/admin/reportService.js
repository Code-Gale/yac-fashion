const Order = require('../orders/model');

const getSalesReport = async (from, to, groupBy = 'day') => {
  const matchStage = { paymentStatus: 'paid' };
  if (from || to) {
    matchStage.createdAt = {};
    if (from) matchStage.createdAt.$gte = new Date(from);
    if (to) matchStage.createdAt.$lte = new Date(to);
  }
  const groupField = groupBy === 'day' ? '$dateDay' : groupBy === 'week' ? '$dateWeek' : '$dateMonth';
  const dateProject = {};
  if (groupBy === 'day') {
    dateProject.dateDay = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
  } else if (groupBy === 'week') {
    dateProject.dateWeek = {
      $dateToString: {
        format: '%Y-%m-%d',
        date: {
          $dateFromParts: {
            isoWeekYear: { $isoWeekYear: '$createdAt' },
            isoWeek: { $isoWeek: '$createdAt' },
            dayOfWeek: 1,
          },
        },
      },
    };
  } else {
    dateProject.dateMonth = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
  }
  const periodsPipeline = [
    { $match: matchStage },
    { $addFields: dateProject },
    {
      $group: {
        _id: groupField,
        revenue: { $sum: '$total' },
        orderCount: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
    { $project: { date: '$_id', revenue: 1, orderCount: 1, _id: 0 } },
  ];
  const totalsPipeline = [
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$total' },
        totalOrders: { $sum: 1 },
      },
    },
  ];
  const topProductsPipeline = [
    { $match: matchStage },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.name',
        unitsSold: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: 10 },
    { $project: { name: '$_id', unitsSold: 1, revenue: 1, _id: 0 } },
  ];
  const [periods, totalsResult, topProducts] = await Promise.all([
    Order.aggregate(periodsPipeline),
    Order.aggregate(totalsPipeline),
    Order.aggregate(topProductsPipeline),
  ]);
  const totals = totalsResult[0] || { totalRevenue: 0, totalOrders: 0 };
  return {
    periods,
    totalRevenue: totals.totalRevenue,
    totalOrders: totals.totalOrders,
    topProducts,
  };
};

module.exports = { getSalesReport };
