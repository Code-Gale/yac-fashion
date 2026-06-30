const express = require('express');
const { minioClient, BUCKET } = require('../../config/minio');
const { asyncHandler } = require('../../utils/asyncHandler');

const router = express.Router();

// Public read-only access to uploaded product images (proxied from MinIO)
router.get(
  '/:filename',
  asyncHandler(async (req, res) => {
    const filename = req.params.filename;
    if (!filename || filename.includes('..') || filename.includes('/')) {
      return res.status(400).json({ success: false, message: 'Invalid filename' });
    }

    try {
      const stat = await minioClient.statObject(BUCKET, filename);
      const contentType =
        stat.metaData?.['content-type'] ||
        stat.metaData?.['Content-Type'] ||
        'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

      const stream = await minioClient.getObject(BUCKET, filename);
      stream.on('error', () => {
        if (!res.headersSent) res.status(404).json({ success: false, message: 'Not found' });
      });
      stream.pipe(res);
    } catch (err) {
      if (err.code === 'NotFound' || err.code === 'NoSuchKey') {
        return res.status(404).json({ success: false, message: 'Not found' });
      }
      throw err;
    }
  })
);

module.exports = router;
