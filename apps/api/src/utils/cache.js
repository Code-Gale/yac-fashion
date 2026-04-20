const { getRedis } = require('../config/redis');

const CACHE_TTL = 60;

const CACHE_KEYS = {
  banners: 'cache:banners',
  categories: 'cache:categories',
  productsFeatured: 'cache:products:featured',
  productsFlashSale: 'cache:products:flash-sale',
};

/**
 * @template T
 * @param {string} key
 * @param {() => Promise<T>} fetcher
 * @returns {Promise<T>}
 */
const getCached = async (key, fetcher) => {
  try {
    const redis = await getRedis();
    if (redis) {
      const cached = await redis.get(key);
      if (cached) return JSON.parse(cached);
    }
  } catch (_) {
    /* ignore cache read errors */
  }
  const data = await fetcher();
  try {
    const redis = await getRedis();
    if (redis) await redis.setEx(key, CACHE_TTL, JSON.stringify(data));
  } catch (_) {
    /* ignore cache write errors */
  }
  return data;
};

const invalidateCacheKeys = async (keys) => {
  if (!keys?.length) return;
  try {
    const redis = await getRedis();
    if (!redis) return;
    for (const key of keys) {
      await redis.del(key);
    }
  } catch (_) {
    /* ignore */
  }
};

module.exports = {
  CACHE_TTL,
  CACHE_KEYS,
  getCached,
  invalidateCacheKeys,
};
