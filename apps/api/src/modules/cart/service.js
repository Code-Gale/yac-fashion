const { getRedis } = require('../../config/redis');
const Product = require('../products/model');

const CART_TTL_GUEST = 7 * 24 * 60 * 60;
const CART_TTL_USER = 30 * 24 * 60 * 60;

const getCartKey = (userId, sessionId) => {
  if (userId) return `cart:user:${userId}`;
  if (sessionId) return `cart:session:${sessionId}`;
  return null;
};

const getCartTtl = (userId) => (userId ? CART_TTL_USER : CART_TTL_GUEST);

const getCart = async (cartKey, ttl) => {
  const redis = await getRedis();
  if (!redis || !cartKey) return { items: [], subtotal: 0, itemCount: 0, couponCode: null, discount: 0 };
  const raw = await redis.get(cartKey);
  if (!raw) return { items: [], subtotal: 0, itemCount: 0, couponCode: null, discount: 0 };
  try {
    const data = JSON.parse(raw);
    const items = data.items || [];
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
    return {
      items,
      subtotal,
      itemCount,
      couponCode: data.couponCode || null,
      discount: data.discount || 0,
    };
  } catch (err) {
    return { items: [], subtotal: 0, itemCount: 0, couponCode: null, discount: 0 };
  }
};

const saveCart = async (cartKey, data, ttl) => {
  const redis = await getRedis();
  if (!redis || !cartKey) return;
  await redis.setEx(cartKey, ttl, JSON.stringify(data));
};

const toCartItem = (product, quantity) => ({
  productId: product._id.toString(),
  name: product.name,
  slug: product.slug,
  image: product.images?.[0] || null,
  price: product.price,
  stock: product.stock,
  quantity,
});

const addItem = async (cartKey, ttl, productId, quantity) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    const err = new Error('Product not found or inactive');
    err.statusCode = 404;
    throw err;
  }
  const qty = Math.max(1, Math.floor(Number(quantity) || 1));
  if (qty > product.stock) {
    const err = new Error('Insufficient stock');
    err.statusCode = 400;
    throw err;
  }
  const redis = await getRedis();
  if (!redis || !cartKey) {
    const err = new Error('Cart unavailable');
    err.statusCode = 503;
    throw err;
  }
  const raw = await redis.get(cartKey);
  let data = raw ? JSON.parse(raw) : { items: [], couponCode: null, discount: 0 };
  const items = data.items || [];
  const idx = items.findIndex((i) => i.productId === productId);
  const newQty = idx >= 0 ? Math.min(items[idx].quantity + qty, product.stock) : qty;
  const item = toCartItem(product, newQty);
  if (idx >= 0) {
    items[idx] = item;
  } else {
    items.push(item);
  }
  data.items = items;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  data.subtotal = subtotal;
  await redis.setEx(cartKey, ttl, JSON.stringify(data));
  return {
    items,
    subtotal,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    couponCode: data.couponCode || null,
    discount: data.discount || 0,
  };
};

const updateItem = async (cartKey, ttl, productId, quantity) => {
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) {
    const err = new Error('Product not found or inactive');
    err.statusCode = 404;
    throw err;
  }
  const qty = Math.max(0, Math.floor(Number(quantity) || 0));
  if (qty > product.stock) {
    const err = new Error('Insufficient stock');
    err.statusCode = 400;
    throw err;
  }
  const redis = await getRedis();
  if (!redis || !cartKey) {
    const err = new Error('Cart unavailable');
    err.statusCode = 503;
    throw err;
  }
  const raw = await redis.get(cartKey);
  let data = raw ? JSON.parse(raw) : { items: [], couponCode: null, discount: 0 };
  const items = (data.items || []).filter((i) => i.productId !== productId);
  if (qty > 0) {
    items.push(toCartItem(product, qty));
  }
  data.items = items;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  data.subtotal = subtotal;
  await redis.setEx(cartKey, ttl, JSON.stringify(data));
  return {
    items,
    subtotal,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    couponCode: data.couponCode || null,
    discount: data.discount || 0,
  };
};

const removeItem = async (cartKey, ttl, productId) => {
  const redis = await getRedis();
  if (!redis || !cartKey) {
    const err = new Error('Cart unavailable');
    err.statusCode = 503;
    throw err;
  }
  const raw = await redis.get(cartKey);
  let data = raw ? JSON.parse(raw) : { items: [], couponCode: null, discount: 0 };
  const items = (data.items || []).filter((i) => i.productId !== productId);
  data.items = items;
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  data.subtotal = subtotal;
  await redis.setEx(cartKey, ttl, JSON.stringify(data));
  return {
    items,
    subtotal,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    couponCode: data.couponCode || null,
    discount: data.discount || 0,
  };
};

const clearCart = async (cartKey) => {
  const redis = await getRedis();
  if (redis && cartKey) {
    await redis.del(cartKey);
  }
  return { items: [], subtotal: 0, itemCount: 0, couponCode: null, discount: 0 };
};

const mergeCarts = async (guestCartKey, userCartKey) => {
  const redis = await getRedis();
  if (!redis) return { items: [], subtotal: 0, itemCount: 0, couponCode: null, discount: 0 };
  const guestRaw = guestCartKey ? await redis.get(guestCartKey) : null;
  const userRaw = userCartKey ? await redis.get(userCartKey) : null;
  const guestItems = guestRaw ? (JSON.parse(guestRaw).items || []) : [];
  const userData = userRaw ? JSON.parse(userRaw) : { items: [], couponCode: null, discount: 0 };
  const userItems = userData.items || [];
  const merged = new Map();
  for (const i of userItems) {
    merged.set(i.productId, { ...i });
  }
  for (const i of guestItems) {
    const existing = merged.get(i.productId);
    if (existing) {
      existing.quantity = Math.min(existing.quantity + i.quantity, existing.stock);
    } else {
      merged.set(i.productId, { ...i });
    }
  }
  const items = Array.from(merged.values());
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const data = {
    items,
    subtotal,
    couponCode: userData.couponCode || null,
    discount: userData.discount || 0,
  };
  await redis.setEx(userCartKey, CART_TTL_USER, JSON.stringify(data));
  if (guestCartKey) await redis.del(guestCartKey);
  return {
    items,
    subtotal,
    itemCount: items.reduce((s, i) => s + i.quantity, 0),
    couponCode: data.couponCode,
    discount: data.discount,
  };
};

module.exports = {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCarts,
};
