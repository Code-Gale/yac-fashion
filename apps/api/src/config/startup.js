const { NODE_ENV } = require('./env');

const REQUIRED_PRODUCTION = [
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'MONGO_URI',
  'REDIS_URL',
  'CLIENT_URL',
  'MINIO_ACCESS_KEY',
  'MINIO_SECRET_KEY',
  'PAYSTACK_SECRET_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'ADMIN_EMAIL',
];

const REQUIRED_ALWAYS = [
  'NODE_ENV',
  'PORT',
  'MONGO_URI',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const validateEnv = () => {
  const isProduction = NODE_ENV === 'production';
  const requiredVars = isProduction ? REQUIRED_PRODUCTION : REQUIRED_ALWAYS;
  
  const missing = requiredVars.filter((key) => {
    const val = process.env[key];
    return val === undefined || val === null || String(val).trim() === '';
  });
  
  if (missing.length > 0) {
    console.error(`[${NODE_ENV}] Missing required environment variables:`, missing.join(', '));
    if (isProduction) {
      console.error('Cannot start in production without all required environment variables');
      process.exit(1);
    } else {
      console.warn('Warning: Some environment variables are missing. Application may not function correctly.');
    }
  }
  
  // Validate JWT secrets have minimum length
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('Warning: JWT_SECRET should be at least 32 characters long for security');
  }
  if (process.env.JWT_REFRESH_SECRET && process.env.JWT_REFRESH_SECRET.length < 32) {
    console.warn('Warning: JWT_REFRESH_SECRET should be at least 32 characters long for security');
  }
};

module.exports = { validateEnv };
