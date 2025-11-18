import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

const dbPath = process.env.DB_PATH || path.join(__dirname, '../../../database/lms_checkpoint.db');
const schemaPath = path.join(__dirname, '../../../database/schema.sql');

export class DatabaseManager {
  private static instance: Database.Database;

  static getInstance(): Database.Database {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = DatabaseManager.initDatabase();
    }
    return DatabaseManager.instance;
  }

  private static initDatabase(): Database.Database {
    try {
      // Ensure database directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      const db = new Database(dbPath);

      // Enable foreign keys
      db.pragma('foreign_keys = ON');

      // Set journal mode to WAL for better concurrency
      db.pragma('journal_mode = WAL');

      logger.info(`Database initialized at: ${dbPath}`);

      // Initialize schema if needed
      DatabaseManager.initializeSchema(db);

      return db;
    } catch (error) {
      logger.error('Failed to initialize database:', error);
      throw error;
    }
  }

  private static initializeSchema(db: Database.Database): void {
    try {
      // Check if tables exist
      const tableCount = db.prepare(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name='problems'"
      ).get() as { count: number };

      if (tableCount.count === 0) {
        logger.info('Initializing database schema...');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        db.exec(schema);
        logger.info('Database schema initialized successfully');
      }
    } catch (error) {
      logger.error('Failed to initialize schema:', error);
      throw error;
    }
  }

  static close(): void {
    if (DatabaseManager.instance) {
      DatabaseManager.instance.close();
      logger.info('Database connection closed');
    }
  }
}

export const db = DatabaseManager.getInstance();
