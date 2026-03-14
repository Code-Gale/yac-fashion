const Order = require('../orders/model');
const userService = require('../users/service');
const { PAYSTACK_SECRET_KEY, FLUTTERWAVE_SECRET_KEY, CLIENT_URL } = require('../../config/env');

const initializePaystack = async (order) => {
  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: order.guestEmail || (await getOrderCustomerEmail(order)),
      amount: Math.round(order.total * 100),
      reference: order._id.toString(),
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
      },
    }),
  });
  const data = await res.json();
  if (!data.status || !data.data) {
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
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!data.status || data.data?.status !== 'success') {
    const err = new Error('Payment verification failed');
    err.statusCode = 400;
    throw err;
  }
  return data.data;
};

const initializeFlutterwave = async (order) => {
  const email = order.guestEmail || (await getOrderCustomerEmail(order));
  const res = await fetch('https://api.flutterwave.com/v3/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tx_ref: order._id.toString(),
      amount: order.total,
      currency: 'NGN',
      redirect_url: `${CLIENT_URL}/order-confirmed`,
      customer: { email: email || 'customer@example.com' },
      meta: { orderId: order._id.toString() },
    }),
  });
  const data = await res.json();
  if (data.status !== 'success' || !data.data?.link) {
    const err = new Error(data.message || 'Flutterwave initialization failed');
    err.statusCode = 400;
    throw err;
  }
  return { paymentLink: data.data.link };
};

const verifyFlutterwave = async (transactionId) => {
  const res = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
    headers: { 'Authorization': `Bearer ${FLUTTERWAVE_SECRET_KEY}` },
  });
  const data = await res.json();
  if (data.status !== 'success' || data.data?.status !== 'successful') {
    const err = new Error('Payment verification failed');
    err.statusCode = 400;
    throw err;
  }
  return data.data;
};

const getOrderCustomerEmail = async (order) => {
  if (order.guestEmail) return order.guestEmail;
  if (order.userId) {
    const user = await userService.findById(order.userId);
    return user?.email || null;
  }
  return null;
};

module.exports = {
  initializePaystack,
  verifyPaystack,
  initializeFlutterwave,
  verifyFlutterwave,
};
