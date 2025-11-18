-- ================================================
-- LMS 연동 개념 선택 시스템 데이터베이스 스키마
-- MySQL 5.7+
-- ================================================

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS lms_concept_system
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE lms_concept_system;

-- ================================================
-- 1. 사용자 테이블
-- ================================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('teacher', 'student', 'admin') NOT NULL DEFAULT 'student',
  full_name VARCHAR(200),
  moodle_user_id INT UNSIGNED NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_role (role),
  INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 2. 개념(Concepts) 테이블 - 계층 구조
-- ================================================
CREATE TABLE concepts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  parent_id INT UNSIGNED NULL,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200) NULL,
  description TEXT,
  subject VARCHAR(100) NOT NULL COMMENT '과목: mathematics, science, language, etc.',
  level INT UNSIGNED DEFAULT 1 COMMENT '난이도/학년 레벨',
  order_index INT UNSIGNED DEFAULT 0 COMMENT '같은 부모 내 정렬 순서',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES concepts(id) ON DELETE CASCADE,
  INDEX idx_parent (parent_id),
  INDEX idx_subject (subject),
  INDEX idx_level (level),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 3. 개념 키워드 테이블 (AI 매칭용)
-- ================================================
CREATE TABLE concept_keywords (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  concept_id INT UNSIGNED NOT NULL,
  keyword VARCHAR(100) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.00 COMMENT '키워드 가중치 (0.00-1.00)',
  language CHAR(2) DEFAULT 'ko' COMMENT 'ko, en, etc.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
  INDEX idx_keyword (keyword),
  INDEX idx_concept (concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 4. 문제(Problems) 테이블
-- ================================================
CREATE TABLE problems (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  content TEXT NOT NULL COMMENT '문제 내용',
  solution TEXT NULL COMMENT '풀이/해설',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  subject VARCHAR(100) NOT NULL,
  grade_level INT UNSIGNED NULL COMMENT '대상 학년',
  points DECIMAL(5,2) DEFAULT 10.00 COMMENT '배점',
  time_limit INT UNSIGNED NULL COMMENT '제한 시간 (초)',
  problem_type VARCHAR(50) DEFAULT 'multiple_choice' COMMENT 'multiple_choice, short_answer, essay, etc.',
  metadata JSON NULL COMMENT '추가 메타데이터 (선택지, 정답 등)',
  created_by INT UNSIGNED NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  view_count INT UNSIGNED DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_subject (subject),
  INDEX idx_difficulty (difficulty),
  INDEX idx_created_by (created_by),
  INDEX idx_active (is_active),
  FULLTEXT INDEX ft_content (title, content)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 5. 문제-개념 연결 테이블 (핵심)
-- ================================================
CREATE TABLE problem_concepts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id INT UNSIGNED NOT NULL,
  concept_id INT UNSIGNED NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE COMMENT '주 개념 여부',
  confidence_score DECIMAL(4,3) DEFAULT 0.000 COMMENT 'AI 추천 신뢰도 (0.000-1.000)',
  is_ai_suggested BOOLEAN DEFAULT FALSE COMMENT 'AI가 추천한 개념인지',
  confirmed_by_teacher BOOLEAN DEFAULT FALSE COMMENT '교사가 확인했는지',
  confirmed_at TIMESTAMP NULL,
  confirmed_by INT UNSIGNED NULL COMMENT '확인한 교사 ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
  FOREIGN KEY (confirmed_by) REFERENCES users(id) ON DELETE SET NULL,
  UNIQUE KEY uk_problem_concept (problem_id, concept_id),
  INDEX idx_problem (problem_id),
  INDEX idx_concept (concept_id),
  INDEX idx_primary (is_primary),
  INDEX idx_ai_suggested (is_ai_suggested)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 6. 학생 진도 추적 테이블
-- ================================================
CREATE TABLE student_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  problem_id INT UNSIGNED NOT NULL,
  concept_id INT UNSIGNED NULL COMMENT '학습한 개념',
  status ENUM('not_started', 'in_progress', 'completed', 'mastered') DEFAULT 'not_started',
  score DECIMAL(5,2) NULL COMMENT '획득 점수',
  max_score DECIMAL(5,2) NULL COMMENT '만점',
  attempts INT UNSIGNED DEFAULT 0 COMMENT '시도 횟수',
  time_spent INT UNSIGNED DEFAULT 0 COMMENT '소요 시간 (초)',
  last_attempt_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_problem (problem_id),
  INDEX idx_concept (concept_id),
  INDEX idx_status (status),
  UNIQUE KEY uk_student_problem (student_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 7. 개념 숙련도 테이블
-- ================================================
CREATE TABLE concept_mastery (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL,
  concept_id INT UNSIGNED NOT NULL,
  mastery_level DECIMAL(5,2) DEFAULT 0.00 COMMENT '숙련도 (0.00-100.00)',
  problems_attempted INT UNSIGNED DEFAULT 0,
  problems_correct INT UNSIGNED DEFAULT 0,
  last_practiced_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_concept (student_id, concept_id),
  INDEX idx_student (student_id),
  INDEX idx_concept (concept_id),
  INDEX idx_mastery (mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 8. LTI 세션 테이블 (Moodle 연동)
-- ================================================
CREATE TABLE lti_sessions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lti_user_id VARCHAR(255) NOT NULL COMMENT 'LTI 사용자 ID',
  lti_context_id VARCHAR(255) NOT NULL COMMENT 'LTI 컨텍스트(과정) ID',
  lti_resource_link_id VARCHAR(255) NOT NULL COMMENT 'LTI 리소스 링크 ID',
  user_id INT UNSIGNED NULL COMMENT '로컬 사용자 ID',
  session_data JSON NULL COMMENT 'LTI 세션 데이터',
  consumer_key VARCHAR(255) NOT NULL COMMENT 'OAuth consumer key',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_lti_user (lti_user_id),
  INDEX idx_lti_context (lti_context_id),
  INDEX idx_user (user_id),
  INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 9. LTI 소비자(Consumer) 테이블
-- ================================================
CREATE TABLE lti_consumers (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  consumer_key VARCHAR(255) NOT NULL UNIQUE,
  consumer_secret VARCHAR(255) NOT NULL,
  name VARCHAR(200) NOT NULL COMMENT 'LMS 이름',
  lms_type VARCHAR(50) DEFAULT 'moodle' COMMENT 'moodle, canvas, etc.',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_consumer_key (consumer_key),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 10. AI 분석 로그 테이블
-- ================================================
CREATE TABLE ai_analysis_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  problem_id INT UNSIGNED NOT NULL,
  analysis_type VARCHAR(50) DEFAULT 'concept_extraction',
  input_text TEXT NOT NULL,
  suggested_concepts JSON NULL COMMENT '추천된 개념들 [{concept_id, confidence}]',
  processing_time INT UNSIGNED NULL COMMENT '처리 시간 (ms)',
  api_provider VARCHAR(50) NULL COMMENT 'openai, local, etc.',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_problem (problem_id),
  INDEX idx_type (analysis_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================
-- 샘플 데이터 삽입
-- ================================================

-- 관리자 계정 생성 (password: admin123)
INSERT INTO users (username, email, password_hash, role, full_name) VALUES
('admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '관리자'),
('teacher1', 'teacher1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', '김교사'),
('student1', 'student1@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', '박학생');

-- 수학 개념 계층 구조 샘플
INSERT INTO concepts (parent_id, name, name_en, description, subject, level, order_index) VALUES
(NULL, '수학', 'Mathematics', '수학 전체', 'mathematics', 0, 1),
(1, '수와 연산', 'Numbers and Operations', '수와 연산 영역', 'mathematics', 1, 1),
(1, '도형', 'Geometry', '도형 영역', 'mathematics', 1, 2),
(1, '측정', 'Measurement', '측정 영역', 'mathematics', 1, 3),
(2, '분수', 'Fractions', '분수의 개념과 연산', 'mathematics', 2, 1),
(5, '분수의 덧셈', 'Fraction Addition', '분수를 더하는 방법', 'mathematics', 3, 1),
(5, '분수의 뺄셈', 'Fraction Subtraction', '분수를 빼는 방법', 'mathematics', 3, 2),
(5, '분수의 곱셈', 'Fraction Multiplication', '분수를 곱하는 방법', 'mathematics', 3, 3),
(2, '소수', 'Decimals', '소수의 개념과 연산', 'mathematics', 2, 2),
(3, '삼각형', 'Triangles', '삼각형의 성질', 'mathematics', 2, 1);

-- 개념 키워드 샘플
INSERT INTO concept_keywords (concept_id, keyword, weight, language) VALUES
(5, '분수', 1.0, 'ko'),
(5, '분모', 0.9, 'ko'),
(5, '분자', 0.9, 'ko'),
(5, 'fraction', 1.0, 'en'),
(6, '분수', 0.8, 'ko'),
(6, '덧셈', 1.0, 'ko'),
(6, '더하기', 0.9, 'ko'),
(6, '통분', 0.95, 'ko'),
(7, '분수', 0.8, 'ko'),
(7, '뺄셈', 1.0, 'ko'),
(7, '빼기', 0.9, 'ko'),
(8, '분수', 0.8, 'ko'),
(8, '곱셈', 1.0, 'ko'),
(8, '곱하기', 0.9, 'ko');

-- LTI Consumer 샘플 (Moodle)
INSERT INTO lti_consumers (consumer_key, consumer_secret, name, lms_type) VALUES
('moodle_key_12345', 'moodle_secret_67890', 'KAIST Moodle', 'moodle');

-- ================================================
-- 인덱스 최적화
-- ================================================

-- 복합 인덱스 추가
CREATE INDEX idx_problem_subject_difficulty ON problems(subject, difficulty);
CREATE INDEX idx_student_progress_composite ON student_progress(student_id, status, concept_id);
CREATE INDEX idx_concept_parent_subject ON concepts(parent_id, subject);

-- ================================================
-- 뷰 생성
-- ================================================

-- 개념 계층 구조 뷰 (재귀 쿼리 대체용)
CREATE VIEW v_concept_hierarchy AS
SELECT
  c1.id,
  c1.name,
  c1.parent_id,
  c1.subject,
  c1.level,
  c2.name AS parent_name,
  (SELECT COUNT(*) FROM concepts WHERE parent_id = c1.id) AS child_count
FROM concepts c1
LEFT JOIN concepts c2 ON c1.parent_id = c2.id
WHERE c1.is_active = TRUE;

-- 문제-개념 연결 상세 뷰
CREATE VIEW v_problem_concepts_detail AS
SELECT
  pc.id,
  pc.problem_id,
  p.title AS problem_title,
  pc.concept_id,
  c.name AS concept_name,
  c.subject,
  pc.is_primary,
  pc.confidence_score,
  pc.is_ai_suggested,
  pc.confirmed_by_teacher,
  u.full_name AS confirmed_by_name,
  pc.confirmed_at
FROM problem_concepts pc
JOIN problems p ON pc.problem_id = p.id
JOIN concepts c ON pc.concept_id = c.id
LEFT JOIN users u ON pc.confirmed_by = u.id;

-- 학생 개념 숙련도 요약 뷰
CREATE VIEW v_student_concept_mastery AS
SELECT
  cm.student_id,
  u.username,
  u.full_name,
  cm.concept_id,
  c.name AS concept_name,
  c.subject,
  cm.mastery_level,
  cm.problems_attempted,
  cm.problems_correct,
  CASE
    WHEN cm.problems_attempted > 0
    THEN ROUND((cm.problems_correct / cm.problems_attempted) * 100, 2)
    ELSE 0
  END AS accuracy_rate,
  cm.last_practiced_at
FROM concept_mastery cm
JOIN users u ON cm.student_id = u.id
JOIN concepts c ON cm.concept_id = c.id;

-- ================================================
-- 스토어드 프로시저
-- ================================================

DELIMITER $$

-- 문제에 AI 추천 개념 추가
CREATE PROCEDURE sp_add_ai_suggested_concept(
  IN p_problem_id INT UNSIGNED,
  IN p_concept_id INT UNSIGNED,
  IN p_confidence DECIMAL(4,3),
  IN p_is_primary BOOLEAN
)
BEGIN
  INSERT INTO problem_concepts (
    problem_id,
    concept_id,
    is_primary,
    confidence_score,
    is_ai_suggested
  ) VALUES (
    p_problem_id,
    p_concept_id,
    p_is_primary,
    p_confidence,
    TRUE
  )
  ON DUPLICATE KEY UPDATE
    confidence_score = p_confidence,
    is_primary = p_is_primary;
END$$

-- 교사가 개념 확인
CREATE PROCEDURE sp_confirm_concept(
  IN p_problem_concept_id INT UNSIGNED,
  IN p_teacher_id INT UNSIGNED
)
BEGIN
  UPDATE problem_concepts
  SET
    confirmed_by_teacher = TRUE,
    confirmed_by = p_teacher_id,
    confirmed_at = CURRENT_TIMESTAMP
  WHERE id = p_problem_concept_id;
END$$

-- 학생 개념 숙련도 업데이트
CREATE PROCEDURE sp_update_concept_mastery(
  IN p_student_id INT UNSIGNED,
  IN p_concept_id INT UNSIGNED,
  IN p_is_correct BOOLEAN
)
BEGIN
  INSERT INTO concept_mastery (
    student_id,
    concept_id,
    mastery_level,
    problems_attempted,
    problems_correct,
    last_practiced_at
  ) VALUES (
    p_student_id,
    p_concept_id,
    IF(p_is_correct, 10.00, 0.00),
    1,
    IF(p_is_correct, 1, 0),
    CURRENT_TIMESTAMP
  )
  ON DUPLICATE KEY UPDATE
    problems_attempted = problems_attempted + 1,
    problems_correct = problems_correct + IF(p_is_correct, 1, 0),
    mastery_level = LEAST(100.00, mastery_level + IF(p_is_correct, 5.00, -2.00)),
    last_practiced_at = CURRENT_TIMESTAMP;
END$$

DELIMITER ;

-- ================================================
-- 권한 설정 (필요시)
-- ================================================
-- CREATE USER 'lms_app'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON lms_concept_system.* TO 'lms_app'@'localhost';
-- FLUSH PRIVILEGES;
