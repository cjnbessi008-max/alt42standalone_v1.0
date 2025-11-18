/**
 * PostgreSQL Database Connection
 */

import { Pool, QueryResult } from 'pg';
import { createLogger } from '../utils/logger';

const logger = createLogger('Database');

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'ai_education',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', err);
  process.exit(-1);
});

export const db = {
  query: <T = any>(text: string, params?: any[]): Promise<QueryResult<T>> => {
    return pool.query(text, params);
  },
  getClient: () => {
    return pool.connect();
  }
};
