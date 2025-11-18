/**
 * MySQL 데이터베이스 설정
 * MySQL 5.7 연결 풀 관리
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'scale_sound',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

/**
 * 데이터베이스 연결 테스트
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL 데이터베이스 연결 성공');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ MySQL 데이터베이스 연결 실패:', error.message);
    return false;
  }
}

/**
 * 쿼리 실행 헬퍼
 */
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('쿼리 실행 오류:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
