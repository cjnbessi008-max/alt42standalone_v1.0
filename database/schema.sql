-- Balance Machine Database Schema
-- MySQL 5.7 Compatible

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS problem_attempts;
DROP TABLE IF EXISTS hints;
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS users;

-- Users table (can sync with Moodle)
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT DEFAULT NULL,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_user_id (moodle_user_id),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems table (equation problems)
CREATE TABLE problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_problem_id INT DEFAULT NULL,
  title VARCHAR(255) NOT NULL,
  equation_left VARCHAR(255) NOT NULL COMMENT '방정식 좌변 (예: 2x + 5)',
  equation_right VARCHAR(255) NOT NULL COMMENT '방정식 우변 (예: 15)',
  solution VARCHAR(255) NOT NULL COMMENT '정답 (예: x = 5)',
  difficulty_level TINYINT NOT NULL DEFAULT 1 COMMENT '난이도 (1=쉬움, 2=보통, 3=어려움, 4=매우어려움)',
  category VARCHAR(50) DEFAULT 'linear' COMMENT '문제 유형: linear, quadratic, rational, etc',
  max_steps INT DEFAULT 10 COMMENT '최대 허용 단계 수',
  time_limit INT DEFAULT 300 COMMENT '시간 제한 (초)',
  created_by INT DEFAULT NULL COMMENT '문제 생성자 user_id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_difficulty (difficulty_level),
  INDEX idx_category (category),
  INDEX idx_moodle_problem_id (moodle_problem_id),
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hints table (문제별 힌트)
CREATE TABLE hints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  hint_order TINYINT NOT NULL COMMENT '힌트 순서 (1, 2, 3...)',
  hint_text TEXT NOT NULL COMMENT '힌트 내용',
  penalty_points INT DEFAULT 5 COMMENT '힌트 사용시 감점',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  UNIQUE KEY unique_problem_hint (problem_id, hint_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student Progress table (학생별 진행도)
CREATE TABLE student_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  problem_id INT NOT NULL,
  status ENUM('not_started', 'in_progress', 'completed', 'failed') DEFAULT 'not_started',
  attempts_count INT DEFAULT 0 COMMENT '시도 횟수',
  hints_used INT DEFAULT 0 COMMENT '사용한 힌트 수',
  is_correct BOOLEAN DEFAULT FALSE,
  final_score DECIMAL(5, 2) DEFAULT 0.00 COMMENT '최종 점수 (0-100)',
  time_spent INT DEFAULT 0 COMMENT '소요 시간 (초)',
  started_at TIMESTAMP NULL DEFAULT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_problem (student_id, problem_id),
  INDEX idx_student_status (student_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem Attempts table (각 시도마다의 상세 기록)
CREATE TABLE problem_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  progress_id INT NOT NULL,
  student_id INT NOT NULL,
  problem_id INT NOT NULL,
  attempt_number INT NOT NULL,
  steps_taken JSON COMMENT '학생이 수행한 단계들 (JSON 배열)',
  student_answer VARCHAR(255) DEFAULT NULL COMMENT '학생의 답변',
  is_correct BOOLEAN DEFAULT FALSE,
  score DECIMAL(5, 2) DEFAULT 0.00 COMMENT '이번 시도의 점수',
  time_spent INT DEFAULT 0 COMMENT '이번 시도 소요 시간 (초)',
  hints_used_in_attempt INT DEFAULT 0,
  error_type VARCHAR(100) DEFAULT NULL COMMENT '오답 유형 분석',
  attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (progress_id) REFERENCES student_progress(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_student_problem (student_id, problem_id),
  INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create a view for easy reporting
CREATE OR REPLACE VIEW student_performance AS
SELECT
  u.id as student_id,
  u.username,
  u.full_name,
  p.id as problem_id,
  p.title as problem_title,
  p.difficulty_level,
  sp.status,
  sp.attempts_count,
  sp.hints_used,
  sp.is_correct,
  sp.final_score,
  sp.time_spent,
  sp.completed_at
FROM users u
JOIN student_progress sp ON u.id = sp.student_id
JOIN problems p ON sp.problem_id = p.id
WHERE u.role = 'student';
