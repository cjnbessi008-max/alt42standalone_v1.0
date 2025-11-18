-- Trig Flow Integrator Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- 문제 정보 테이블 (Moodle에서 가져온 문제)
CREATE TABLE IF NOT EXISTS trig_problems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_quiz_id INT NOT NULL COMMENT 'Moodle 퀴즈 ID',
    moodle_question_id INT NOT NULL COMMENT 'Moodle 문제 ID',
    problem_type ENUM('integral', 'derivative', 'basic') NOT NULL DEFAULT 'integral',
    function_type ENUM('sin', 'cos', 'tan', 'mixed') NOT NULL DEFAULT 'sin',
    difficulty_level TINYINT NOT NULL DEFAULT 1 COMMENT '난이도 (1-5)',
    coefficient DECIMAL(5,2) DEFAULT 1.00 COMMENT '계수 (예: 2sin(x)의 2)',
    frequency DECIMAL(5,2) DEFAULT 1.00 COMMENT '주파수 (예: sin(2x)의 2)',
    phase_shift DECIMAL(5,2) DEFAULT 0.00 COMMENT '위상 이동',
    vertical_shift DECIMAL(5,2) DEFAULT 0.00 COMMENT '수직 이동',
    integration_constant DECIMAL(5,2) DEFAULT 0.00 COMMENT '적분 상수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_moodle_quiz (moodle_quiz_id),
    INDEX idx_problem_type (problem_type),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='삼각함수 문제 정보';

-- 학생 진행 상황 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id INT NOT NULL COMMENT '문제 ID',
    session_id VARCHAR(64) NOT NULL COMMENT '세션 ID',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    time_spent_seconds INT DEFAULT 0,
    attempts INT DEFAULT 0 COMMENT '시도 횟수',
    is_correct BOOLEAN DEFAULT FALSE,
    student_answer TEXT COMMENT '학생 답변 (JSON 형식)',
    interaction_data JSON COMMENT '상호작용 데이터 (클릭, 드래그 등)',
    visualization_steps JSON COMMENT '시각화 단계별 데이터',

    INDEX idx_user (moodle_user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_session (session_id),
    INDEX idx_completed (completed_at),

    FOREIGN KEY (problem_id) REFERENCES trig_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 진행 상황';

-- 시각화 설정 테이블
CREATE TABLE IF NOT EXISTS visualization_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_name VARCHAR(50) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='시각화 설정';

-- 기본 설정 데이터 삽입
INSERT INTO visualization_settings (setting_name, setting_value, description) VALUES
('animation_speed', '1.0', '애니메이션 속도 (1.0 = 기본)'),
('curve_smoothness', '100', '곡선 부드러움 (점의 개수)'),
('grid_enabled', 'true', '그리드 표시 여부'),
('axis_labels', 'true', '축 레이블 표시 여부'),
('color_original', '#3498db', '원함수 색상'),
('color_integral', '#e74c3c', '적분 함수 색상'),
('show_area', 'true', '적분 면적 표시 여부')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- 세션 로그 테이블 (디버깅 및 분석용)
CREATE TABLE IF NOT EXISTS session_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    session_id VARCHAR(64) NOT NULL,
    moodle_user_id INT NOT NULL,
    event_type VARCHAR(50) NOT NULL COMMENT '이벤트 유형 (start, click, drag, submit 등)',
    event_data JSON COMMENT '이벤트 상세 데이터',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_session (session_id),
    INDEX idx_event_type (event_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='세션 로그';

-- 뷰: 학생별 통계
CREATE OR REPLACE VIEW student_statistics AS
SELECT
    sp.moodle_user_id,
    COUNT(DISTINCT sp.problem_id) as problems_attempted,
    SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) as problems_correct,
    ROUND(SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 2) as success_rate,
    SUM(sp.time_spent_seconds) as total_time_seconds,
    AVG(sp.time_spent_seconds) as avg_time_per_problem,
    MAX(sp.completed_at) as last_activity
FROM student_progress sp
WHERE sp.completed_at IS NOT NULL
GROUP BY sp.moodle_user_id;

-- 뷰: 문제별 통계
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    tp.id,
    tp.problem_type,
    tp.function_type,
    tp.difficulty_level,
    COUNT(DISTINCT sp.moodle_user_id) as students_attempted,
    SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) as correct_answers,
    COUNT(sp.id) as total_attempts,
    ROUND(SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(sp.id), 2) as success_rate,
    AVG(sp.time_spent_seconds) as avg_time_seconds
FROM trig_problems tp
LEFT JOIN student_progress sp ON tp.id = sp.problem_id
WHERE sp.completed_at IS NOT NULL
GROUP BY tp.id, tp.problem_type, tp.function_type, tp.difficulty_level;
