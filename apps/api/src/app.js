const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const { CLIENT_URL } = require('./config/env');
const { authRateLimiter } = require('./middleware/rateLimiter');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/routes');
const userRoutes = require('./modules/users/routes');
const productRoutes = require('./modules/products/routes');
const categoryRoutes = require('./modules/categories/routes');
const cartRoutes = require('./modules/cart/routes');
const orderRoutes = require('./modules/orders/routes');
const accountRoutes = require('./modules/account/routes');
const paymentRoutes = require('./modules/payments/routes');
const couponRoutes = require('./modules/coupons/routes');
const bannerRoutes = require('./modules/banners/routes');
const adminRoutes = require('./modules/admin/routes');

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
const allowedOrigins = [...new Set([
  'https://yac.voidgrid.com',
  'https://www.yac.voidgrid.com',
  CLIENT_URL,
].filter(Boolean))];
const corsOrigin = process.env.NODE_ENV === 'development'
  ? true
  : (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(null, false);
    };
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-session-id'],
}));
app.use(morgan('dev'));

app.post(
  '/api/payments/paystack/webhook',
  express.raw({ type: 'application/json' }),
  require('./modules/payments/webhookController').paystackWebhook
);
app.post(
  '/api/payments/flutterwave/webhook',
  express.raw({ type: 'application/json' }),
  require('./modules/payments/webhookController').flutterwaveWebhook
);

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/robots.txt', (req, res) => {
  const base = `${req.protocol}://${req.get('host')}`;
  res.type('text/plain');
  res.send(`User-agent: *\nAllow: /\n\nSitemap: ${base}/api/sitemap.xml\n`);
});

app.get('/api/sitemap.xml', async (req, res, next) => {
  try {
    const { getSitemap } = require('./modules/sitemap/service');
    const xml = await getSitemap();
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    next(err);
  }
});

app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

module.exports = app;
