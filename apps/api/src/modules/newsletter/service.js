const Subscriber = require('./model');

const subscribe = async (email, source = 'homepage') => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }
  // Upsert so re-subscribing (e.g. after a previous unsubscribe) reactivates
  // the row instead of erroring on the unique index.
  await Subscriber.findOneAndUpdate(
    { email: normalized },
    { $set: { isActive: true, source }, $setOnInsert: { email: normalized } },
    { upsert: true, runValidators: true }
  );
  return { subscribed: true };
};

module.exports = { subscribe };
