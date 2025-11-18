/**
 * Global Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method
  });

  // Don't expose internal error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
}

/**
 * 404 Not Found Handler
 */
function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.url
  });
}

module.exports = { errorHandler, notFoundHandler };
