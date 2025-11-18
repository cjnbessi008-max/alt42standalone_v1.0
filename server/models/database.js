/**
 * Database Connection Pool
 * MySQL 2 with Promise support
 */

const mysql = require('mysql2/promise');

let pool = null;

/**
 * Create connection pool
 */
function createPool() {
  if (pool) {
    return pool;
  }

  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'alt42_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'alt42_monitor',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });

  console.log('✅ Database pool created');
  return pool;
}

/**
 * Get database pool
 */
function getPool() {
  if (!pool) {
    return createPool();
  }
  return pool;
}

/**
 * Test database connection
 */
async function testConnection() {
  try {
    const connection = await getPool().getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    throw new Error(`Database connection test failed: ${error.message}`);
  }
}

/**
 * Execute query
 */
async function query(sql, params = []) {
  try {
    const [rows] = await getPool().execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
}

/**
 * Execute query and return first row
 */
async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Begin transaction
 */
async function beginTransaction() {
  const connection = await getPool().getConnection();
  await connection.beginTransaction();
  return connection;
}

/**
 * Commit transaction
 */
async function commit(connection) {
  await connection.commit();
  connection.release();
}

/**
 * Rollback transaction
 */
async function rollback(connection) {
  await connection.rollback();
  connection.release();
}

/**
 * Close all connections
 */
async function close() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database pool closed');
  }
}

// Export
module.exports = {
  getPool,
  testConnection,
  query,
  queryOne,
  beginTransaction,
  commit,
  rollback,
  close
};
