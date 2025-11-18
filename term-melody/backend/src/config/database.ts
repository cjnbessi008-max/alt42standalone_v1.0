/**
 * MySQL 데이터베이스 연결 설정
 */

import mysql from 'mysql2/promise'
import dotenv from 'dotenv'

dotenv.config()

interface DatabaseConfig {
  host: string
  port: number
  database: string
  user: string
  password: string
}

const config: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'moodle',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
}

// Connection pool 생성
export const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  database: config.database,
  user: config.user,
  password: config.password,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

// 데이터베이스 연결 테스트
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection()
    console.log('✅ MySQL 연결 성공:', config.database)
    connection.release()
    return true
  } catch (error) {
    console.error('❌ MySQL 연결 실패:', error)
    return false
  }
}

export default pool
