const Order = require('./model');
const Product = require('../products/model');
const couponService = require('../coupons/service');
const cartService = require('../cart/service');
const paymentService = require('../payments/service');
const { resolveShippingOption } = require('../shipping/service');
const { sendEmail } = require('../../utils/email');
const { orderConfirmation } = require('../../utils/emailTemplates');
const { PAYSTACK_PUBLIC_KEY, FLUTTERWAVE_PUBLIC_KEY, CLIENT_URL } = require('../../config/env');

const generateOrderNumber = () => {
  const date = new Date();
  const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `YAC-${yyyymmdd}-${random}`;
};

const checkout = async (data, userId, cartKey) => {
  const { guestEmail, items, shippingAddress, shippingOption, paymentMethod, couponCode } = data;
  if (!userId && !guestEmail) {
    const err = new Error('guestEmail required when not authenticated');
    err.statusCode = 400;
    throw err;
  }
  if (!items || !Array.isArray(items) || items.length === 0) {
    const err = new Error('At least one item required');
    err.statusCode = 400;
    throw err;
  }
  if (!shippingAddress || !shippingAddress.name || !shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.phone) {
    const err = new Error('Invalid shipping address');
    err.statusCode = 400;
    throw err;
  }
  if (!shippingOption || !shippingOption.id) {
    const err = new Error('Shipping option required');
    err.statusCode = 400;
    throw err;
  }
  
  // Resolve shipping price/estimate server-side for the customer's state —
  // never trust a client-provided price. This looks up the active shipping
  // method by id, then applies any per-state rate override on top of it.
  const validatedShipping = await resolveShippingOption(shippingOption.id, shippingAddress.state);
  if (!validatedShipping) {
    const err = new Error('Invalid shipping option');
    err.statusCode = 400;
    throw err;
  }
  const validMethods = ['paystack', 'flutterwave', 'bank_transfer', 'cash_on_delivery'];
  if (!validMethods.includes(paymentMethod)) {
    const err = new Error('Invalid payment method');
    err.statusCode = 400;
    throw err;
  }
  
  // Batch load all products at once to avoid N+1 queries
  const productIds = items.map(entry => entry.productId);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));
  
  // Validate products and build order items with flash sale pricing
  const orderItems = [];
  let subtotal = 0;
  const now = new Date();
  
  for (const entry of items) {
    const product = productMap.get(entry.productId.toString());
    if (!product) {
      const err = new Error(`Product ${entry.productId} not found or inactive`);
      err.statusCode = 400;
      throw err;
    }
    const qty = Math.max(1, Math.floor(Number(entry.quantity) || 1));
    if (qty > product.stock) {
      const err = new Error(`Insufficient stock for ${product.name}`);
      err.statusCode = 400;
      throw err;
    }
    
    // Apply flash sale price if active
    let itemPrice = product.price;
    if (product.flashSalePrice != null && product.flashSaleEndsAt && product.flashSaleEndsAt > now) {
      itemPrice = product.flashSalePrice;
    }
    
    const itemSubtotal = itemPrice * qty;
    subtotal += itemSubtotal;
    orderItems.push({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] || null,
      price: itemPrice,
      quantity: qty,
      subtotal: itemSubtotal,
    });
  }
  
  // Validate and apply coupon with atomic usage increment
  let discount = 0;
  let appliedCouponCode = null;
  if (couponCode && couponCode.trim()) {
    const couponResult = await couponService.validate(couponCode.trim(), subtotal);
    if (couponResult.valid) {
      discount = couponResult.discountAmount;
      appliedCouponCode = couponResult.coupon.code;
      
      // Atomically increment coupon usage if it has a limit
      if (couponResult.coupon.usageLimit != null) {
        const updated = await require('../coupons/model').findOneAndUpdate(
          { 
            code: appliedCouponCode,
            $expr: { $lt: ['$usedCount', '$usageLimit'] }
          },
          { $inc: { usedCount: 1 } },
          { new: true }
        );
        if (!updated) {
          const err = new Error('Coupon usage limit exceeded');
          err.statusCode = 400;
          throw err;
        }
      } else {
        // No limit, just increment
        await require('../coupons/model').findOneAndUpdate(
          { code: appliedCouponCode },
          { $inc: { usedCount: 1 } }
        );
      }
    }
  }
  
  const shippingFee = validatedShipping.price;
  const total = Math.max(0, subtotal - discount + shippingFee);
  let orderNumber = generateOrderNumber();
  let exists = await Order.findOne({ orderNumber });
  while (exists) {
    orderNumber = generateOrderNumber();
    exists = await Order.findOne({ orderNumber });
  }
  
  // Atomically decrement stock for ALL payment methods with conditional check
  const stockUpdates = [];
  for (const item of orderItems) {
    const result = await Product.findOneAndUpdate(
      { 
        _id: item.productId,
        stock: { $gte: item.quantity },
        isActive: true
      },
      { $inc: { stock: -item.quantity } },
      { new: true }
    );
    if (!result) {
      // Rollback previously decremented stock
      for (const rollbackItem of stockUpdates) {
        await Product.findByIdAndUpdate(
          rollbackItem.productId,
          { $inc: { stock: rollbackItem.quantity } }
        );
      }
      // Rollback coupon if it was incremented
      if (appliedCouponCode) {
        await require('../coupons/model').findOneAndUpdate(
          { code: appliedCouponCode },
          { $inc: { usedCount: -1 } }
        );
      }
      const err = new Error(`Insufficient stock for ${item.name} (concurrent checkout)`);
      err.statusCode = 409;
      throw err;
    }
    stockUpdates.push(item);
  }
  
  const isCod = paymentMethod === 'cash_on_delivery';
  const order = await Order.create({
    orderNumber,
    userId: userId || null,
    guestEmail: userId ? null : (guestEmail?.trim() || '').toLowerCase() || null,
    items: orderItems,
    shippingAddress: {
      name: shippingAddress.name,
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      phone: shippingAddress.phone,
    },
    shippingOption: {
      id: validatedShipping.id,
      label: validatedShipping.label,
      price: validatedShipping.price,
    },
    subtotal,
    discount,
    shippingFee,
    total,
    couponCode: appliedCouponCode,
    paymentMethod,
    paymentStatus: isCod ? 'pending' : 'pending',
    status: isCod ? 'confirmed' : 'pending',
  });
  
  if (cartKey) {
    await cartService.clearCart(cartKey);
  }
  let email = null;
  if (userId) {
    const user = await require('../users/service').findById(userId);
    email = user?.email || null;
  } else {
    email = guestEmail?.trim() || null;
  }
  if (email) {
    const tpl = orderConfirmation(order);
    sendEmail({ to: email, subject: tpl.subject, html: tpl.html }).catch((err) => console.error('Email error:', err));
  }
  const response = { order };
  if (paymentMethod === 'paystack') {
    // The order (and its reserved stock) must survive even if the gateway
    // call fails — the customer can retry payment for this exact order via
    // POST /payments/paystack/initialize using order._id. Never throw here:
    // that would leave a "phantom" order with decremented stock and no way
    // for the customer to find it again.
    try {
      const init = await paymentService.initializePaystack(order);
      response.paymentInitiation = { ...init, publicKey: PAYSTACK_PUBLIC_KEY };
    } catch (err) {
      console.error(`Paystack initialization failed for order ${order._id}:`, err.message);
      response.paymentError = 'We could not start your Paystack payment. You can retry from your order confirmation.';
    }
  } else if (paymentMethod === 'flutterwave') {
    try {
      const init = await paymentService.initializeFlutterwave(order);
      response.paymentInitiation = { ...init, publicKey: FLUTTERWAVE_PUBLIC_KEY };
    } catch (err) {
      console.error(`Flutterwave initialization failed for order ${order._id}:`, err.message);
      response.paymentError = 'We could not start your Flutterwave payment. You can retry from your order confirmation.';
    }
  } else if (paymentMethod === 'bank_transfer') {
    response.statusLabel = 'Awaiting Payment';
    response.instructions = {
      message: `Transfer ₦${order.total.toLocaleString()} to account details below. Your order will be confirmed once payment is received.`,
      orderNumber,
      total: order.total,
    };
  } else if (paymentMethod === 'cash_on_delivery') {
    response.statusLabel = 'Order Confirmed';
    response.instructions = {
      message: 'Pay on delivery when your order arrives.',
      orderNumber,
    };
  }
  return response;
};

