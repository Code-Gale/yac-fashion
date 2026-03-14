const { createClient } = require('redis');
const { REDIS_URL } = require('./env');

let client = null;

const getRedis = async () => {
  if (client) return client;
  try {
    client = createClient({ url: REDIS_URL });
    await client.connect();
    return client;
  } catch (err) {
    client = null;
    return null;
  }
};

module.exports = { getRedis };
