import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';
import logger from '../utils/logger';

// Prisma Client for Application Database (PostgreSQL)
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// MySQL Connection Pool for Moodle Database (Read-Only)
export const moodleDb = mysql.createPool({
  host: process.env.MOODLE_DB_HOST || 'localhost',
  port: parseInt(process.env.MOODLE_DB_PORT || '3306'),
  user: process.env.MOODLE_DB_USER || 'root',
  password: process.env.MOODLE_DB_PASSWORD || '',
  database: process.env.MOODLE_DB_NAME || 'moodle',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// Test database connections
export async function testDatabaseConnections(): Promise<void> {
  try {
    // Test Prisma connection
    await prisma.$connect();
    logger.info('✅ PostgreSQL (Prisma) connected successfully');

    // Test Moodle MySQL connection
    const connection = await moodleDb.getConnection();
    await connection.ping();
    connection.release();
    logger.info('✅ Moodle MySQL connected successfully');
  } catch (error) {
    logger.error('❌ Database connection error:', error);
    throw error;
  }
}

// Graceful shutdown
export async function closeDatabaseConnections(): Promise<void> {
  await prisma.$disconnect();
  await moodleDb.end();
  logger.info('Database connections closed');
}