const findByUser = async (userId, page = 1, limit = 20, status) => {
  const skip = (Math.max(1, page) - 1) * Math.min(50, Math.max(1, limit));
  const query = { userId };
  if (status && status.trim()) query.status = status.trim();
  const [orders, total] = await Promise.all([
    Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(query),
  ]);
  return { orders, total, page: Math.max(1, page), totalPages: Math.ceil(total / Math.min(50, Math.max(1, limit))) };
};

const findById = async (id) => {
  return Order.findById(id);
};

const track = async (orderNumber, email) => {
  if (!orderNumber?.trim() || !email?.trim()) return null;
  const order = await Order.findOne({ orderNumber: orderNumber.trim() });
  if (!order) return null;
  const emailLower = email.trim().toLowerCase();
  const orderGuestEmail = (order.guestEmail || '').toLowerCase();
  if (orderGuestEmail && orderGuestEmail === emailLower) {
    return {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentMethod: order.paymentMethod,
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
      shippingAddress: { city: order.shippingAddress?.city, state: order.shippingAddress?.state },
      subtotal: order.subtotal,
      discount: order.discount,
      shippingFee: order.shippingFee,
      total: order.total,
      updatedAt: order.updatedAt,
    };
  }
  if (order.userId) {
    const user = await require('../users/service').findById(order.userId);
    if (user?.email?.toLowerCase() === emailLower) {
      return {
        orderNumber: order.orderNumber,
        status: order.status,
        paymentMethod: order.paymentMethod,
        items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: i.price })),
        shippingAddress: { city: order.shippingAddress?.city, state: order.shippingAddress?.state },
        subtotal: order.subtotal,
        discount: order.discount,
        shippingFee: order.shippingFee,
        total: order.total,
        updatedAt: order.updatedAt,
      };
    }
  }
  return null;
};

const updateStatus = async (id, status) => {
  return Order.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
};

module.exports = {
  checkout,
  findByUser,
  findById,
  track,
  updateStatus,
};
