const { transporter } = require('../config/email');
const { MAIL_FROM_NAME, MAIL_FROM_ADDRESS } = require('../config/env');

const sendEmail = async ({ to, subject, html }) => {
  if (!MAIL_FROM_ADDRESS) return;
  try {
    await transporter.sendMail({
      from: `${MAIL_FROM_NAME} <${MAIL_FROM_ADDRESS}>`,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email error:', err.message);
  }
};

module.exports = { sendEmail };
