const Minio = require('minio');
const {
  MINIO_ENDPOINT,
  MINIO_PORT,
  MINIO_USE_SSL,
  MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY,
  MINIO_BUCKET,
  MINIO_PUBLIC_URL,
} = require('./env');

const BUCKET = MINIO_BUCKET || 'yac-images';
const PUBLIC_URL = MINIO_PUBLIC_URL || `http://localhost:9000/${BUCKET}`;

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
