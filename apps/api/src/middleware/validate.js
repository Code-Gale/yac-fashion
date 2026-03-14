const { validationResult } = require('express-validator');
const { error } = require('../utils/response');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return error(res, errors.array()[0]?.msg || 'Validation failed', 400);
  }
  next();
};

module.exports = { validate };
