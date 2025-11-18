-- Inclusion Gate 데이터베이스 스키마
-- MySQL 5.7용

-- Inclusion Gate 시도 기록 테이블
CREATE TABLE IF NOT EXISTS inclusion_gate_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    question_id INT NOT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    score INT NOT NULL DEFAULT 0,
    attempt_time DATETIME NOT NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_question_id (question_id),
    INDEX idx_attempt_time (attempt_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inclusion Gate 사용자 통계 테이블
CREATE TABLE IF NOT EXISTS inclusion_gate_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_attempts INT NOT NULL DEFAULT 0,
    correct_attempts INT NOT NULL DEFAULT 0,
    total_score INT NOT NULL DEFAULT 0,
    last_activity DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inclusion Gate 커스텀 문제 테이블 (선택적)
-- Moodle 문제 외에 커스텀 문제를 추가할 때 사용
CREATE TABLE IF NOT EXISTS inclusion_gate_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_text TEXT NOT NULL,
    correct_answer TINYINT(1) NOT NULL,
    explanation TEXT,
    difficulty INT DEFAULT 1,
    category VARCHAR(100),
    is_active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 커스텀 문제 데이터 추가
INSERT INTO inclusion_gate_questions (question_text, correct_answer, explanation, difficulty, category) VALUES
('3은 {1, 2, 3, 4, 5} 집합에 포함됩니까?', 1, '3은 주어진 집합의 원소입니다.', 1, '집합'),
('6은 {1, 2, 3, 4, 5} 집합에 포함됩니까?', 0, '6은 주어진 집합에 없는 원소입니다.', 1, '집합'),
('짝수 4는 홀수 집합에 포함됩니까?', 0, '4는 짝수이므로 홀수 집합에 포함되지 않습니다.', 2, '수의 분류'),
('사과는 과일 집합에 포함됩니까?', 1, '사과는 과일의 한 종류입니다.', 1, '분류'),
('토마토는 채소 집합에 포함됩니까?', 0, '토마토는 과학적으로 과일로 분류됩니다.', 3, '분류'),
('정삼각형은 삼각형 집합에 포함됩니까?', 1, '정삼각형은 삼각형의 한 종류입니다.', 2, '도형'),
('원은 다각형 집합에 포함됩니까?', 0, '원은 곡선으로 이루어져 있어 다각형이 아닙니다.', 2, '도형'),
('0은 자연수 집합에 포함됩니까?', 0, '자연수는 1부터 시작합니다.', 2, '수의 분류'),
('-5는 정수 집합에 포함됩니까?', 1, '정수는 음수, 0, 양수를 모두 포함합니다.', 2, '수의 분류'),
('0.5는 유리수 집합에 포함됩니까?', 1, '0.5는 1/2로 표현할 수 있는 유리수입니다.', 3, '수의 분류');

-- 사용자 통계 초기화 트리거 (선택적)
DELIMITER //
CREATE TRIGGER after_attempt_insert
AFTER INSERT ON inclusion_gate_attempts
FOR EACH ROW
BEGIN
    INSERT INTO inclusion_gate_stats (user_id, total_attempts, correct_attempts, total_score, last_activity)
    VALUES (NEW.user_id, 1, NEW.is_correct, NEW.score, NEW.attempt_time)
    ON DUPLICATE KEY UPDATE
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + NEW.is_correct,
        total_score = total_score + NEW.score,
        last_activity = NEW.attempt_time;
END//
DELIMITER ;

-- 통계 조회용 뷰
CREATE OR REPLACE VIEW inclusion_gate_user_performance AS
SELECT
    s.user_id,
    s.total_attempts,
    s.correct_attempts,
    s.total_score,
    ROUND(s.correct_attempts / s.total_attempts * 100, 2) as accuracy_percentage,
    s.last_activity
FROM inclusion_gate_stats s
WHERE s.total_attempts > 0;
