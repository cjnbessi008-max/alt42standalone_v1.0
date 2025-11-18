const mysql = require('mysql2');

// MySQL 연결 풀 생성 (Moodle 데이터베이스)
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'moodle',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'moodle',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Promise 기반 인터페이스
const promisePool = pool.promise();

// 연결 테스트
const testConnection = async () => {
  try {
    const connection = await promisePool.getConnection();
    console.log('✅ MySQL connection successful');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL connection failed:', error.message);
    return false;
  }
};

// 초기 연결 테스트 실행
testConnection();

module.exports = {
  pool,
  promisePool,
  testConnection
};
