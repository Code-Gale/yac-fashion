require('./config/env');
const { validateEnv } = require('./config/startup');
const { ensureBucket } = require('./config/minio');
const { verifyTransporter } = require('./config/email');

validateEnv();

const app = require('./app');
const { PORT } = require('./config/env');
const { connectDB } = require('./config/db');

const LISTEN_HOST = process.env.LISTEN_HOST || '0.0.0.0';

async function backgroundInit() {
  await connectDB().catch((err) => {
    console.error('MongoDB connection failed:', err?.message || err);
  });
  await ensureBucket().catch((err) => {
    console.error('MinIO bucket setup error:', err?.message || err);
  });
  verifyTransporter().catch((err) => {
    console.error('Email transporter verification failed:', err?.message || err);
  });
}

app.listen(PORT, LISTEN_HOST, () => {
  console.log(`API listening on http://${LISTEN_HOST}:${PORT}`);
  void backgroundInit();
});
