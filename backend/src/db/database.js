import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'shape_summary',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// 연결 테스트
pool.on('connect', () => {
  console.log('✅ PostgreSQL connected')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL error:', err)
})

// 쿼리 헬퍼 함수
export const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    console.log('Executed query', { text, duration, rows: res.rowCount })
    return res
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  }
}

// 트랜잭션 헬퍼
export const getClient = async () => {
  const client = await pool.connect()
  const query = client.query
  const release = client.release

  // 트랜잭션 메서드 추가
  const commit = async () => {
    await client.query('COMMIT')
    client.release()
  }

  const rollback = async () => {
    await client.query('ROLLBACK')
    client.release()
  }

  // 메서드 오버라이드
  client.query = (...args) => {
    client.lastQuery = args
    return query.apply(client, args)
  }

  client.release = () => {
    client.query = query
    client.release = release
    return release.apply(client)
  }

  return { client, commit, rollback }
}

export default pool
