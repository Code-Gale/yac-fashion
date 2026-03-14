const path = require('path');
const rootEnv = path.resolve(__dirname, '../../../../.env');
require('dotenv').config({ path: rootEnv });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../modules/users/model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yac-fashion';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_INITIAL_PASSWORD = process.env.ADMIN_INITIAL_PASSWORD;

async function seedAdmin() {
  if (!ADMIN_EMAIL || !ADMIN_INITIAL_PASSWORD) {
    console.error('ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD must be set in .env');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  try {
    const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });
    if (existing) {
      console.log('Admin already exists');
      return;
    }
    const passwordHash = await bcrypt.hash(ADMIN_INITIAL_PASSWORD, 12);
    await User.create({
      name: 'YAC Admin',
      email: ADMIN_EMAIL.toLowerCase(),
      passwordHash,
      role: 'admin',
      isActive: true,
    });
    console.log('Admin account created:', ADMIN_EMAIL);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin().catch((err) => {
  console.error(err);
  process.exit(1);
});
