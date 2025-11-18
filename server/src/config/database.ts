import { Pool } from 'pg';
import mysql from 'mysql2/promise';

// PostgreSQL connection pool
export const pgPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'triangle_mirror',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// MySQL connection pool for Moodle database (read-only)
export const moodlePool = mysql.createPool({
  host: process.env.MOODLE_DB_HOST || 'localhost',
  port: parseInt(process.env.MOODLE_DB_PORT || '3306'),
  database: process.env.MOODLE_DB_NAME || 'moodle',
  user: process.env.MOODLE_DB_USER,
  password: process.env.MOODLE_DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test PostgreSQL connection
pgPool.on('connect', () => {
  console.log('✓ PostgreSQL connected');
});

pgPool.on('error', (err) => {
  console.error('PostgreSQL error:', err);
});

// Initialize database tables
export const initDatabase = async () => {
  const client = await pgPool.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS problems (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        moodle_question_id INTEGER,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        problem_data JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS triangles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
        triangle_data JSONB NOT NULL,
        similarity_group INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        moodle_user_id INTEGER NOT NULL,
        session_token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_problems_moodle_id ON problems(moodle_question_id);
      CREATE INDEX IF NOT EXISTS idx_triangles_problem_id ON triangles(problem_id);
      CREATE INDEX IF NOT EXISTS idx_triangles_similarity ON triangles(similarity_group);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
    `);

    console.log('✓ Database tables initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  } finally {
    client.release();
  }
};

export default { pgPool, moodlePool, initDatabase };
