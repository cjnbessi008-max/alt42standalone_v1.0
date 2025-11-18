-- Balance Scale App Database Schema
-- MySQL 5.7 Compatible

-- 문제 정보 테이블
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    equation TEXT NOT NULL COMMENT '방정식 (예: 2x + 3 = 11)',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='저울 균형 문제 정보';

-- 학생 진행 상황 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Moodle 학생 ID',
    problem_id INT NOT NULL,
    attempt_count INT DEFAULT 0,
    is_solved BOOLEAN DEFAULT FALSE,
    solution_steps JSON COMMENT '학생이 푼 단계별 기록',
    time_spent INT DEFAULT 0 COMMENT '소요 시간 (초)',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생별 문제 풀이 진행 상황';

-- 세션 테이블
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(64) PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_data JSON,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_session (student_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='활성 세션 관리';

-- 통계 테이블
CREATE TABLE IF NOT EXISTS statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    total_attempts INT DEFAULT 0,
    total_solved INT DEFAULT 0,
    avg_time_spent DECIMAL(10, 2) DEFAULT 0.00,
    avg_attempts DECIMAL(5, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_problem_stats (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='문제별 통계';

-- 샘플 데이터 삽입
INSERT INTO problems (moodle_question_id, title, equation, difficulty) VALUES
(1, '간단한 일차방정식', 'x + 5 = 12', 'easy'),
(2, '곱셈이 포함된 방정식', '2x + 3 = 11', 'medium'),
(3, '양변에 변수가 있는 방정식', '3x + 2 = x + 10', 'hard');
