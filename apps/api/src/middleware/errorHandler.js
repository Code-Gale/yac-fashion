const { error } = require('../utils/response');
const { NODE_ENV } = require('../config/env');

const errorHandler = (err, req, res, next) => {
  if (NODE_ENV === 'development') {
    console.error(err);
  }
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  error(res, message, statusCode);
};

module.exports = { errorHandler };
