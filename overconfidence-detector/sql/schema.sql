-- Overconfidence Error Detection System
-- Database Schema for MySQL 5.7
-- 과신 오류 탐지 시스템 데이터베이스 스키마

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS overconfidence_detector
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE overconfidence_detector;

-- ============================================================================
-- 1. 퀴즈/과제 정보 테이블 (Moodle 동기화)
-- ============================================================================

CREATE TABLE IF NOT EXISTS quizzes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  moodle_quiz_id INT UNSIGNED NOT NULL UNIQUE COMMENT 'Moodle의 quiz ID',
  course_id INT UNSIGNED NOT NULL COMMENT 'Moodle 과목 ID',
  quiz_name VARCHAR(255) NOT NULL COMMENT '퀴즈 이름',
  time_limit INT UNSIGNED DEFAULT NULL COMMENT '제한 시간(초)',
  questions_count INT UNSIGNED DEFAULT 0 COMMENT '문제 개수',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_sync_at TIMESTAMP NULL COMMENT '마지막 동기화 시간',
  INDEX idx_moodle_quiz (moodle_quiz_id),
  INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='퀴즈 정보';

-- ============================================================================
-- 2. 문제 정보 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS questions (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  moodle_question_id INT UNSIGNED NOT NULL UNIQUE COMMENT 'Moodle의 question ID',
  quiz_id INT UNSIGNED NOT NULL COMMENT '퀴즈 ID',
  question_type VARCHAR(50) NOT NULL COMMENT '문제 유형 (multichoice, truefalse, essay 등)',
  question_text TEXT COMMENT '문제 내용',
  difficulty_level ENUM('easy', 'medium', 'hard', 'very_hard') DEFAULT 'medium' COMMENT '난이도',
  max_score DECIMAL(10,2) DEFAULT 1.00 COMMENT '만점',
  avg_time_seconds INT UNSIGNED DEFAULT NULL COMMENT '평균 풀이 시간(초)',
  std_dev_time DECIMAL(10,2) DEFAULT NULL COMMENT '풀이 시간 표준편차',
  sample_count INT UNSIGNED DEFAULT 0 COMMENT '통계 샘플 수',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  INDEX idx_moodle_question (moodle_question_id),
  INDEX idx_quiz (quiz_id),
  INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='문제 정보';

-- ============================================================================
-- 3. 학생 정보 테이블 (Moodle 동기화)
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT UNSIGNED NOT NULL UNIQUE COMMENT 'Moodle의 user ID',
  username VARCHAR(100) NOT NULL COMMENT '사용자명',
  firstname VARCHAR(100) DEFAULT NULL COMMENT '이름',
  lastname VARCHAR(100) DEFAULT NULL COMMENT '성',
  email VARCHAR(255) DEFAULT NULL COMMENT '이메일',
  avg_skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'intermediate' COMMENT '평균 실력',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_user (moodle_user_id),
  INDEX idx_username (username),
  INDEX idx_skill (avg_skill_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 정보';

-- ============================================================================
-- 4. 시도(Attempt) 기록 테이블 (Moodle 동기화)
-- ============================================================================

CREATE TABLE IF NOT EXISTS attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  moodle_attempt_id INT UNSIGNED NOT NULL UNIQUE COMMENT 'Moodle의 quiz_attempt ID',
  quiz_id INT UNSIGNED NOT NULL COMMENT '퀴즈 ID',
  student_id INT UNSIGNED NOT NULL COMMENT '학생 ID',
  question_id INT UNSIGNED NOT NULL COMMENT '문제 ID',
  time_started TIMESTAMP NULL COMMENT '시작 시간',
  time_finished TIMESTAMP NULL COMMENT '종료 시간',
  time_spent_seconds INT UNSIGNED NOT NULL COMMENT '실제 풀이 시간(초)',
  score DECIMAL(10,2) DEFAULT NULL COMMENT '획득 점수',
  is_correct BOOLEAN DEFAULT FALSE COMMENT '정답 여부',
  answer_text TEXT COMMENT '학생 답안',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_moodle_attempt (moodle_attempt_id),
  INDEX idx_quiz (quiz_id),
  INDEX idx_student (student_id),
  INDEX idx_question (question_id),
  INDEX idx_time (time_started, time_finished)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 시도 기록';

-- ============================================================================
-- 5. 과신 오류 플래그 테이블 (핵심 테이블)
-- ============================================================================

CREATE TABLE IF NOT EXISTS overconfidence_flags (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT UNSIGNED NOT NULL COMMENT '시도 ID',
  student_id INT UNSIGNED NOT NULL COMMENT '학생 ID',
  question_id INT UNSIGNED NOT NULL COMMENT '문제 ID',
  quiz_id INT UNSIGNED NOT NULL COMMENT '퀴즈 ID',

  -- 통계 정보
  time_spent_seconds INT UNSIGNED NOT NULL COMMENT '실제 풀이 시간',
  avg_time_seconds INT UNSIGNED NOT NULL COMMENT '문제 평균 시간',
  std_dev_time DECIMAL(10,2) NOT NULL COMMENT '표준편차',
  z_score DECIMAL(10,4) NOT NULL COMMENT 'Z-score 값',

  -- 플래그 레벨
  flag_level ENUM('caution', 'warning', 'danger') NOT NULL COMMENT '경고 수준',

  -- 추가 컨텍스트
  is_correct BOOLEAN DEFAULT FALSE COMMENT '정답 여부',
  consecutive_fast_count INT UNSIGNED DEFAULT 1 COMMENT '연속 빠른 풀이 횟수',
  pattern_detected VARCHAR(50) DEFAULT NULL COMMENT '탐지된 패턴 (fast_incorrect, fast_correct 등)',

  -- 처리 상태
  is_reviewed BOOLEAN DEFAULT FALSE COMMENT '검토 완료 여부',
  reviewed_by INT UNSIGNED DEFAULT NULL COMMENT '검토자 ID (교사)',
  review_notes TEXT DEFAULT NULL COMMENT '검토 노트',
  reviewed_at TIMESTAMP NULL COMMENT '검토 시간',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (attempt_id) REFERENCES attempts(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,

  INDEX idx_attempt (attempt_id),
  INDEX idx_student (student_id),
  INDEX idx_question (question_id),
  INDEX idx_quiz (quiz_id),
  INDEX idx_flag_level (flag_level),
  INDEX idx_reviewed (is_reviewed),
  INDEX idx_z_score (z_score),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='과신 오류 플래그';

-- ============================================================================
-- 6. 통계 스냅샷 테이블 (성능 최적화용)
-- ============================================================================

CREATE TABLE IF NOT EXISTS question_statistics (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  question_id INT UNSIGNED NOT NULL COMMENT '문제 ID',
  date DATE NOT NULL COMMENT '통계 날짜',

  -- 기본 통계
  total_attempts INT UNSIGNED DEFAULT 0 COMMENT '총 시도 횟수',
  correct_count INT UNSIGNED DEFAULT 0 COMMENT '정답 횟수',
  incorrect_count INT UNSIGNED DEFAULT 0 COMMENT '오답 횟수',

  -- 시간 통계
  avg_time_seconds INT UNSIGNED DEFAULT NULL COMMENT '평균 풀이 시간',
  min_time_seconds INT UNSIGNED DEFAULT NULL COMMENT '최소 풀이 시간',
  max_time_seconds INT UNSIGNED DEFAULT NULL COMMENT '최대 풀이 시간',
  std_dev_time DECIMAL(10,2) DEFAULT NULL COMMENT '표준편차',
  median_time_seconds INT UNSIGNED DEFAULT NULL COMMENT '중앙값',

  -- 과신 오류 통계
  overconfidence_count INT UNSIGNED DEFAULT 0 COMMENT '과신 오류 건수',
  overconfidence_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '과신 오류 비율(%)',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_question_date (question_id, date),
  INDEX idx_question (question_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='문제별 통계 스냅샷';

-- ============================================================================
-- 7. 학생 통계 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_statistics (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  student_id INT UNSIGNED NOT NULL COMMENT '학생 ID',
  quiz_id INT UNSIGNED DEFAULT NULL COMMENT '퀴즈 ID (NULL이면 전체)',
  date DATE NOT NULL COMMENT '통계 날짜',

  -- 시도 통계
  total_attempts INT UNSIGNED DEFAULT 0 COMMENT '총 시도 횟수',
  correct_count INT UNSIGNED DEFAULT 0 COMMENT '정답 횟수',
  accuracy_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '정확도(%)',

  -- 과신 오류 통계
  overconfidence_count INT UNSIGNED DEFAULT 0 COMMENT '과신 오류 건수',
  overconfidence_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '과신 오류 비율(%)',
  caution_count INT UNSIGNED DEFAULT 0 COMMENT 'Level 1 경고',
  warning_count INT UNSIGNED DEFAULT 0 COMMENT 'Level 2 경고',
  danger_count INT UNSIGNED DEFAULT 0 COMMENT 'Level 3 위험',

  -- 평균 시간
  avg_time_seconds INT UNSIGNED DEFAULT NULL COMMENT '평균 풀이 시간',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_quiz_date (student_id, quiz_id, date),
  INDEX idx_student (student_id),
  INDEX idx_quiz (quiz_id),
  INDEX idx_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생별 통계';

-- ============================================================================
-- 8. 동기화 로그 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS sync_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  sync_type ENUM('full', 'incremental', 'manual') NOT NULL COMMENT '동기화 유형',
  status ENUM('running', 'completed', 'failed') NOT NULL COMMENT '상태',
  records_synced INT UNSIGNED DEFAULT 0 COMMENT '동기화된 레코드 수',
  errors_count INT UNSIGNED DEFAULT 0 COMMENT '오류 수',
  error_message TEXT DEFAULT NULL COMMENT '오류 메시지',
  started_at TIMESTAMP NULL COMMENT '시작 시간',
  completed_at TIMESTAMP NULL COMMENT '완료 시간',
  duration_seconds INT UNSIGNED DEFAULT NULL COMMENT '소요 시간(초)',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_status (status),
  INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='동기화 로그';

-- ============================================================================
-- 9. 시스템 설정 테이블
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT '설정 키',
  setting_value TEXT NOT NULL COMMENT '설정 값',
  setting_type ENUM('string', 'integer', 'float', 'boolean', 'json') DEFAULT 'string' COMMENT '데이터 타입',
  description VARCHAR(255) DEFAULT NULL COMMENT '설명',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='시스템 설정';

-- ============================================================================
-- 기본 설정 값 삽입
-- ============================================================================

INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
  ('z_score_threshold_caution', '-1.5', 'float', 'Z-score 주의 수준 임계값'),
  ('z_score_threshold_warning', '-2.0', 'float', 'Z-score 경고 수준 임계값'),
  ('z_score_threshold_danger', '-2.5', 'float', 'Z-score 위험 수준 임계값'),
  ('min_sample_size', '30', 'integer', '통계 계산 최소 샘플 수'),
  ('sync_interval_minutes', '10', 'integer', 'Moodle 동기화 주기(분)'),
  ('consecutive_fast_threshold', '3', 'integer', '연속 빠른 풀이 임계값'),
  ('enable_email_notifications', 'false', 'boolean', '이메일 알림 활성화'),
  ('dashboard_refresh_seconds', '30', 'integer', '대시보드 자동 새로고침 주기(초)')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- ============================================================================
-- 뷰 (Views) 생성
-- ============================================================================

-- 과신 오류 요약 뷰
CREATE OR REPLACE VIEW v_overconfidence_summary AS
SELECT
  of.id,
  of.created_at,
  s.moodle_user_id,
  s.username,
  CONCAT(s.firstname, ' ', s.lastname) AS student_name,
  q.quiz_name,
  qu.question_type,
  of.time_spent_seconds,
  of.avg_time_seconds,
  of.z_score,
  of.flag_level,
  of.is_correct,
  of.pattern_detected,
  of.is_reviewed
FROM overconfidence_flags of
INNER JOIN students s ON of.student_id = s.id
INNER JOIN quizzes q ON of.quiz_id = q.id
INNER JOIN questions qu ON of.question_id = qu.id
INNER JOIN attempts a ON of.attempt_id = a.id
ORDER BY of.created_at DESC;

-- 학생별 과신 오류 통계 뷰
CREATE OR REPLACE VIEW v_student_overconfidence_stats AS
SELECT
  s.id AS student_id,
  s.moodle_user_id,
  s.username,
  COUNT(of.id) AS total_flags,
  SUM(CASE WHEN of.flag_level = 'caution' THEN 1 ELSE 0 END) AS caution_count,
  SUM(CASE WHEN of.flag_level = 'warning' THEN 1 ELSE 0 END) AS warning_count,
  SUM(CASE WHEN of.flag_level = 'danger' THEN 1 ELSE 0 END) AS danger_count,
  SUM(CASE WHEN of.is_correct = TRUE THEN 1 ELSE 0 END) AS correct_fast_count,
  SUM(CASE WHEN of.is_correct = FALSE THEN 1 ELSE 0 END) AS incorrect_fast_count,
  AVG(of.z_score) AS avg_z_score,
  MAX(of.created_at) AS last_flag_at
FROM students s
LEFT JOIN overconfidence_flags of ON s.id = of.student_id
GROUP BY s.id, s.moodle_user_id, s.username;

-- 퀴즈별 과신 오류 통계 뷰
CREATE OR REPLACE VIEW v_quiz_overconfidence_stats AS
SELECT
  q.id AS quiz_id,
  q.moodle_quiz_id,
  q.quiz_name,
  q.questions_count,
  COUNT(DISTINCT of.student_id) AS affected_students,
  COUNT(of.id) AS total_flags,
  SUM(CASE WHEN of.flag_level = 'danger' THEN 1 ELSE 0 END) AS danger_count,
  AVG(of.z_score) AS avg_z_score,
  (COUNT(of.id) * 100.0 / NULLIF(COUNT(a.id), 0)) AS flag_rate
FROM quizzes q
LEFT JOIN attempts a ON q.id = a.quiz_id
LEFT JOIN overconfidence_flags of ON a.id = of.attempt_id
GROUP BY q.id, q.moodle_quiz_id, q.quiz_name, q.questions_count;

-- ============================================================================
-- 인덱스 최적화 (추가)
-- ============================================================================

-- 복합 인덱스 추가
ALTER TABLE attempts
  ADD INDEX idx_student_quiz (student_id, quiz_id),
  ADD INDEX idx_question_time (question_id, time_spent_seconds);

ALTER TABLE overconfidence_flags
  ADD INDEX idx_student_quiz_created (student_id, quiz_id, created_at),
  ADD INDEX idx_flag_level_created (flag_level, created_at);

-- ============================================================================
-- 트리거 생성 (자동 통계 갱신)
-- ============================================================================

DELIMITER $$

-- 새로운 시도 기록 시 문제 통계 업데이트
CREATE TRIGGER trg_after_attempt_insert
AFTER INSERT ON attempts
FOR EACH ROW
BEGIN
  -- 문제 통계 업데이트
  UPDATE questions
  SET
    sample_count = sample_count + 1,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.question_id;
END$$

-- 과신 오류 플래그 생성 시 카운터 증가
CREATE TRIGGER trg_after_flag_insert
AFTER INSERT ON overconfidence_flags
FOR EACH ROW
BEGIN
  -- 학생 통계 업데이트를 위한 로직은 배치 작업으로 처리
  -- (트리거에서 복잡한 통계 계산은 성능 문제 발생 가능)
  UPDATE students
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.student_id;
END$$

DELIMITER ;

-- ============================================================================
-- 완료 메시지
-- ============================================================================

SELECT 'Database schema created successfully!' AS message;
SELECT 'Tables created:' AS info, COUNT(*) AS count FROM information_schema.tables
  WHERE table_schema = 'overconfidence_detector';
