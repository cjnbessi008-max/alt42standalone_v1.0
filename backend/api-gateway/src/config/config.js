/**
 * Configuration management
 */

require('dotenv').config();

const config = {
  // Server configuration
  port: parseInt(process.env.API_GATEWAY_PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database configuration
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'dmn_monitoring',
    user: process.env.POSTGRES_USER || 'dmn_user',
    password: process.env.POSTGRES_PASSWORD || 'changeme',
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },

  // Redis configuration
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },

  // DMN Service configuration
  dmnService: {
    host: process.env.DMN_SERVICE_HOST || 'localhost',
    port: parseInt(process.env.DMN_SERVICE_PORT || '8000', 10),
    baseUrl: `http://${process.env.DMN_SERVICE_HOST || 'localhost'}:${process.env.DMN_SERVICE_PORT || '8000'}`
  },

  // Moodle configuration
  moodle: {
    url: process.env.MOODLE_URL || 'http://localhost',
    apiToken: process.env.MOODLE_API_TOKEN || '',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-this-in-production',
    expiresIn: '24h'
  },

  // WebSocket configuration
  websocket: {
    updateInterval: parseInt(process.env.WS_UPDATE_INTERVAL || '5000', 10),
  },

  // CORS configuration
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(','),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
};

module.exports = config;
