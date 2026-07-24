const newsletterService = require('./service');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const subscribe = asyncHandler(async (req, res) => {
  const result = await newsletterService.subscribe(req.body.email, req.body.source);
  success(res, result, 201);
});

module.exports = { subscribe };
