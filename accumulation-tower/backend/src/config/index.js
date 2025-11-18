require('dotenv').config();

module.exports = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  moodle: {
    url: process.env.MOODLE_URL,
    token: process.env.MOODLE_TOKEN,
    wsFormat: 'json'
  },

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'accumulation_tower'
  },

  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  },

  scoreUpdateInterval: parseInt(process.env.SCORE_UPDATE_INTERVAL) || 5000
};
