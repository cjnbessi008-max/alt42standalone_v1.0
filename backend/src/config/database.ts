import mysql from 'mysql2/promise';
import { logger } from '../utils/logger';

let pool: mysql.Pool;

export async function setupDatabase(): Promise<void> {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'peak_user',
    password: process.env.DB_PASSWORD || 'peak_password',
    database: process.env.DB_NAME || 'peak_thinking_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  // Test connection
  try {
    const connection = await pool.getConnection();
    logger.info('Database connection test successful');
    connection.release();
  } catch (error) {
    logger.error('Database connection failed:', error);
    throw error;
  }
}

export function getDatabase(): mysql.Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call setupDatabase() first.');
  }
  return pool;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T[]> {
  const [rows] = await pool.execute(sql, params);
  return rows as T[];
}

export async function queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const [rows] = await pool.execute(sql, params);
  const results = rows as T[];
  return results.length > 0 ? results[0] : null;
}

export async function transaction<T>(
  callback: (connection: mysql.PoolConnection) => Promise<T>
): Promise<T> {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
