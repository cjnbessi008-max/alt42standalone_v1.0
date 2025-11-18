-- Counterexample Shadow Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'student' CHECK (role IN ('teacher', 'student', 'admin')),
  lms_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Propositions table
CREATE TABLE propositions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  statement TEXT NOT NULL,
  domain VARCHAR(100),
  type VARCHAR(50) NOT NULL CHECK (type IN ('universal', 'existential', 'conditional', 'biconditional')),
  truth_value BOOLEAN,
  visual_config JSONB DEFAULT '{
    "mode": "venn",
    "colors": {
      "positive": "#4CAF50",
      "negative": "#212121",
      "neutral": "#F5F5F5"
    },
    "animation": {
      "duration": 1000,
      "easing": "ease-in-out"
    }
  }'::jsonb,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Counterexamples table
CREATE TABLE counterexamples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposition_id UUID NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
  value JSONB NOT NULL,
  explanation TEXT,
  visual_position JSONB DEFAULT '{"x": 0, "y": 0}'::jsonb,
  shadow_intensity DECIMAL(3,2) DEFAULT 0.8 CHECK (shadow_intensity >= 0 AND shadow_intensity <= 1),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student interactions table
CREATE TABLE student_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  proposition_id UUID NOT NULL REFERENCES propositions(id) ON DELETE CASCADE,
  interaction_type VARCHAR(50) NOT NULL CHECK (interaction_type IN ('view', 'attempt', 'correct', 'incorrect')),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_propositions_created_by ON propositions(created_by);
CREATE INDEX idx_propositions_type ON propositions(type);
CREATE INDEX idx_counterexamples_proposition_id ON counterexamples(proposition_id);
CREATE INDEX idx_student_interactions_user_id ON student_interactions(user_id);
CREATE INDEX idx_student_interactions_proposition_id ON student_interactions(proposition_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_lms_id ON users(lms_id);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_propositions_updated_at
  BEFORE UPDATE ON propositions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Sample data for testing
INSERT INTO users (email, password_hash, name, role) VALUES
  ('teacher@example.com', '$2b$10$X8xGZY.example.hash', 'Test Teacher', 'teacher'),
  ('student@example.com', '$2b$10$X8xGZY.example.hash', 'Test Student', 'student');

-- Sample proposition: "모든 소수는 홀수다"
INSERT INTO propositions (title, statement, domain, type, truth_value, created_by) VALUES
  (
    '모든 소수는 홀수다',
    '∀x ∈ Primes, x is odd',
    'Prime numbers',
    'universal',
    false,
    (SELECT id FROM users WHERE email = 'teacher@example.com' LIMIT 1)
  );

-- Sample counterexample: 2 (the only even prime)
INSERT INTO counterexamples (proposition_id, value, explanation, visual_position, shadow_intensity) VALUES
  (
    (SELECT id FROM propositions WHERE title = '모든 소수는 홀수다' LIMIT 1),
    '2'::jsonb,
    '2는 유일한 짝수 소수입니다.',
    '{"x": 100, "y": 100}'::jsonb,
    0.9
  );

-- Comments
COMMENT ON TABLE propositions IS '논리적 명제를 저장하는 테이블';
COMMENT ON TABLE counterexamples IS '명제의 반례를 저장하는 테이블';
COMMENT ON COLUMN counterexamples.shadow_intensity IS '그림자 강도 (0.0 ~ 1.0)';
COMMENT ON TABLE student_interactions IS '학생의 명제 상호작용을 추적하는 테이블';
