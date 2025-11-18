-- Counting Tree Map Database Schema
-- MySQL 5.7 Compatible

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS counting_tree_map
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE counting_tree_map;

-- =============================================
-- Table: problems
-- Stores problem information received from Moodle
-- =============================================
CREATE TABLE IF NOT EXISTS problems (
  id VARCHAR(36) PRIMARY KEY,
  moodle_problem_id VARCHAR(255) NOT NULL,
  moodle_course_id INT,
  question_text TEXT NOT NULL,
  problem_type VARCHAR(50) DEFAULT 'counting',
  difficulty_level INT DEFAULT 3 CHECK (difficulty_level BETWEEN 1 AND 5),
  correct_answer JSON,
  hints JSON,
  learning_objectives JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_problem (moodle_problem_id),
  INDEX idx_problem_type (problem_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: tree_nodes
-- Stores the tree structure for thought flow
-- =============================================
CREATE TABLE IF NOT EXISTS tree_nodes (
  id VARCHAR(36) PRIMARY KEY,
  problem_id VARCHAR(36) NOT NULL,
  parent_id VARCHAR(36) NULL,
  node_type ENUM('problem', 'approach', 'step', 'answer') NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  position_x DECIMAL(10, 2),
  position_y DECIMAL(10, 2),
  is_correct BOOLEAN DEFAULT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_id) REFERENCES tree_nodes(id) ON DELETE CASCADE,
  INDEX idx_problem_nodes (problem_id),
  INDEX idx_parent_child (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: student_sessions
-- Tracks student interaction sessions
-- =============================================
CREATE TABLE IF NOT EXISTS student_sessions (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  moodle_user_id INT NOT NULL,
  problem_id VARCHAR(36) NOT NULL,
  session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  session_end TIMESTAMP NULL,
  is_active BOOLEAN DEFAULT TRUE,
  final_score DECIMAL(5, 2),
  time_spent INT DEFAULT 0, -- seconds
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_moodle_user (moodle_user_id),
  INDEX idx_active_sessions (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: student_paths
-- Records the path taken by students through the tree
-- =============================================
CREATE TABLE IF NOT EXISTS student_paths (
  id VARCHAR(36) PRIMARY KEY,
  session_id VARCHAR(36) NOT NULL,
  node_id VARCHAR(36) NOT NULL,
  sequence_order INT NOT NULL,
  time_entered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  time_spent INT DEFAULT 0, -- seconds
  student_input JSON,
  feedback_given TEXT,
  FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (node_id) REFERENCES tree_nodes(id) ON DELETE CASCADE,
  INDEX idx_session_path (session_id, sequence_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Table: analytics
-- Stores aggregated analytics for problems
-- =============================================
CREATE TABLE IF NOT EXISTS analytics (
  id VARCHAR(36) PRIMARY KEY,
  problem_id VARCHAR(36) NOT NULL,
  total_attempts INT DEFAULT 0,
  success_rate DECIMAL(5, 2),
  avg_time_spent INT DEFAULT 0, -- seconds
  most_common_path JSON,
  difficulty_rating DECIMAL(3, 2),
  last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  UNIQUE KEY unique_problem_analytics (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- Sample Data for Testing
-- =============================================

-- Sample problem
INSERT INTO problems (
  id,
  moodle_problem_id,
  moodle_course_id,
  question_text,
  problem_type,
  difficulty_level,
  correct_answer,
  hints,
  learning_objectives
) VALUES (
  'prob-001',
  'moodle_q_12345',
  101,
  '바구니에 사과가 3개 있고, 오렌지가 5개 있습니다. 과일은 모두 몇 개일까요?',
  'counting',
  2,
  JSON_OBJECT('answer', 8, 'method', 'addition'),
  JSON_ARRAY('사과의 개수를 세어보세요', '오렌지의 개수를 세어보세요', '두 수를 더해보세요'),
  JSON_ARRAY('기본 덧셈', '물건 세기', '문제 해결')
);

-- Sample tree nodes for the problem
INSERT INTO tree_nodes (id, problem_id, parent_id, node_type, label, description, position_x, position_y, is_correct) VALUES
  ('node-root', 'prob-001', NULL, 'problem', '과일 세기 문제', '사과와 오렌지의 총 개수 구하기', 400, 50, NULL),
  ('node-approach-1', 'prob-001', 'node-root', 'approach', '하나씩 세기', '모든 과일을 하나씩 센다', 200, 200, TRUE),
  ('node-approach-2', 'prob-001', 'node-root', 'approach', '덧셈 사용', '3 + 5 계산', 600, 200, TRUE),
  ('node-step-1a', 'prob-001', 'node-approach-1', 'step', '사과 세기', '사과 1, 2, 3', 100, 350, TRUE),
  ('node-step-1b', 'prob-001', 'node-approach-1', 'step', '오렌지 세기', '오렌지 1, 2, 3, 4, 5', 300, 350, TRUE),
  ('node-step-1c', 'prob-001', 'node-approach-1', 'step', '모두 세기', '1, 2, 3, 4, 5, 6, 7, 8', 200, 500, TRUE),
  ('node-step-2a', 'prob-001', 'node-approach-2', 'step', '덧셈식 쓰기', '3 + 5 = ?', 600, 350, TRUE),
  ('node-answer-1', 'prob-001', 'node-step-1c', 'answer', '정답: 8개', '하나씩 세기 방법', 200, 650, TRUE),
  ('node-answer-2', 'prob-001', 'node-step-2a', 'answer', '정답: 8개', '덧셈 방법', 600, 500, TRUE);
