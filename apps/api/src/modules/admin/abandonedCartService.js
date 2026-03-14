const { getRedis } = require('../../config/redis');

const CART_TTL_GUEST = 7 * 24 * 60 * 60;
const CART_TTL_USER = 30 * 24 * 60 * 60;
const TWO_HOURS = 2 * 60 * 60;
const GUEST_THRESHOLD = CART_TTL_GUEST - TWO_HOURS;
const USER_THRESHOLD = CART_TTL_USER - TWO_HOURS;

const getAbandonedCarts = async () => {
  const redis = await getRedis();
  if (!redis) return { keys: [] };
  const keys = [];
  let cursor = '0';
  do {
    const [nextCursor, foundKeys] = await redis.scan(cursor, 'MATCH', 'cart:*', 'COUNT', 100);
    cursor = String(nextCursor);
    for (const key of foundKeys) {
      if (!key.startsWith('cart:session:') && !key.startsWith('cart:user:')) continue;
      const ttl = await redis.ttl(key);
      if (ttl < 0) continue;
      const threshold = key.startsWith('cart:user:') ? USER_THRESHOLD : GUEST_THRESHOLD;
      if (ttl < threshold) {
        keys.push(key);
      }
    }
  } while (cursor !== '0');
  return { keys };
};

module.exports = { getAbandonedCarts };
