const Minio = require('minio');
const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_USE_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MINIO_PUBLIC_URL,
  CLIENT_URL,
  NODE_ENV,
} = require('./env');

const BUCKET = MINIO_BUCKET || 'yac-images';

const isDirectMinioUrl = (url) =>
  /localhost:9000|127\.0\.0\.1:9000|:9000(?:\/|$)/i.test(url) ||
  url.endsWith(`/${BUCKET}`);

const resolvePublicUrl = () => {
  const explicit = MINIO_PUBLIC_URL ? String(MINIO_PUBLIC_URL).replace(/\/+$/, '') : '';

  // External CDN/custom host (not direct MinIO)
  if (explicit && !isDirectMinioUrl(explicit)) {
    return explicit;
  }

  // Always serve uploads through the API proxy (reachable from the browser)
  if (CLIENT_URL && NODE_ENV === 'production') {
    return `${String(CLIENT_URL).replace(/\/+$/, '')}/api/files`;
  }

  const port = parseInt(process.env.PORT || '4000', 10);
  return `http://localhost:${port}/api/files`;
};

const PUBLIC_URL = resolvePublicUrl();

const minioClient = new Minio.Client({
  endPoint: MINIO_ENDPOINT || 'localhost',
  port: MINIO_PORT || 9000,
  useSSL: MINIO_USE_SSL || false,
  accessKey: MINIO_ACCESS_KEY || '',
  secretKey: MINIO_SECRET_KEY || '',
});

const BUCKET_POLICY = {
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Principal: { AWS: ['*'] },
      Action: ['s3:GetObject'],
      Resource: [`arn:aws:s3:::${BUCKET}/*`],
    },
  ],
};

const ensureBucket = async () => {
  try {
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET);
      await minioClient.setBucketPolicy(BUCKET, JSON.stringify(BUCKET_POLICY));
    } else {
      try {
        await minioClient.setBucketPolicy(BUCKET, JSON.stringify(BUCKET_POLICY));
      } catch (_) {}
    }
  } catch (err) {
    console.error('MinIO bucket setup error:', err.message);
  }
};

module.exports = { minioClient, BUCKET, PUBLIC_URL, ensureBucket };
