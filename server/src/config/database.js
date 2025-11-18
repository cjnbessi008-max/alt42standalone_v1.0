/**
 * Database Configuration and Connection
 * SQLite database with better-sqlite3
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database path
const DB_PATH = process.env.DB_PATH || join(__dirname, '../../../data/chaos_harmony.db');

// Ensure data directory exists
const dataDir = dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Create database connection
const db = new Database(DB_PATH, {
    verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Performance optimizations
db.pragma('journal_mode = WAL'); // Write-Ahead Logging for better concurrency
db.pragma('synchronous = NORMAL'); // Balance between safety and speed
db.pragma('cache_size = 10000'); // ~40MB cache
db.pragma('temp_store = MEMORY'); // Use memory for temp tables

/**
 * Initialize database with schema
 */
export function initializeDatabase() {
    console.log('Initializing database...');

    const schemaPath = join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Execute schema
    db.exec(schema);

    console.log('Database initialized successfully');
}

/**
 * Execute a prepared statement
 */
export function prepare(sql) {
    return db.prepare(sql);
}

/**
 * Run a query that doesn't return results
 */
export function run(sql, params = []) {
    return db.prepare(sql).run(params);
}

/**
 * Get single row
 */
export function get(sql, params = []) {
    return db.prepare(sql).get(params);
}

/**
 * Get all rows
 */
export function all(sql, params = []) {
    return db.prepare(sql).all(params);
}

/**
 * Begin transaction
 */
export function transaction(fn) {
    return db.transaction(fn);
}

/**
 * Close database connection
 */
export function close() {
    db.close();
}

/**
 * Get database instance (for advanced usage)
 */
export function getDatabase() {
    return db;
}

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nClosing database connection...');
    close();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\nClosing database connection...');
    close();
    process.exit(0);
});

export default db;
