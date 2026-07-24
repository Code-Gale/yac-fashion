const userService = require('../users/service');
const { processSuccessfulPayment } = require('./paymentCompletion');
const { PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY, CLIENT_URL } = require('../../config/env');

const AMOUNT_EPSILON = 0.01; // guard against float rounding on Naira amounts

const getOrderCustomerEmail = async (order) => {
  if (order.guestEmail) return order.guestEmail;
  if (order.userId) {
    const user = await userService.findById(order.userId);
    return user?.email || null;
  }
  return null;
};

/** Build the URL the customer lands on after leaving the payment gateway. */
const buildReturnUrl = (order, email) => {
  const base = `${String(CLIENT_URL).replace(/\/+$/, '')}/order-confirmed`;
  const params = new URLSearchParams({ orderNumber: order.orderNumber });
  if (email) params.set('email', email);
  return `${base}?${params.toString()}`;
};

/** Gateway request/response amounts and references must never be reused across
 * separate initialize attempts, or the gateway will reject the request as a
 * duplicate — even if the earlier attempt was abandoned, not completed. */
const uniqueReference = (order) => `${order._id.toString()}-${Date.now()}`;

const safeJson = async (res) => {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch (err) {
    const parseErr = new Error(`Gateway returned a non-JSON response (HTTP ${res.status})`);
    parseErr.statusCode = 502;
    throw parseErr;
  }
};

const initializePaystack = async (order) => {
  if (!PAYSTACK_SECRET_KEY) {
    const err = new Error('Paystack is not configured');
    err.statusCode = 503;
    throw err;
  }
  const email = order.guestEmail || (await getOrderCustomerEmail(order));
  if (!email) {
    const err = new Error('No email available for payment');
    err.statusCode = 400;
    throw err;
  }
  const reference = uniqueReference(order);
  let res;
  try {
    res = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(order.total * 100),
        reference,
        currency: 'NGN',
        callback_url: buildReturnUrl(order, email),
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
        },
      }),
    });
  } catch (err) {
    const netErr = new Error('Unable to reach Paystack. Please try again shortly.');
    netErr.statusCode = 503;
    throw netErr;
  }
  const data = await safeJson(res);
  if (!res.ok || !data.status || !data.data) {
    const err = new Error(data.message || 'Paystack initialization failed');
    err.statusCode = 400;
    throw err;
  }
  return {
    authorizationUrl: data.data.authorization_url,
    reference: data.data.reference,
  };
};

const verifyPaystack = async (reference) => {
  if (!PAYSTACK_SECRET_KEY) {
    const err = new Error('Paystack is not configured');
    err.statusCode = 503;
    throw err;
  }
  let res;
  try {
    res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
  } catch (err) {
    const netErr = new Error('Unable to reach Paystack. Please try again shortly.');
    netErr.statusCode = 503;
    throw netErr;
  }
  const data = await safeJson(res);
  if (!res.ok || !data.status || data.data?.status !== 'success') {
    const err = new Error('Payment verification failed');
    err.statusCode = 400;
    throw err;
  }
  return data.data;
};

/**
 * Verify a Paystack transaction against the gateway AND cross-check the
 * amount + order binding server-side, then idempotently finalize the order.
 * Used both as a client-triggered fallback (on return from checkout) and
 * could be called again safely — finalization itself is idempotent.
 */
const confirmPaystackPayment = async (order, reference) => {
  const data = await verifyPaystack(reference);

  if (data.metadata?.orderId && data.metadata.orderId !== order._id.toString()) {
    const err = new Error('Payment reference does not match this order');
    err.statusCode = 400;
    throw err;
  }
  const amountKobo = Math.round(order.total * 100);
  if (data.amount !== amountKobo) {
    const err = new Error('Payment amount does not match order total');
    err.statusCode = 400;
    throw err;
  }
  if (data.currency && data.currency !== 'NGN') {
    const err = new Error('Payment currency mismatch');
    err.statusCode = 400;
    throw err;
  }

  const updated = await processSuccessfulPayment(order._id, data.reference || reference);
  return updated || order;
};

const initializeFlutterwave = async (order) => {
  if (!FLUTTERWAVE_SECRET_KEY) {
    const err = new Error('Flutterwave is not configured');
    err.statusCode = 503;
    throw err;
  }
  const email = order.guestEmail || (await getOrderCustomerEmail(order));
  if (!email) {
    const err = new Error('No email available for payment');
    err.statusCode = 400;
    throw err;
  }
  const txRef = uniqueReference(order);
  let res;
  try {
    res = await fetch('https://api.flutterwave.com/v3/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: order.total,
        currency: 'NGN',
        redirect_url: buildReturnUrl(order, email),
        customer: { email },
        meta: { orderId: order._id.toString(), orderNumber: order.orderNumber },
      }),
    });
  } catch (err) {
    const netErr = new Error('Unable to reach Flutterwave. Please try again shortly.');
    netErr.statusCode = 503;
    throw netErr;
  }
  const data = await safeJson(res);
  if (!res.ok || data.status !== 'success' || !data.data?.link) {
    const err = new Error(data.message || 'Flutterwave initialization failed');
    err.statusCode = 400;
    throw err;
  }
  return { paymentLink: data.data.link, txRef };
};

const verifyFlutterwave = async (transactionId) => {
  if (!FLUTTERWAVE_SECRET_KEY) {
    const err = new Error('Flutterwave is not configured');
    err.statusCode = 503;
    throw err;
  }
  let res;
  try {
    res = await fetch(`https://api.flutterwave.com/v3/transactions/${encodeURIComponent(transactionId)}/verify`, {
      headers: { 'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}` },
    });
  } catch (err) {
    const netErr = new Error('Unable to reach Flutterwave. Please try again shortly.');
    netErr.statusCode = 503;
    throw netErr;
  }
  const data = await safeJson(res);
  if (!res.ok || data.status !== 'success' || data.data?.status !== 'successful') {
    const err = new Error('Payment verification failed');
    err.statusCode = 400;
    throw err;
  }
  return data.data;
};

/**
 * Verify a Flutterwave transaction against the gateway AND cross-check the
 * amount/currency + order binding server-side, then idempotently finalize.
 */
const confirmFlutterwavePayment = async (order, transactionId) => {
  const data = await verifyFlutterwave(transactionId);

  if (data.meta?.orderId && data.meta.orderId !== order._id.toString()) {
    const err = new Error('Payment reference does not match this order');
    err.statusCode = 400;
    throw err;
  }
  if (Math.abs((data.amount ?? 0) - order.total) > AMOUNT_EPSILON) {
    const err = new Error('Payment amount does not match order total');
    err.statusCode = 400;
    throw err;
  }
  if (data.currency !== 'NGN') {
    const err = new Error('Payment currency mismatch');
    err.statusCode = 400;
    throw err;
  }

  const updated = await processSuccessfulPayment(order._id, data.id?.toString?.() || data.tx_ref || transactionId);
  return updated || order;
};

module.exports = {
  initializePaystack,
  verifyPaystack,
  confirmPaystackPayment,
  initializeFlutterwave,
  verifyFlutterwave,
  confirmFlutterwavePayment,
};
