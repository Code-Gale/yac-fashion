const path = require('path');
const rootEnv = path.resolve(process.cwd(), '.env');
const monorepoEnv = path.resolve(process.cwd(), '..', '..', '.env');
const configEnv = path.resolve(__dirname, '../../../.env');
require('dotenv').config({ path: rootEnv });
require('dotenv').config({ path: monorepoEnv });
require('dotenv').config({ path: configEnv });

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/yac-fashion',
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
  FLUTTERWAVE_SECRET_KEY: process.env.FLUTTERWAVE_SECRET_KEY,
  FLUTTERWAVE_PUBLIC_KEY: process.env.FLUTTERWAVE_PUBLIC_KEY,
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: parseInt(process.env.MAIL_PORT || '465', 10),
  MAIL_SECURE: process.env.MAIL_SECURE === 'true',
  MAIL_USER: process.env.MAIL_USER,
  MAIL_APP_PASSWORD: process.env.MAIL_APP_PASSWORD,
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'YAC Fashion House',
  MAIL_FROM_ADDRESS: process.env.MAIL_FROM_ADDRESS,
  MINIO_ENDPOINT: process.env.MINIO_ENDPOINT,
  MINIO_PORT: parseInt(process.env.MINIO_PORT || '9000', 10),
  MINIO_USE_SSL: process.env.MINIO_USE_SSL === 'true',
  MINIO_ACCESS_KEY: process.env.MINIO_ACCESS_KEY,
  MINIO_SECRET_KEY: process.env.MINIO_SECRET_KEY,
  MINIO_BUCKET: process.env.MINIO_BUCKET || 'yac-images',
  MINIO_PUBLIC_URL: process.env.MINIO_PUBLIC_URL,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};
