const { randomUUID } = require('crypto');
const { minioClient, BUCKET, PUBLIC_URL } = require('../config/minio');

const MIME_TO_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const getExtFromMimetype = (mimetype) => {
  return MIME_TO_EXT[mimetype] || 'jpg';
};

const uploadToMinio = async (fileBuffer, originalName, mimetype) => {
  const ext = getExtFromMimetype(mimetype);
  const filename = `${randomUUID()}-${Date.now()}.${ext}`;
  await minioClient.putObject(BUCKET, filename, fileBuffer, fileBuffer.length, {
    'Content-Type': mimetype,
  });
  return `${PUBLIC_URL.replace(/\/$/, '')}/${filename}`;
};

const deleteFromMinio = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  const base = PUBLIC_URL.replace(/\/$/, '');
  if (!fileUrl.startsWith(base + '/') && !fileUrl.startsWith(base)) return;
  const filename = fileUrl.replace(base, '').replace(/^\//, '');
  if (!filename) return;
  try {
    await minioClient.removeObject(BUCKET, filename);
  } catch (_) {}
};

module.exports = { uploadToMinio, deleteFromMinio };
