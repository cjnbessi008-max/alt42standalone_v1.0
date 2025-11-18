import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import {
  User,
  ErrorCategory,
  QuizAttempt,
  QuestionError,
  ErrorReason,
} from '../models';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'error_pattern_db',
  synchronize: process.env.NODE_ENV === 'development', // Auto-sync in development only
  logging: process.env.NODE_ENV === 'development',
  entities: [User, ErrorCategory, QuizAttempt, QuestionError, ErrorReason],
  migrations: [path.join(__dirname, '../migrations/*.ts')],
  subscribers: [],
  charset: 'utf8mb4',
  timezone: '+00:00',
  extra: {
    connectionLimit: 10,
  },
});

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established successfully');

    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Running in development mode - auto-sync enabled');
    }
  } catch (error) {
    console.error('❌ Error during database initialization:', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log('🔌 Database connection closed');
  }
}
