const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'geospiral-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Authentication middleware
 */
function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const token = authHeader.substring(7);

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired token'
        });
      }

      req.user = decoded;
      next();
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
}

/**
 * Optional authentication (allows guest access)
 */
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err) {
          req.user = decoded;
        }
      });
    }

    next();
  } catch (error) {
    next();
  }
}

/**
 * Admin role check
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  next();
}

module.exports = {
  authenticate,
  optionalAuth,
  requireAdmin,
  JWT_SECRET,
  JWT_EXPIRES_IN
};
