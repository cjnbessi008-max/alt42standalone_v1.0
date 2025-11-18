-- Truth Rhythm Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS truth_rhythm
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE truth_rhythm;

-- 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 문제 테이블
CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_question_id INT DEFAULT NULL,
  question_text TEXT NOT NULL,
  correct_answer BOOLEAN NOT NULL COMMENT '1 = True, 0 = False',
  difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  category VARCHAR(100) DEFAULT NULL,
  explanation TEXT DEFAULT NULL,
  sound_true VARCHAR(255) DEFAULT 'true-rhythm.mp3',
  sound_false VARCHAR(255) DEFAULT 'false-rhythm.mp3',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_question_id (moodle_question_id),
  INDEX idx_difficulty (difficulty_level),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학습 세션 테이블
CREATE TABLE IF NOT EXISTS learning_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL DEFAULT NULL,
  total_questions INT DEFAULT 0,
  correct_answers INT DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 답안 기록 테이블
CREATE TABLE IF NOT EXISTS answer_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  user_answer BOOLEAN NOT NULL,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INT DEFAULT NULL COMMENT 'Response time in milliseconds',
  sound_played VARCHAR(255) DEFAULT NULL,
  answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
  INDEX idx_session_id (session_id),
  INDEX idx_user_id (user_id),
  INDEX idx_question_id (question_id),
  INDEX idx_answered_at (answered_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 진도 테이블
CREATE TABLE IF NOT EXISTS user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  total_questions_attempted INT DEFAULT 0,
  total_correct INT DEFAULT 0,
  accuracy_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentage',
  current_streak INT DEFAULT 0 COMMENT 'Consecutive correct answers',
  best_streak INT DEFAULT 0,
  last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_progress (user_id),
  INDEX idx_accuracy (accuracy_rate),
  INDEX idx_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 리듬 패턴 테이블 (커스터마이징용)
CREATE TABLE IF NOT EXISTS rhythm_patterns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pattern_name VARCHAR(100) NOT NULL UNIQUE,
  pattern_type ENUM('true', 'false') NOT NULL,
  sound_file VARCHAR(255) NOT NULL,
  bpm INT DEFAULT 120 COMMENT 'Beats per minute',
  duration_ms INT DEFAULT 2000 COMMENT 'Duration in milliseconds',
  description TEXT DEFAULT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_pattern_type (pattern_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입
INSERT INTO questions (question_text, correct_answer, difficulty_level, category, explanation) VALUES
('2 + 2 = 4', TRUE, 'easy', 'arithmetic', '2 더하기 2는 4입니다.'),
('태양은 서쪽에서 뜬다', FALSE, 'easy', 'science', '태양은 동쪽에서 떠서 서쪽으로 집니다.'),
('물의 끓는점은 섭씨 100도이다', TRUE, 'medium', 'science', '표준 기압에서 물은 섭씨 100도에서 끓습니다.'),
('한국의 수도는 부산이다', FALSE, 'easy', 'geography', '한국의 수도는 서울입니다.'),
('원주율 π는 3.14159...로 시작한다', TRUE, 'medium', 'mathematics', '원주율 π는 무리수이며 3.14159...로 시작합니다.');

-- 기본 리듬 패턴 삽입
INSERT INTO rhythm_patterns (pattern_name, pattern_type, sound_file, bpm, duration_ms, description, is_default) VALUES
('정답 리듬', 'true', 'true-rhythm.mp3', 120, 2000, '정답일 때 재생되는 경쾌한 리듬', TRUE),
('오답 리듬', 'false', 'false-rhythm.mp3', 80, 2000, '오답일 때 재생되는 신중한 리듬', TRUE);

-- 뷰: 사용자 통계
CREATE OR REPLACE VIEW user_statistics AS
SELECT
  u.id AS user_id,
  u.username,
  up.total_questions_attempted,
  up.total_correct,
  up.accuracy_rate,
  up.current_streak,
  up.best_streak,
  up.last_activity_at,
  COUNT(DISTINCT ls.id) AS total_sessions
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN learning_sessions ls ON u.id = ls.user_id
GROUP BY u.id, u.username, up.total_questions_attempted, up.total_correct,
         up.accuracy_rate, up.current_streak, up.best_streak, up.last_activity_at;

-- 저장 프로시저: 진도 업데이트
DELIMITER $$

CREATE PROCEDURE update_user_progress(
  IN p_user_id INT,
  IN p_is_correct BOOLEAN
)
BEGIN
  DECLARE v_current_streak INT DEFAULT 0;
  DECLARE v_best_streak INT DEFAULT 0;

  -- user_progress 레코드가 없으면 생성
  INSERT INTO user_progress (user_id, total_questions_attempted, total_correct, accuracy_rate, current_streak, best_streak)
  VALUES (p_user_id, 0, 0, 0.00, 0, 0)
  ON DUPLICATE KEY UPDATE user_id = user_id;

  -- 현재 진도 가져오기
  SELECT current_streak, best_streak INTO v_current_streak, v_best_streak
  FROM user_progress
  WHERE user_id = p_user_id;

  -- 정답일 경우 연속 정답 수 증가
  IF p_is_correct THEN
    SET v_current_streak = v_current_streak + 1;
    IF v_current_streak > v_best_streak THEN
      SET v_best_streak = v_current_streak;
    END IF;
  ELSE
    SET v_current_streak = 0;
  END IF;

  -- 진도 업데이트
  UPDATE user_progress
  SET
    total_questions_attempted = total_questions_attempted + 1,
    total_correct = total_correct + IF(p_is_correct, 1, 0),
    accuracy_rate = (total_correct + IF(p_is_correct, 1, 0)) * 100.0 / (total_questions_attempted + 1),
    current_streak = v_current_streak,
    best_streak = v_best_streak,
    last_activity_at = CURRENT_TIMESTAMP
  WHERE user_id = p_user_id;
END$$

DELIMITER ;

-- 권한 설정 (필요시 수정)
-- GRANT ALL PRIVILEGES ON truth_rhythm.* TO 'truth_user'@'localhost' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;
