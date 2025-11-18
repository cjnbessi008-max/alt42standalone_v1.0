import { Pool } from 'pg';
import { logger } from '../utils/logger';

export const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export async function connectDatabase(): Promise<void> {
  try {
    const client = await db.connect();
    logger.info('Database connection test successful');
    client.release();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

db.on('error', (err) => {
  logger.error('Unexpected database error:', err);
});
