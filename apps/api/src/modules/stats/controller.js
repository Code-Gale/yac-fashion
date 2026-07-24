const statsService = require('./service');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const getHomepageStats = asyncHandler(async (req, res) => {
  const data = await statsService.getHomepageStats();
  success(res, data);
});

module.exports = { getHomepageStats };
