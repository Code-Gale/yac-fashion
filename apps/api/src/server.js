require('./config/env');
const { validateEnv } = require('./config/startup');
const { ensureBucket } = require('./config/minio');
const { verifyTransporter } = require('./config/email');

validateEnv();

const app = require('./app');
const { PORT } = require('./config/env');
const { connectDB } = require('./config/db');

Promise.all([connectDB(), ensureBucket(), verifyTransporter()]).then(() => {
  app.listen(PORT, () => {
  });
}).catch(() => {
  app.listen(PORT, () => {
  });
});
