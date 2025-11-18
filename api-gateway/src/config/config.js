/**
 * Configuration management
 */

require('dotenv').config();

module.exports = {
  // Environment
  environment: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.API_GATEWAY_PORT || '3001', 10),

  // Database
  database: {
    host: process.env.DB_HOST || 'postgres',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'ai_education',
    user: process.env.DB_USER || 'ai_edu_user',
    password: process.env.DB_PASSWORD || 'dev_password_change_in_production',
    max: 20, // Connection pool size
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://redis:6379'
  },

  // Python Pipeline
  pipelineUrl: process.env.PIPELINE_URL || 'http://pipeline:8000',

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_change_in_production',
    expiresIn: '24h'
  },

  // CORS
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:3000',
    'http://localhost:3001'
  ],

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // Max requests per window
  },

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Moodle Integration (if applicable)
  moodle: {
    url: process.env.MOODLE_URL || '',
    token: process.env.MOODLE_TOKEN || ''
  }
};
