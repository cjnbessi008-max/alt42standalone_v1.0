-- Inequality Tree Database Schema
-- MySQL 5.7 Compatible
-- 부등식 트리 시각화 앱 데이터베이스

-- 부등식 문제 테이블
CREATE TABLE IF NOT EXISTS inequality_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NULL COMMENT 'Moodle 문제 ID (연동용)',
    inequality_expression VARCHAR(500) NOT NULL COMMENT '부등식 표현식 (예: 2x + 3 < 5)',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(100) DEFAULT 'linear' COMMENT '문제 유형 (linear, quadratic, etc)',
    solution_steps TEXT COMMENT '풀이 단계 JSON 형식',
    correct_answer VARCHAR(200) COMMENT '정답',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_moodle_id (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 진행상황 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id INT NOT NULL,
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    user_answer VARCHAR(200) COMMENT '학생이 제출한 답',
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent_seconds INT DEFAULT 0 COMMENT '소요 시간 (초)',
    tree_interactions TEXT COMMENT '트리 인터랙션 기록 (JSON)',
    completed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES inequality_problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (moodle_user_id, problem_id),
    INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 세션 테이블 (학습 세션 추적)
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    session_token VARCHAR(64) UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    device_info VARCHAR(200) COMMENT '디바이스 정보',
    INDEX idx_token (session_token),
    INDEX idx_user_active (moodle_user_id, is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입
INSERT INTO inequality_problems
    (inequality_expression, difficulty_level, category, correct_answer, solution_steps)
VALUES
    ('2x + 3 < 5', 'easy', 'linear', 'x < 1',
     '{"steps": [
         {"step": 1, "expression": "2x + 3 < 5", "operation": "시작", "explanation": "주어진 부등식"},
         {"step": 2, "expression": "2x < 2", "operation": "양변에 -3", "explanation": "양변에서 3을 뺍니다"},
         {"step": 3, "expression": "x < 1", "operation": "양변을 2로 나눔", "explanation": "양변을 2로 나눕니다"}
     ]}'),

    ('3x - 4 >= 8', 'easy', 'linear', 'x >= 4',
     '{"steps": [
         {"step": 1, "expression": "3x - 4 >= 8", "operation": "시작", "explanation": "주어진 부등식"},
         {"step": 2, "expression": "3x >= 12", "operation": "양변에 +4", "explanation": "양변에 4를 더합니다"},
         {"step": 3, "expression": "x >= 4", "operation": "양변을 3으로 나눔", "explanation": "양변을 3으로 나눕니다"}
     ]}'),

    ('-5x + 10 > 0', 'medium', 'linear', 'x < 2',
     '{"steps": [
         {"step": 1, "expression": "-5x + 10 > 0", "operation": "시작", "explanation": "주어진 부등식"},
         {"step": 2, "expression": "-5x > -10", "operation": "양변에 -10", "explanation": "양변에서 10을 뺍니다"},
         {"step": 3, "expression": "x < 2", "operation": "양변을 -5로 나눔 (부등호 반전)", "explanation": "음수로 나누므로 부등호가 반전됩니다"}
     ]}'),

    ('x^2 - 4 < 0', 'hard', 'quadratic', '-2 < x < 2',
     '{"steps": [
         {"step": 1, "expression": "x^2 - 4 < 0", "operation": "시작", "explanation": "주어진 부등식"},
         {"step": 2, "expression": "(x-2)(x+2) < 0", "operation": "인수분해", "explanation": "차분의 제곱 공식 적용"},
         {"step": 3, "expression": "-2 < x < 2", "operation": "부호 판정", "explanation": "두 근 사이에서 음수"}
     ]}');

-- 뷰 생성: 학생별 통계
CREATE OR REPLACE VIEW student_statistics AS
SELECT
    sp.moodle_user_id,
    COUNT(DISTINCT sp.problem_id) as problems_attempted,
    SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) as problems_solved,
    ROUND(AVG(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) * 100, 2) as success_rate,
    AVG(sp.time_spent_seconds) as avg_time_seconds,
    MAX(sp.created_at) as last_activity
FROM student_progress sp
GROUP BY sp.moodle_user_id;
