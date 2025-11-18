-- ============================================
-- 조건 스캐너 데이터베이스 스키마
-- MySQL 5.7+
-- ============================================

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS condition_scanner
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE condition_scanner;

-- ============================================
-- activities 테이블: Moodle 활동 정보 저장
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id INT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  modulename VARCHAR(100) NOT NULL,
  course_id INT NOT NULL,
  availability TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_course_id (course_id),
  INDEX idx_modulename (modulename)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- conditions 테이블: 활동의 접근 조건 저장
-- ============================================
CREATE TABLE IF NOT EXISTS conditions (
  id VARCHAR(100) PRIMARY KEY,
  activity_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  operator VARCHAR(10),
  value TEXT,
  parent_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_activity_id (activity_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- scan_history 테이블: 스캔 기록 저장
-- ============================================
CREATE TABLE IF NOT EXISTS scan_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  activity_id INT NOT NULL,
  scan_data JSON NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (activity_id) REFERENCES activities(id) ON DELETE CASCADE,
  INDEX idx_activity_id (activity_id),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 샘플 데이터 (테스트용)
-- ============================================

-- 샘플 활동
INSERT INTO activities (id, name, modulename, course_id, availability) VALUES
(1, '과제 1: Python 기초', 'assign', 1, '{"op":"&","c":[{"type":"completion","cm":2}],"showc":[true]}'),
(2, '퀴즈 1: 변수와 자료형', 'quiz', 1, '{"op":"&","c":[{"type":"completion","cm":1},{"type":"grade","id":1,"min":70}],"showc":[true,true]}'),
(3, '포럼 토론: 알고리즘 이해', 'forum', 1, NULL);

-- 샘플 조건 (활동 1)
INSERT INTO conditions (id, activity_id, type, description, operator, value) VALUES
('cond_1_0', 1, 'completion', '이전 레슨 완료 필요', 'AND', '완료 필요');

-- 샘플 조건 (활동 2)
INSERT INTO conditions (id, activity_id, type, description, operator, value) VALUES
('cond_2_0', 2, 'completion', '과제 1 완료 필요', 'AND', '완료 필요'),
('cond_2_1', 2, 'grade', '과제 1에서 70% 이상 획득', 'AND', '최소 70%');

-- ============================================
-- 유용한 쿼리 예제
-- ============================================

-- 1. 특정 코스의 모든 활동 조회
-- SELECT * FROM activities WHERE course_id = 1;

-- 2. 조건이 있는 활동만 조회
-- SELECT a.* FROM activities a
-- INNER JOIN conditions c ON a.id = c.activity_id
-- GROUP BY a.id;

-- 3. 특정 활동의 모든 조건 조회
-- SELECT * FROM conditions WHERE activity_id = 1 ORDER BY created_at;

-- 4. 최근 스캔 기록 조회
-- SELECT sh.*, a.name as activity_name
-- FROM scan_history sh
-- INNER JOIN activities a ON sh.activity_id = a.id
-- ORDER BY sh.timestamp DESC
-- LIMIT 10;

-- 5. 조건 타입별 통계
-- SELECT type, COUNT(*) as count
-- FROM conditions
-- GROUP BY type
-- ORDER BY count DESC;
