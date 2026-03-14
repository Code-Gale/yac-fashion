const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
  } catch (err) {
  }
};

module.exports = { connectDB };
