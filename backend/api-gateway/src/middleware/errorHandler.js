/**
 * Global error handling middleware
 */

const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error(`Error: ${err.message}`, {
    error: err,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  // Default error status
  const status = err.status || err.statusCode || 500;

  // Send error response
  res.status(status).json({
    error: {
      message: err.message || 'Internal server error',
      status: status,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
}

module.exports = errorHandler;
