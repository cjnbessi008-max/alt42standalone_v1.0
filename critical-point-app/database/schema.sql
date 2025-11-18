-- Critical Point Highlight Application Database Schema
-- Compatible with MySQL 5.7 and Moodle 3.7
-- Table prefix: mdl_ (Moodle default)

-- ============================================================================
-- Table: mdl_critical_point_problems
-- Stores mathematical function problems for critical point finding
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_critical_point_problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Problem name (e.g., 이차 함수)',
    equation VARCHAR(500) NOT NULL COMMENT 'Mathematical equation as string',
    description TEXT COMMENT 'Problem description for students',
    function_type TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=quadratic, 2=cubic, 3=quartic, 4=trig, 5=mixed',
    difficulty TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1=easy, 2=medium, 3=hard',
    x_min DECIMAL(10,4) DEFAULT -5.0000 COMMENT 'Minimum x value for graphing',
    x_max DECIMAL(10,4) DEFAULT 5.0000 COMMENT 'Maximum x value for graphing',
    expected_critical_points JSON COMMENT 'Expected critical points as JSON array',
    active TINYINT(1) DEFAULT 1 COMMENT 'Is this problem active?',
    created_by INT UNSIGNED COMMENT 'Moodle user ID who created this',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_function_type (function_type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Mathematical function problems for critical point learning';

-- ============================================================================
-- Table: mdl_critical_point_sessions
-- Tracks student learning sessions
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_critical_point_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL COMMENT 'Student identifier (Moodle user ID or session ID)',
    problem_id INT UNSIGNED NOT NULL COMMENT 'Problem being worked on',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    attempt_count INT UNSIGNED DEFAULT 1 COMMENT 'Number of attempts in this session',
    completed TINYINT(1) DEFAULT 0 COMMENT 'Has student completed this problem?',
    score DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score out of 100',

    INDEX idx_student_id (student_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_started_at (started_at),
    INDEX idx_completed (completed),
    UNIQUE KEY unique_session (student_id, problem_id, started_at),

    FOREIGN KEY (problem_id)
        REFERENCES mdl_critical_point_problems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student learning sessions for critical point problems';

-- ============================================================================
-- Table: mdl_critical_point_attempts
-- Records individual attempts to find critical points
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_critical_point_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id INT UNSIGNED NOT NULL COMMENT 'Session this attempt belongs to',
    problem_id INT UNSIGNED NOT NULL COMMENT 'Problem ID',
    student_id VARCHAR(100) NOT NULL COMMENT 'Student identifier',
    critical_points_found JSON COMMENT 'Critical points found by student (JSON array)',
    num_max_found TINYINT UNSIGNED DEFAULT 0 COMMENT 'Number of maximum points found',
    num_min_found TINYINT UNSIGNED DEFAULT 0 COMMENT 'Number of minimum points found',
    is_correct TINYINT(1) DEFAULT NULL COMMENT 'Was this attempt correct?',
    time_spent INT UNSIGNED DEFAULT 0 COMMENT 'Time spent in seconds',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_session_id (session_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_student_id (student_id),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_is_correct (is_correct),

    FOREIGN KEY (session_id)
        REFERENCES mdl_critical_point_sessions(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    FOREIGN KEY (problem_id)
        REFERENCES mdl_critical_point_problems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Individual attempts to find critical points';

-- ============================================================================
-- Table: mdl_critical_point_analytics
-- Aggregated analytics for reporting
-- ============================================================================
CREATE TABLE IF NOT EXISTS mdl_critical_point_analytics (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(100) NOT NULL,
    problem_id INT UNSIGNED NOT NULL,
    total_attempts INT UNSIGNED DEFAULT 0,
    successful_attempts INT UNSIGNED DEFAULT 0,
    total_time_spent INT UNSIGNED DEFAULT 0 COMMENT 'Total time in seconds',
    average_accuracy DECIMAL(5,2) DEFAULT 0.00,
    last_attempt_at TIMESTAMP NULL,
    first_attempt_at TIMESTAMP NULL,

    UNIQUE KEY unique_analytics (student_id, problem_id),
    INDEX idx_student_id (student_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_accuracy (average_accuracy),

    FOREIGN KEY (problem_id)
        REFERENCES mdl_critical_point_problems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Aggregated analytics for student performance';

-- ============================================================================
-- Insert Sample Problems
-- ============================================================================
INSERT INTO mdl_critical_point_problems
(name, equation, description, function_type, difficulty, x_min, x_max, expected_critical_points)
VALUES
('이차 함수', 'f(x) = -x² + 4x + 1',
 '기본적인 이차 함수입니다. 극댓값을 찾아보세요!',
 1, 1, -5, 5,
 '[{"x": 2, "y": 5, "type": "maximum"}]'),

('삼차 함수', 'f(x) = x³ - 6x² + 9x + 1',
 '삼차 함수는 극댓값과 극솟값을 모두 가질 수 있습니다!',
 2, 2, -5, 5,
 '[{"x": 1, "y": 5, "type": "maximum"}, {"x": 3, "y": 1, "type": "minimum"}]'),

('사차 함수', 'f(x) = 0.1x⁴ - x² + 2',
 '사차 함수에서 극값들을 찾아보세요!',
 3, 3, -5, 5,
 '[{"x": -2.236, "y": -0.8, "type": "minimum"}, {"x": 0, "y": 2, "type": "maximum"}, {"x": 2.236, "y": -0.8, "type": "minimum"}]'),

('삼각 함수', 'f(x) = 2sin(x) + cos(2x)',
 '삼각 함수는 주기적으로 극값이 나타납니다!',
 4, 3, -5, 5,
 '[]'),

('복합 함수', 'f(x) = x³ - 3x² - 9x + 5',
 '조금 더 복잡한 삼차 함수입니다. 극값이 2개 있어요!',
 5, 2, -5, 5,
 '[{"x": -1, "y": 10, "type": "maximum"}, {"x": 3, "y": -22, "type": "minimum"}]');

-- ============================================================================
-- Views for Reporting
-- ============================================================================

-- Student Progress View
CREATE OR REPLACE VIEW vw_student_progress AS
SELECT
    s.student_id,
    s.problem_id,
    p.name AS problem_name,
    p.difficulty,
    COUNT(a.id) AS total_attempts,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts,
    AVG(a.time_spent) AS avg_time_spent,
    MAX(a.attempted_at) AS last_attempt,
    s.completed,
    s.score
FROM mdl_critical_point_sessions s
LEFT JOIN mdl_critical_point_attempts a ON s.id = a.session_id
LEFT JOIN mdl_critical_point_problems p ON s.problem_id = p.id
GROUP BY s.student_id, s.problem_id, p.name, p.difficulty, s.completed, s.score;

-- Problem Difficulty Analysis View
CREATE OR REPLACE VIEW vw_problem_difficulty AS
SELECT
    p.id,
    p.name,
    p.difficulty,
    COUNT(DISTINCT s.student_id) AS students_attempted,
    COUNT(a.id) AS total_attempts,
    AVG(a.time_spent) AS avg_time_per_attempt,
    AVG(CASE WHEN a.is_correct = 1 THEN 100 ELSE 0 END) AS success_rate
FROM mdl_critical_point_problems p
LEFT JOIN mdl_critical_point_sessions s ON p.id = s.problem_id
LEFT JOIN mdl_critical_point_attempts a ON s.id = a.session_id
WHERE p.active = 1
GROUP BY p.id, p.name, p.difficulty;

-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER //

-- Procedure to update analytics after each attempt
CREATE PROCEDURE sp_update_analytics(
    IN p_student_id VARCHAR(100),
    IN p_problem_id INT UNSIGNED,
    IN p_is_correct TINYINT(1),
    IN p_time_spent INT UNSIGNED
)
BEGIN
    INSERT INTO mdl_critical_point_analytics
        (student_id, problem_id, total_attempts, successful_attempts,
         total_time_spent, first_attempt_at, last_attempt_at)
    VALUES
        (p_student_id, p_problem_id, 1,
         IF(p_is_correct = 1, 1, 0),
         p_time_spent, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
        total_attempts = total_attempts + 1,
        successful_attempts = successful_attempts + IF(p_is_correct = 1, 1, 0),
        total_time_spent = total_time_spent + p_time_spent,
        average_accuracy = (successful_attempts * 100.0) / total_attempts,
        last_attempt_at = NOW();
END //

DELIMITER ;

-- ============================================================================
-- Triggers
-- ============================================================================

DELIMITER //

-- Trigger to update analytics when new attempt is recorded
CREATE TRIGGER trg_after_attempt_insert
AFTER INSERT ON mdl_critical_point_attempts
FOR EACH ROW
BEGIN
    CALL sp_update_analytics(
        NEW.student_id,
        NEW.problem_id,
        NEW.is_correct,
        NEW.time_spent
    );
END //

DELIMITER ;
