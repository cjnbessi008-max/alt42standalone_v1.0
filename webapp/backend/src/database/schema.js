/**
 * SQLite Database Schema for Concept-Problem Matching System
 */

export const createTables = (db) => {
  // Concepts table
  db.exec(`
    CREATE TABLE IF NOT EXISTS concepts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      difficulty_level TEXT CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')) DEFAULT 'beginner',
      parent_concept_id INTEGER,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_concept_id) REFERENCES concepts(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_concepts_category ON concepts(category);
    CREATE INDEX IF NOT EXISTS idx_concepts_difficulty ON concepts(difficulty_level);
  `);

  // Problems table
  db.exec(`
    CREATE TABLE IF NOT EXISTS problems (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      problem_type TEXT,
      difficulty_level TEXT CHECK(difficulty_level IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
      points INTEGER DEFAULT 10,
      time_limit INTEGER,
      solution TEXT,
      hints TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty_level);
    CREATE INDEX IF NOT EXISTS idx_problems_type ON problems(problem_type);
  `);

  // Concept-Problem Mapping table
  db.exec(`
    CREATE TABLE IF NOT EXISTS concept_problem_mappings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id INTEGER NOT NULL,
      problem_id INTEGER NOT NULL,
      relevance_score REAL DEFAULT 1.0 CHECK(relevance_score >= 0 AND relevance_score <= 1),
      is_primary BOOLEAN DEFAULT 0,
      mapping_type TEXT CHECK(mapping_type IN ('direct', 'prerequisite', 'related')) DEFAULT 'direct',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
      UNIQUE(concept_id, problem_id)
    );

    CREATE INDEX IF NOT EXISTS idx_cpm_concept ON concept_problem_mappings(concept_id);
    CREATE INDEX IF NOT EXISTS idx_cpm_problem ON concept_problem_mappings(problem_id);
    CREATE INDEX IF NOT EXISTS idx_cpm_relevance ON concept_problem_mappings(relevance_score);
  `);

  // Students table
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      grade_level TEXT,
      learning_style TEXT,
      metadata TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
  `);

  // Student Progress table
  db.exec(`
    CREATE TABLE IF NOT EXISTS student_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      problem_id INTEGER NOT NULL,
      concept_id INTEGER NOT NULL,
      attempts INTEGER DEFAULT 0,
      correct_attempts INTEGER DEFAULT 0,
      last_score REAL,
      best_score REAL,
      time_spent INTEGER DEFAULT 0,
      status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed', 'mastered')) DEFAULT 'not_started',
      first_attempt_at DATETIME,
      last_attempt_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
      FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
      UNIQUE(student_id, problem_id, concept_id)
    );

    CREATE INDEX IF NOT EXISTS idx_sp_student ON student_progress(student_id);
    CREATE INDEX IF NOT EXISTS idx_sp_status ON student_progress(status);
  `);

  // Concept Prerequisites table
  db.exec(`
    CREATE TABLE IF NOT EXISTS concept_prerequisites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      concept_id INTEGER NOT NULL,
      prerequisite_id INTEGER NOT NULL,
      importance TEXT CHECK(importance IN ('required', 'recommended', 'optional')) DEFAULT 'recommended',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
      FOREIGN KEY (prerequisite_id) REFERENCES concepts(id) ON DELETE CASCADE,
      UNIQUE(concept_id, prerequisite_id)
    );

    CREATE INDEX IF NOT EXISTS idx_cp_concept ON concept_prerequisites(concept_id);
    CREATE INDEX IF NOT EXISTS idx_cp_prerequisite ON concept_prerequisites(prerequisite_id);
  `);

  // Recommendations table (cache)
  db.exec(`
    CREATE TABLE IF NOT EXISTS recommendations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      problem_id INTEGER NOT NULL,
      concept_id INTEGER,
      confidence_score REAL DEFAULT 0.5,
      algorithm TEXT,
      reason TEXT,
      is_shown BOOLEAN DEFAULT 0,
      is_accepted BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
      FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rec_student ON recommendations(student_id);
    CREATE INDEX IF NOT EXISTS idx_rec_expires ON recommendations(expires_at);
  `);

  // Learning Analytics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      concept_id INTEGER NOT NULL,
      mastery_level REAL DEFAULT 0.0 CHECK(mastery_level >= 0 AND mastery_level <= 1),
      confidence REAL DEFAULT 0.5,
      time_to_mastery INTEGER,
      struggle_indicators TEXT,
      calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
      UNIQUE(student_id, concept_id)
    );

    CREATE INDEX IF NOT EXISTS idx_la_student ON learning_analytics(student_id);
    CREATE INDEX IF NOT EXISTS idx_la_concept ON learning_analytics(concept_id);
  `);

  console.log('✅ Database schema created successfully');
};

export const dropTables = (db) => {
  const tables = [
    'learning_analytics',
    'recommendations',
    'concept_prerequisites',
    'student_progress',
    'students',
    'concept_problem_mappings',
    'problems',
    'concepts'
  ];

  tables.forEach(table => {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  });

  console.log('✅ All tables dropped successfully');
};
