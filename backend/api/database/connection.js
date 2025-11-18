/**
 * MySQL Database Connection
 * MySQL 5.7 configuration
 */

const mysql = require('mysql2/promise')

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'impossible_shadow',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

// Create connection pool
const pool = mysql.createPool(dbConfig)

// Test connection
pool.getConnection()
  .then(connection => {
    console.log('✓ MySQL database connected successfully')
    connection.release()
  })
  .catch(err => {
    console.error('✗ MySQL connection failed:', err.message)
  })

// Export query function
module.exports = {
  query: async (sql, params) => {
    try {
      const [results] = await pool.execute(sql, params)
      return [results]
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  },
  pool
}
