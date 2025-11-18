-- Next Term Vision Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- 문제 테이블 (수열 문제 저장)
CREATE TABLE IF NOT EXISTS nextterm_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_type ENUM('arithmetic', 'geometric', 'fibonacci', 'pattern') NOT NULL DEFAULT 'arithmetic',
    sequence_data JSON NOT NULL COMMENT '수열 데이터 배열 [1, 3, 5, 7, ...]',
    difficulty_level TINYINT NOT NULL DEFAULT 1 COMMENT '난이도 (1-5)',
    correct_answer INT NOT NULL COMMENT '정답 (다음 항)',
    hint_text VARCHAR(500) DEFAULT NULL COMMENT '힌트 메시지',
    animation_type ENUM('slide', 'fade', 'bounce', 'grow') NOT NULL DEFAULT 'slide',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_type (problem_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='수열 문제 정보';

-- 학생 응답 테이블
CREATE TABLE IF NOT EXISTS nextterm_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    student_id INT NOT NULL COMMENT 'Moodle user ID',
    student_answer INT NOT NULL COMMENT '학생이 제출한 답',
    is_correct TINYINT(1) NOT NULL COMMENT '정답 여부',
    attempt_number TINYINT NOT NULL DEFAULT 1 COMMENT '시도 횟수',
    time_spent_seconds INT DEFAULT NULL COMMENT '소요 시간(초)',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES nextterm_problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 응답 기록';

-- 학생 진행 상황 테이블
CREATE TABLE IF NOT EXISTS nextterm_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Moodle user ID',
    total_problems INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    current_level TINYINT DEFAULT 1,
    last_problem_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student (student_id),
    FOREIGN KEY (last_problem_id) REFERENCES nextterm_problems(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생별 진행 상황';

-- 샘플 데이터 삽입
INSERT INTO nextterm_problems (problem_type, sequence_data, difficulty_level, correct_answer, hint_text, animation_type) VALUES
-- 산술 수열 (공차가 일정)
('arithmetic', '[2, 4, 6, 8, 10]', 1, 12, '각 항이 2씩 증가합니다.', 'slide'),
('arithmetic', '[5, 10, 15, 20]', 1, 25, '5의 배수로 증가합니다.', 'slide'),
('arithmetic', '[1, 3, 5, 7, 9]', 1, 11, '홀수가 순서대로 나옵니다.', 'fade'),
('arithmetic', '[10, 20, 30, 40]', 2, 50, '10씩 증가하는 패턴입니다.', 'slide'),
('arithmetic', '[3, 6, 9, 12, 15]', 2, 18, '3의 배수입니다.', 'bounce'),

-- 기하 수열 (공비가 일정)
('geometric', '[2, 4, 8, 16]', 3, 32, '각 항이 2배씩 증가합니다.', 'grow'),
('geometric', '[1, 3, 9, 27]', 3, 81, '3을 곱해가는 패턴입니다.', 'grow'),
('geometric', '[5, 10, 20, 40]', 3, 80, '2배씩 커집니다.', 'grow'),

-- 피보나치형 수열
('fibonacci', '[1, 1, 2, 3, 5]', 4, 8, '앞의 두 수를 더한 값입니다.', 'slide'),
('fibonacci', '[0, 1, 1, 2, 3, 5]', 4, 8, '피보나치 수열입니다.', 'fade'),

-- 패턴 수열 (복합 규칙)
('pattern', '[1, 2, 4, 7, 11]', 4, 16, '차이가 1, 2, 3, 4씩 증가합니다.', 'bounce'),
('pattern', '[2, 4, 8, 14, 22]', 5, 32, '차이가 2, 4, 6, 8씩 증가합니다.', 'grow'),
('pattern', '[1, 4, 9, 16, 25]', 3, 36, '제곱수 패턴입니다 (1², 2², 3², ...).', 'slide');

-- 통계 뷰 생성
CREATE OR REPLACE VIEW nextterm_statistics AS
SELECT
    p.student_id,
    COUNT(DISTINCT p.problem_id) as problems_attempted,
    SUM(p.is_correct) as correct_count,
    ROUND(AVG(p.is_correct) * 100, 2) as accuracy_percentage,
    AVG(p.time_spent_seconds) as avg_time_seconds,
    MAX(p.submitted_at) as last_activity
FROM nextterm_responses p
GROUP BY p.student_id;
