import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// MySQL 연결 풀 생성
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'condition_scanner',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

// 연결 테스트
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('MySQL 연결 테스트 성공');
    connection.release();
    return true;
  } catch (error) {
    console.error('MySQL 연결 실패:', error.message);
    throw error;
  }
};

// 쿼리 실행 헬퍼
export const query = async (sql, params = []) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

// 데이터베이스 초기화
export const initDatabase = async () => {
  try {
    // activities 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        modulename VARCHAR(100) NOT NULL,
        course_id INT NOT NULL,
        availability TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // conditions 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS conditions (
        id VARCHAR(100) PRIMARY KEY,
        activity_id INT NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        operator VARCHAR(10),
        value TEXT,
        parent_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      )
    `);

    // scan_history 테이블 생성
    await query(`
      CREATE TABLE IF NOT EXISTS scan_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activity_id INT NOT NULL,
        scan_data JSON NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE
      )
    `);

    console.log('데이터베이스 테이블 초기화 완료');
  } catch (error) {
    console.error('데이터베이스 초기화 실패:', error);
    throw error;
  }
};

export default pool;
