const REQUIRED = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MAIL_HOST',
  'MAIL_PORT',
  'MAIL_USER',
  'MAIL_APP_PASSWORD',
  'MAIL_FROM_ADDRESS',
  'MINIO_ENDPOINT',
  'MINIO_PORT',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'MINIO_BUCKET',
  'PAYSTACK_SECRET_KEY',
  'FLUTTERWAVE_SECRET_KEY',
];

const validateEnv = () => {
  const missing = REQUIRED.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || String(val).trim() === '';
  });
  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }
};

module.exports = { validateEnv };
