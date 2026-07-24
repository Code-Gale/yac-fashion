const crypto = require('crypto');
const Order = require('../orders/model');
const { processSuccessfulPayment } = require('./paymentCompletion');
const { PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY, FLUTTERWAVE_WEBHOOK_SECRET_HASH } = require('../../config/env');

const AMOUNT_EPSILON = 0.01; // guard against float rounding on Naira amounts

const paystackWebhook = async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  if (!signature || !PAYSTACK_SECRET_KEY) {
    return res.status(401).send();
  }
  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : typeof req.body === 'string'
    ? Buffer.from(req.body)
    : Buffer.from(JSON.stringify(req.body));
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  if (hash !== signature) {
    return res.status(401).send();
  }
  // Acknowledge immediately — Paystack retries on non-2xx / slow responses
  res.status(200).send();

  let event;
  try {
    event = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(rawBody.toString());
  } catch (err) {
    console.error('Paystack webhook: invalid JSON payload', err.message);
    return;
  }

  try {
    if (event.event !== 'charge.success') return;
    const orderId = event.data?.metadata?.orderId;
    if (!orderId) return;
    const order = await Order.findById(orderId);
    if (!order) return;
    if (order.paymentMethod !== 'paystack') return;

    const amountKobo = Math.round(order.total * 100);
    if (event.data?.amount !== amountKobo) {
      console.error(`Paystack webhook: amount mismatch for order ${orderId} (expected ${amountKobo}, got ${event.data?.amount})`);
      return;
    }
    if (event.data?.currency && event.data.currency !== 'NGN') return;

    await processSuccessfulPayment(orderId, event.data?.reference || event.data?.id?.toString?.());
  } catch (err) {
    console.error('Paystack webhook processing error:', err);
  }
};

const flutterwaveWebhook = async (req, res) => {
  const verifHash = req.headers['verif-hash'];
  const expectedHash = FLUTTERWAVE_WEBHOOK_SECRET_HASH || FLUTTERWAVE_SECRET_KEY;
  if (!verifHash || !expectedHash) {
    return res.status(401).send();
  }

  // Flutterwave uses a plain secret hash comparison, not HMAC.
  // Prefer a dedicated FLUTTERWAVE_WEBHOOK_SECRET_HASH configured on the
  // Flutterwave dashboard (Settings > Webhooks); falls back to the API
  // secret key only if that's not set, for backwards compatibility.
  if (verifHash !== expectedHash) {
    return res.status(401).send();
  }

  res.status(200).send();

  let event;
  try {
    event = typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? req.body : JSON.parse(req.body.toString());
  } catch (err) {
    console.error('Flutterwave webhook: invalid JSON payload', err.message);
    return;
  }

  try {
    if (event.event !== 'charge.completed') return;
    if (event.data?.status !== 'successful') return;
    const orderId = event.data?.meta?.orderId;
    if (!orderId) return;
    const order = await Order.findById(orderId);
    if (!order) return;
    if (order.paymentMethod !== 'flutterwave') return;

    if (Math.abs((event.data?.amount ?? 0) - order.total) > AMOUNT_EPSILON) {
      console.error(`Flutterwave webhook: amount mismatch for order ${orderId} (expected ${order.total}, got ${event.data?.amount})`);
      return;
    }
    if (event.data?.currency !== 'NGN') return;

    await processSuccessfulPayment(orderId, event.data?.id?.toString?.() || event.data?.tx_ref);
  } catch (err) {
    console.error('Flutterwave webhook processing error:', err);
  }
};

module.exports = {
  paystackWebhook,
  flutterwaveWebhook,
};
