/**
 * Database Initialization Script
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { createTables, dropTables } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_DIR = join(__dirname, '../../data');
const DB_PATH = join(DB_DIR, 'concepts.db');

// Ensure data directory exists
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
  console.log(`📁 Created data directory: ${DB_DIR}`);
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

console.log('🔧 Initializing database...');

// Drop existing tables if reset flag is provided
if (process.argv.includes('--reset')) {
  console.log('⚠️  Resetting database (dropping all tables)...');
  dropTables(db);
}

// Create tables
createTables(db);

console.log(`✅ Database initialized successfully at: ${DB_PATH}`);

db.close();
