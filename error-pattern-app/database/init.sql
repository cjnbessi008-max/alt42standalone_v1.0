-- Error Pattern Analysis System
-- MySQL 5.7 Database Initialization Script
-- Character Set: UTF-8 for Korean language support

CREATE DATABASE IF NOT EXISTS error_pattern_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE error_pattern_db;

-- 1. Users Table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT UNIQUE,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role ENUM('student', 'teacher', 'admin') NOT NULL DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_user_id (moodle_user_id),
  INDEX idx_role (role),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Error Categories Table
CREATE TABLE error_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name_ko VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Default Error Categories
INSERT INTO error_categories (name_ko, name_en, description, icon, color, sort_order) VALUES
('개념 이해 부족', 'Conceptual Misunderstanding', '문제를 풀기 위한 기본 개념을 이해하지 못했습니다', '🧠', '#e74c3c', 1),
('계산 실수', 'Calculation Error', '개념은 알지만 계산 과정에서 실수했습니다', '🔢', '#3498db', 2),
('문제 해석 오류', 'Problem Interpretation Error', '문제를 잘못 이해하거나 해석했습니다', '📖', '#9b59b6', 3),
('공식 적용 오류', 'Formula Application Error', '공식을 잘못 적용하거나 기억이 나지 않았습니다', '📐', '#e67e22', 4),
('부주의/실수', 'Careless Mistake', '알고 있었지만 실수로 틀렸습니다', '😅', '#f39c12', 5),
('시간 부족', 'Time Pressure', '시간이 부족해서 제대로 풀지 못했습니다', '⏰', '#1abc9c', 6),
('풀이 과정 오류', 'Solution Process Error', '풀이 순서나 과정에서 오류가 있었습니다', '🔄', '#34495e', 7),
('기타', 'Other', '위 항목에 해당하지 않는 경우', '❓', '#95a5a6', 8);

-- 3. Quiz Attempts Table
CREATE TABLE quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_quiz_id INT NOT NULL,
  moodle_attempt_id INT UNIQUE,
  user_id INT NOT NULL,
  quiz_name VARCHAR(255),
  subject VARCHAR(100),
  grade_level VARCHAR(50),
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  score DECIMAL(5,2),
  max_score DECIMAL(5,2),
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_quiz (user_id, moodle_quiz_id),
  INDEX idx_completed_at (completed_at),
  INDEX idx_moodle_attempt (moodle_attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Question Errors Table
CREATE TABLE question_errors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  user_id INT NOT NULL,
  moodle_question_id INT NOT NULL,
  question_text TEXT,
  question_type VARCHAR(50),
  correct_answer TEXT,
  student_answer TEXT,
  is_correct BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_errors (user_id, is_correct),
  INDEX idx_question (moodle_question_id),
  INDEX idx_attempt (attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Error Reasons Table
CREATE TABLE error_reasons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_error_id INT NOT NULL,
  category_id INT NOT NULL,
  user_id INT NOT NULL,
  confidence_level ENUM('확실함', '아마도', '잘 모르겠음') DEFAULT '아마도',
  student_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (question_error_id) REFERENCES question_errors(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES error_categories(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_category (user_id, category_id),
  INDEX idx_created_at (created_at),
  INDEX idx_question_error (question_error_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Pattern Analysis Cache Table
CREATE TABLE pattern_analysis_cache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_type VARCHAR(50) NOT NULL,
  target_id INT,
  target_type VARCHAR(50),
  period_start DATE,
  period_end DATE,
  analysis_data JSON,
  ai_insights TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  INDEX idx_type_target (analysis_type, target_id, target_type),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Moodle Sync Log Table
CREATE TABLE moodle_sync_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sync_type VARCHAR(50) NOT NULL,
  status ENUM('success', 'failed', 'partial') NOT NULL,
  records_synced INT DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  INDEX idx_status_date (status, started_at),
  INDEX idx_sync_type (sync_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Sessions Table (for JWT/Session Management)
CREATE TABLE sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_token (token(255)),
  INDEX idx_user_expires (user_id, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sample admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO users (username, email, full_name, role) VALUES
('admin', 'admin@example.com', 'System Administrator', 'admin'),
('teacher1', 'teacher1@example.com', '김선생', 'teacher'),
('student1', 'student1@example.com', '박학생', 'student');

-- Create views for common queries

-- View: Student Error Summary
CREATE VIEW view_student_error_summary AS
SELECT
  u.id AS user_id,
  u.full_name,
  COUNT(DISTINCT qe.id) AS total_errors,
  COUNT(DISTINCT er.id) AS errors_with_reasons,
  COUNT(DISTINCT qa.id) AS total_attempts
FROM users u
LEFT JOIN question_errors qe ON u.id = qe.user_id
LEFT JOIN error_reasons er ON qe.id = er.question_error_id
LEFT JOIN quiz_attempts qa ON u.id = qa.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.full_name;

-- View: Category Distribution
CREATE VIEW view_category_distribution AS
SELECT
  ec.id AS category_id,
  ec.name_ko,
  ec.name_en,
  COUNT(er.id) AS selection_count,
  COUNT(DISTINCT er.user_id) AS unique_students
FROM error_categories ec
LEFT JOIN error_reasons er ON ec.id = er.category_id
WHERE ec.is_active = TRUE
GROUP BY ec.id, ec.name_ko, ec.name_en
ORDER BY selection_count DESC;

-- Stored Procedure: Get Student Pattern Analysis
DELIMITER //
CREATE PROCEDURE sp_get_student_pattern(IN student_id INT, IN days_back INT)
BEGIN
  SELECT
    ec.name_ko AS category_name,
    COUNT(er.id) AS error_count,
    AVG(CASE er.confidence_level
      WHEN '확실함' THEN 3
      WHEN '아마도' THEN 2
      ELSE 1
    END) AS avg_confidence,
    DATE(er.created_at) AS error_date
  FROM error_reasons er
  JOIN error_categories ec ON er.category_id = ec.id
  WHERE er.user_id = student_id
    AND er.created_at >= DATE_SUB(CURDATE(), INTERVAL days_back DAY)
  GROUP BY ec.name_ko, DATE(er.created_at)
  ORDER BY error_date DESC, error_count DESC;
END //
DELIMITER ;

-- Grant privileges (adjust as needed for your environment)
-- GRANT ALL PRIVILEGES ON error_pattern_db.* TO 'app_user'@'%' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;

-- Verification queries
SELECT 'Database initialized successfully!' AS message;
SELECT COUNT(*) AS category_count FROM error_categories;
SELECT COUNT(*) AS user_count FROM users;
