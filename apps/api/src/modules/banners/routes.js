const express = require('express');
const bannerService = require('./service');
const { success } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const banners = await bannerService.getActiveBanners();
  success(res, banners);
}));

module.exports = router;
