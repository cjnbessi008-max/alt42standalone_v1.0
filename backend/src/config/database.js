const mysql = require('mysql2/promise');

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'alt42_standalone',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

// 연결 테스트
pool.getConnection()
  .then(connection => {
    console.log('Database pool created successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error creating database pool:', err.message);
  });

module.exports = pool;
