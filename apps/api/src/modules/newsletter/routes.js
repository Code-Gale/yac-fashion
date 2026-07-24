const express = require('express');
const newsletterController = require('./controller');
const { validate } = require('../../middleware/validate');
const { body } = require('express-validator');

const router = express.Router();

router.post(
  '/subscribe',
  [body('email').trim().isEmail(), body('source').optional().trim()],
  validate,
  newsletterController.subscribe
);

module.exports = router;
