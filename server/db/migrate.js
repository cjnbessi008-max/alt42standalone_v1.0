import pool from './connection.js';

const migrations = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'teacher', 'admin')),
    full_name VARCHAR(255),
    lms_user_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 3D Shapes table
  `CREATE TABLE IF NOT EXISTS shapes_3d (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ko VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    model_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    vertices_count INTEGER,
    faces_count INTEGER,
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // 2D Shapes table
  `CREATE TABLE IF NOT EXISTS shapes_2d (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    name_ko VARCHAR(100),
    svg_path TEXT,
    image_url VARCHAR(500),
    shape_type VARCHAR(50) NOT NULL,
    properties JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Problems table
  `CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_ko VARCHAR(255),
    description TEXT,
    description_ko TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    category VARCHAR(100),
    instructions TEXT,
    instructions_ko TEXT,
    time_limit_seconds INTEGER,
    created_by INTEGER REFERENCES users(id),
    lms_problem_id VARCHAR(100),
    lms_module_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Problem pairs (3D to 2D matching relationships)
  `CREATE TABLE IF NOT EXISTS problem_pairs (
    id SERIAL PRIMARY KEY,
    problem_id INTEGER REFERENCES problems(id) ON DELETE CASCADE,
    shape_3d_id INTEGER REFERENCES shapes_3d(id),
    shape_2d_id INTEGER REFERENCES shapes_2d(id),
    is_correct_match BOOLEAN DEFAULT false,
    display_order INTEGER,
    hints JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(problem_id, shape_3d_id, shape_2d_id)
  )`,

  // Student responses
  `CREATE TABLE IF NOT EXISTS student_responses (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    problem_id INTEGER REFERENCES problems(id),
    shape_3d_id INTEGER REFERENCES shapes_3d(id),
    shape_2d_id INTEGER REFERENCES shapes_2d(id),
    is_correct BOOLEAN,
    response_time_ms INTEGER,
    gesture_data JSONB,
    attempt_number INTEGER DEFAULT 1,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Progress tracking
  `CREATE TABLE IF NOT EXISTS student_progress (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id),
    problem_id INTEGER REFERENCES problems(id),
    status VARCHAR(20) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
    score DECIMAL(5, 2),
    attempts INTEGER DEFAULT 0,
    time_spent_seconds INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, problem_id)
  )`,

  // LMS Integration
  `CREATE TABLE IF NOT EXISTS lms_integrations (
    id SERIAL PRIMARY KEY,
    lms_type VARCHAR(50) NOT NULL,
    lms_url VARCHAR(500) NOT NULL,
    lms_api_key VARCHAR(255),
    consumer_key VARCHAR(255),
    shared_secret VARCHAR(255),
    course_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(50),
    config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,

  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_problems_lms ON problems(lms_problem_id, lms_module_id)`,
  `CREATE INDEX IF NOT EXISTS idx_responses_student ON student_responses(student_id, problem_id)`,
  `CREATE INDEX IF NOT EXISTS idx_progress_student ON student_progress(student_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_problem_pairs_problem ON problem_pairs(problem_id)`,
  `CREATE INDEX IF NOT EXISTS idx_users_lms ON users(lms_user_id)`
];

async function runMigrations() {
  const client = await pool.connect();

  try {
    console.log('🔄 Starting database migrations...');

    for (let i = 0; i < migrations.length; i++) {
      console.log(`📝 Running migration ${i + 1}/${migrations.length}...`);
      await client.query(migrations[i]);
    }

    console.log('✅ All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migrations if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default runMigrations;
