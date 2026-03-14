const nodemailer = require('nodemailer');
const {
  MAIL_HOST,
  MAIL_PORT,
  MAIL_SECURE,
  MAIL_USER,
  MAIL_APP_PASSWORD,
} = require('./env');

const transporter = nodemailer.createTransport({
  host: MAIL_HOST,
  port: MAIL_PORT,
  secure: MAIL_SECURE,
  auth: {
    user: MAIL_USER,
    pass: MAIL_APP_PASSWORD,
  },
});

const verifyTransporter = async () => {
  try {
    await transporter.verify();
    console.log('Email transporter verified');
  } catch (err) {
    console.error('Email transporter verification failed:', err.message);
  }
};

module.exports = { transporter, verifyTransporter };
