import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mean_center_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Execute query helper
export const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

// Execute stored procedure
export const callProcedure = async (procedureName, params = []) => {
  try {
    const placeholders = params.map(() => '?').join(',');
    const sql = `CALL ${procedureName}(${placeholders})`;
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Stored procedure error:', error.message);
    throw error;
  }
};

export default pool;
