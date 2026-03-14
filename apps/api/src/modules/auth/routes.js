const express = require('express');
const authController = require('./controller');
const { validate } = require('../../middleware/validate');
const { auth } = require('../../middleware/auth');
const { body } = require('express-validator');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().isLength({ max: 100 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  authController.login
);

router.post('/logout', auth, authController.logout);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty()],
  validate,
  authController.refresh
);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token').notEmpty(),
    body('password').isLength({ min: 8 }),
  ],
  validate,
  authController.resetPassword
);

module.exports = router;
