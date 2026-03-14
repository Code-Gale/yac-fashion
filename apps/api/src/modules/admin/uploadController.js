const { uploadToMinio } = require('../../utils/upload');
const { success, error } = require('../../utils/response');
const { asyncHandler } = require('../../utils/asyncHandler');

const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return error(res, 'No images uploaded', 400);
  }
  const urls = await Promise.all(
    req.files.map((f) => uploadToMinio(f.buffer, f.originalname, f.mimetype))
  );
  success(res, urls);
});

module.exports = { uploadImages };
