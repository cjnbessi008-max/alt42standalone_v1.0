-- Unfolding Net Live - Database Schema
-- MySQL 5.7 compatible schema for Moodle 3.7 integration

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS moodle CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE moodle;

-- ============================================
-- Table: unfolding_problems
-- 전개도 문제 정보 저장
-- ============================================
CREATE TABLE IF NOT EXISTS unfolding_problems (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID',
  course_id VARCHAR(36) NOT NULL COMMENT 'Moodle course ID',
  module_id VARCHAR(36) NOT NULL COMMENT 'Moodle module/activity ID',
  type ENUM('cube', 'tetrahedron', 'octahedron', 'pyramid', 'prism') NOT NULL COMMENT '도형 타입',
  difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5) COMMENT '난이도 (1-5)',
  title VARCHAR(255) NOT NULL COMMENT '문제 제목',
  description TEXT COMMENT '문제 설명',
  config JSON COMMENT '추가 설정 (JSON)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_course_module (course_id, module_id),
  INDEX idx_type (type),
  INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='전개도 문제 테이블';

-- ============================================
-- Table: student_progress
-- 학생 진행 상황 저장
-- ============================================
CREATE TABLE IF NOT EXISTS student_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id VARCHAR(36) NOT NULL COMMENT '문제 ID',
  user_id VARCHAR(36) NOT NULL COMMENT 'Moodle user ID',
  progress DECIMAL(5,2) NOT NULL COMMENT '진행률 (0.00 - 1.00)',
  completed BOOLEAN DEFAULT FALSE COMMENT '완료 여부',
  interaction_data JSON COMMENT '인터랙션 데이터 (JSON)',
  time_spent INT DEFAULT 0 COMMENT '소요 시간 (초)',
  attempt_count INT DEFAULT 1 COMMENT '시도 횟수',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (problem_id) REFERENCES unfolding_problems(id) ON DELETE CASCADE,
  INDEX idx_problem_user (problem_id, user_id),
  INDEX idx_user (user_id),
  INDEX idx_completed (completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 진행 상황 테이블';

-- ============================================
-- Table: interaction_events
-- 사용자 인터랙션 이벤트 로깅
-- ============================================
CREATE TABLE IF NOT EXISTS interaction_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  problem_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  event_type ENUM('click', 'drag', 'zoom', 'rotate', 'play', 'pause', 'stop') NOT NULL,
  event_data JSON COMMENT '이벤트 상세 데이터',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (problem_id) REFERENCES unfolding_problems(id) ON DELETE CASCADE,
  INDEX idx_problem_user (problem_id, user_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_event_type (event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='인터랙션 이벤트 로그';

-- ============================================
-- Sample Data (개발/테스트용)
-- ============================================

-- 샘플 문제 1: 정육면체
INSERT INTO unfolding_problems (id, course_id, module_id, type, difficulty, title, description, config)
VALUES (
  'sample-cube-001',
  'course-1',
  'module-1',
  'cube',
  1,
  '정육면체 전개도',
  '정육면체를 펼쳐서 전개도를 관찰해보세요. 6개의 정사각형 면이 어떻게 연결되어 있는지 확인하세요.',
  '{"initialViewAngle": {"azimuth": 45, "polar": 30}}'
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 샘플 문제 2: 사면체
INSERT INTO unfolding_problems (id, course_id, module_id, type, difficulty, title, description, config)
VALUES (
  'sample-tetra-001',
  'course-1',
  'module-2',
  'tetrahedron',
  2,
  '정사면체 전개도',
  '정사면체를 펼쳐보세요. 4개의 정삼각형이 어떻게 배치되는지 관찰하세요.',
  '{"initialViewAngle": {"azimuth": 30, "polar": 45}}'
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 샘플 문제 3: 각뿔
INSERT INTO unfolding_problems (id, course_id, module_id, type, difficulty, title, description, config)
VALUES (
  'sample-pyramid-001',
  'course-1',
  'module-3',
  'pyramid',
  3,
  '정사각뿔 전개도',
  '정사각뿔의 전개도를 관찰하세요. 밑면과 옆면이 어떻게 연결되어 있나요?',
  '{"initialViewAngle": {"azimuth": 60, "polar": 35}}'
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- Utility Views (optional)
-- ============================================

-- 문제별 학생 통계 뷰
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
  p.id,
  p.title,
  p.type,
  p.difficulty,
  COUNT(DISTINCT sp.user_id) as total_students,
  COUNT(CASE WHEN sp.completed = TRUE THEN 1 END) as completed_count,
  AVG(sp.progress) as avg_progress,
  AVG(sp.time_spent) as avg_time_spent,
  AVG(sp.attempt_count) as avg_attempts
FROM unfolding_problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
GROUP BY p.id, p.title, p.type, p.difficulty;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Additional composite indexes for common queries
CREATE INDEX idx_progress_completed_user ON student_progress(completed, user_id);
CREATE INDEX idx_events_timestamp_type ON interaction_events(timestamp, event_type);

-- ============================================
-- Stored Procedures (optional)
-- ============================================

DELIMITER //

-- 학생 진행 상황 업데이트 또는 생성
CREATE PROCEDURE upsert_student_progress(
  IN p_problem_id VARCHAR(36),
  IN p_user_id VARCHAR(36),
  IN p_progress DECIMAL(5,2),
  IN p_interaction_data JSON,
  IN p_time_spent INT
)
BEGIN
  INSERT INTO student_progress (problem_id, user_id, progress, interaction_data, time_spent, completed)
  VALUES (p_problem_id, p_user_id, p_progress, p_interaction_data, p_time_spent, p_progress >= 1.00)
  ON DUPLICATE KEY UPDATE
    progress = p_progress,
    interaction_data = p_interaction_data,
    time_spent = time_spent + p_time_spent,
    attempt_count = attempt_count + 1,
    completed = (p_progress >= 1.00);
END //

DELIMITER ;

-- ============================================
-- Verification Queries
-- ============================================

-- 설치 확인
SELECT 'Database schema created successfully!' AS status;
SELECT COUNT(*) AS sample_problems_count FROM unfolding_problems;
