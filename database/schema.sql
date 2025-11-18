-- Composition Puzzle Database Schema
-- MySQL 5.7+

-- 데이터베이스 생성 (존재하지 않을 경우)
CREATE DATABASE IF NOT EXISTS composition_puzzle
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE composition_puzzle;

-- 문제 테이블
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  available_functions JSON NOT NULL COMMENT '사용 가능한 함수 ID 목록',
  target_composition VARCHAR(255) NOT NULL COMMENT '목표 합성함수 표현식',
  test_cases JSON NOT NULL COMMENT '테스트 케이스 배열',
  max_attempts INT NOT NULL DEFAULT 5 COMMENT '최대 시도 횟수',
  time_limit INT NULL COMMENT '제한 시간 (초)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 시도 기록 테이블
CREATE TABLE IF NOT EXISTS student_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  problem_id INT NOT NULL,
  student_id VARCHAR(255) NOT NULL COMMENT 'LTI user_id',
  student_name VARCHAR(255) NULL,
  composition JSON NOT NULL COMMENT '학생이 만든 합성함수',
  result JSON NOT NULL COMMENT '채점 결과',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_problem_id (problem_id),
  INDEX idx_student_id (student_id),
  INDEX idx_created_at (created_at),
  INDEX idx_problem_student (problem_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LTI 세션 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS lti_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  username VARCHAR(255) NULL,
  context_id VARCHAR(255) NULL,
  resource_link_id VARCHAR(255) NULL,
  lis_outcome_service_url TEXT NULL,
  lis_result_sourcedid TEXT NULL,
  session_data JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_context_id (context_id),
  INDEX idx_resource_link_id (resource_link_id),
  INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입

-- 샘플 문제 1: f(g(x)) 만들기
INSERT INTO problems (title, description, available_functions, target_composition, test_cases, max_attempts, time_limit)
VALUES (
  '합성함수 기초: f(g(x))',
  'f(x) = x + 2, g(x) = 2x를 조합하여 f(g(x))를 만들어보세요.',
  JSON_ARRAY('f1', 'g1'),
  'f(g(x))',
  JSON_ARRAY(
    JSON_OBJECT('input', 0, 'expectedOutput', 2),
    JSON_OBJECT('input', 1, 'expectedOutput', 4),
    JSON_OBJECT('input', 2, 'expectedOutput', 6),
    JSON_OBJECT('input', 3, 'expectedOutput', 8),
    JSON_OBJECT('input', -1, 'expectedOutput', 0)
  ),
  5,
  600
);

-- 샘플 문제 2: g(f(x)) 만들기
INSERT INTO problems (title, description, available_functions, target_composition, test_cases, max_attempts, time_limit)
VALUES (
  '합성함수 기초: g(f(x))',
  'f(x) = x + 2, g(x) = 2x를 조합하여 g(f(x))를 만들어보세요.',
  JSON_ARRAY('f1', 'g1'),
  'g(f(x))',
  JSON_ARRAY(
    JSON_OBJECT('input', 0, 'expectedOutput', 4),
    JSON_OBJECT('input', 1, 'expectedOutput', 6),
    JSON_OBJECT('input', 2, 'expectedOutput', 8),
    JSON_OBJECT('input', 3, 'expectedOutput', 10),
    JSON_OBJECT('input', -1, 'expectedOutput', 2)
  ),
  5,
  600
);

-- 샘플 문제 3: 3중 합성함수
INSERT INTO problems (title, description, available_functions, target_composition, test_cases, max_attempts, time_limit)
VALUES (
  '복잡한 합성함수: f(g(h(x)))',
  'f(x) = x + 2, g(x) = 2x, h(x) = x²를 조합하여 f(g(h(x)))를 만들어보세요.',
  JSON_ARRAY('f1', 'g1', 'h1'),
  'f(g(h(x)))',
  JSON_ARRAY(
    JSON_OBJECT('input', 0, 'expectedOutput', 2),
    JSON_OBJECT('input', 1, 'expectedOutput', 4),
    JSON_OBJECT('input', 2, 'expectedOutput', 10),
    JSON_OBJECT('input', 3, 'expectedOutput', 20),
    JSON_OBJECT('input', -1, 'expectedOutput', 4)
  ),
  10,
  900
);

-- 샘플 문제 4: 역함수 포함
INSERT INTO problems (title, description, available_functions, target_composition, test_cases, max_attempts, time_limit)
VALUES (
  '역함수 다루기',
  '여러 함수를 조합하여 주어진 출력값을 만들어보세요.',
  JSON_ARRAY('f1', 'g1', 'h1', 'k1', 'm1'),
  'custom',
  JSON_ARRAY(
    JSON_OBJECT('input', 1, 'expectedOutput', 3),
    JSON_OBJECT('input', 2, 'expectedOutput', 6),
    JSON_OBJECT('input', 3, 'expectedOutput', 9),
    JSON_OBJECT('input', 4, 'expectedOutput', 12)
  ),
  15,
  1200
);

-- 뷰 생성: 문제별 통계
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
  p.id AS problem_id,
  p.title,
  COUNT(sa.id) AS total_attempts,
  SUM(CASE WHEN JSON_EXTRACT(sa.result, '$.success') = true THEN 1 ELSE 0 END) AS successful_attempts,
  COUNT(DISTINCT sa.student_id) AS unique_students,
  AVG(JSON_EXTRACT(sa.result, '$.score')) AS average_score,
  MAX(sa.created_at) AS last_attempt_at
FROM problems p
LEFT JOIN student_attempts sa ON p.id = sa.problem_id
GROUP BY p.id, p.title;

-- 뷰 생성: 학생별 통계
CREATE OR REPLACE VIEW student_statistics AS
SELECT
  sa.student_id,
  sa.student_name,
  COUNT(sa.id) AS total_attempts,
  SUM(CASE WHEN JSON_EXTRACT(sa.result, '$.success') = true THEN 1 ELSE 0 END) AS successful_attempts,
  COUNT(DISTINCT sa.problem_id) AS problems_attempted,
  AVG(JSON_EXTRACT(sa.result, '$.score')) AS average_score,
  MAX(sa.created_at) AS last_attempt_at
FROM student_attempts sa
GROUP BY sa.student_id, sa.student_name;

-- 인덱스 확인 쿼리
SHOW INDEXES FROM problems;
SHOW INDEXES FROM student_attempts;
SHOW INDEXES FROM lti_sessions;
