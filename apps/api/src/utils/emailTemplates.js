const { MAIL_FROM_NAME, MAIL_FROM_ADDRESS, CLIENT_URL } = require('../config/env');

const fmt = (n) => (typeof n === 'number' ? n.toFixed(2) : '0.00');

const baseLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YAC Fashion House</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; background: #f4f2ee; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .card { background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
    .header { background: #1a1a2e; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-family: 'Playfair Display', serif; font-size: 24px; color: #c9a84c; }
    .body { padding: 32px; color: #1a1a1a; line-height: 1.6; }
    .footer { padding: 20px 32px; background: #fafaf8; font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { padding: 10px 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #fafaf8; font-weight: 600; }
    .btn { display: inline-block; padding: 14px 28px; background: #c9a84c; color: #fff !important; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 16px 0; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-confirmed { background: #d1fae5; color: #065f46; }
    .badge-shipped { background: #dbeafe; color: #1e40af; }
    .badge-delivered { background: #d1fae5; color: #065f46; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <h1>YAC Fashion House</h1>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        YAC Fashion House — Premium Fashion. If you did not expect this email, please ignore it.
      </div>
    </div>
  </div>
</body>
</html>
`;

const orderConfirmation = (order) => {
  const itemsHtml = (order.items || [])
    .map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₦${fmt((i.price || 0) * (i.quantity || 1))}</td></tr>`)
    .join('');
  const content = `
    <h2 style="margin-top:0">Thank you for your order!</h2>
    <p>We have received your order and will process it shortly.</p>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <table>
      <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
      ${itemsHtml}
    </table>
    <p><strong>Subtotal:</strong> ₦${fmt(order.subtotal)}</p>
    <p><strong>Discount:</strong> ₦${fmt(order.discount || 0)}</p>
    <p><strong>Shipping:</strong> ₦${fmt(order.shippingFee)}</p>
    <p><strong>Total:</strong> ₦${fmt(order.total)}</p>
    <p><strong>Shipping to:</strong> ${order.shippingAddress?.name}, ${order.shippingAddress?.street}, ${order.shippingAddress?.city}, ${order.shippingAddress?.state}</p>
    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
    <p><a href="${CLIENT_URL}/track" class="btn">Track your order</a></p>
  `;
  return { subject: `Order Confirmed — #${order.orderNumber}`, html: baseLayout(content) };
};

const paymentReceipt = (order) => {
  const content = `
    <h2 style="margin-top:0">Payment Received</h2>
    <p>We have received your payment for order <strong>#${order.orderNumber}</strong>.</p>
    <p><strong>Amount Paid:</strong> ₦${fmt(order.total)}</p>
    <p><strong>Payment Reference:</strong> ${order.paymentRef || 'N/A'}</p>
    <p><a href="${CLIENT_URL}/account/orders" class="btn">View your orders</a></p>
  `;
  return { subject: `Payment Received — #${order.orderNumber}`, html: baseLayout(content) };
};

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const orderStatusUpdate = (order) => {
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const badgeClass = `badge-${order.status}`;
  let message = `Your order #${order.orderNumber} status has been updated.`;
  if (order.status === 'shipped') message = 'Your order is on its way!';
  if (order.status === 'delivered') message = 'Your order has been delivered. Thank you for shopping with us!';
  const content = `
    <h2 style="margin-top:0">Order Update</h2>
    <p>${message}</p>
    <p><span class="badge ${badgeClass}">${statusLabel}</span></p>
    <p><a href="${CLIENT_URL}/account/orders" class="btn">View order details</a></p>
  `;
  return { subject: `Your Order #${order.orderNumber} — ${statusLabel}`, html: baseLayout(content) };
};

const passwordReset = (resetUrl, name) => {
  const greeting = name ? `Hi ${name},` : 'Hi,';
  const content = `
    <h2 style="margin-top:0">Reset your password</h2>
    <p>${greeting}</p>
    <p>You requested a password reset. Click the button below to set a new password:</p>
    <p><a href="${resetUrl}" class="btn">Reset Password</a></p>
    <p style="font-size:14px;color:#6b7280">This link expires in 1 hour. If you did not request this, please ignore this email.</p>
  `;
  return { subject: 'Reset your YAC password', html: baseLayout(content) };
};

const adminNewOrder = (order) => {
  const itemsHtml = (order.items || [])
    .map((i) => `<tr><td>${i.name}</td><td>${i.quantity}</td><td>₦${fmt((i.price || 0) * (i.quantity || 1))}</td></tr>`)
    .join('');
  const customerName = order.shippingAddress?.name || (order.userId?.name) || 'Guest';
  const customerEmail = order.guestEmail || (order.userId?.email) || 'N/A';
  const content = `
    <h2 style="margin-top:0">New Order</h2>
    <p><strong>Order Number:</strong> ${order.orderNumber}</p>
    <p><strong>Customer:</strong> ${customerName} (${customerEmail})</p>
    <p><strong>Total:</strong> ₦${fmt(order.total)}</p>
    <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
    <table>
      <tr><th>Item</th><th>Qty</th><th>Amount</th></tr>
      ${itemsHtml}
    </table>
    <p><a href="${CLIENT_URL}/admin/orders" class="btn">View in Admin</a></p>
  `;
  return { subject: `[YAC Admin] New Order #${order.orderNumber}`, html: baseLayout(content) };
};

module.exports = {
  orderConfirmation,
  paymentReceipt,
  orderStatusUpdate,
  passwordReset,
  adminNewOrder,
};
