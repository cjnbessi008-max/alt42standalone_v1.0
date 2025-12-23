-- =====================================================
-- Dual Derivative Sync - Database Schema
-- MySQL 5.7 Compatible
-- For Moodle 3.7 Integration
-- =====================================================

-- Create database (if not exists)
CREATE DATABASE IF NOT EXISTS derivative_sync
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE derivative_sync;

-- =====================================================
-- Table: problems
-- Stores mathematical function problems
-- =====================================================
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT DEFAULT NULL,
    moodle_quiz_id INT DEFAULT NULL,
    moodle_question_id INT DEFAULT NULL,

    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Function definition
    function_expression VARCHAR(500) NOT NULL,
    x_min DECIMAL(10, 4) DEFAULT -5.0000,
    x_max DECIMAL(10, 4) DEFAULT 5.0000,

    -- Problem metadata
    difficulty ENUM('beginner', 'medium', 'advanced') DEFAULT 'medium',
    category VARCHAR(100) DEFAULT 'derivatives',

    -- Target points for specific evaluation
    target_points JSON DEFAULT NULL,

    -- Hints and solutions
    hints JSON DEFAULT NULL,
    solution TEXT DEFAULT NULL,

    -- Status and timestamps
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by INT DEFAULT NULL,

    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_moodle_quiz (moodle_quiz_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: student_sessions
-- Tracks student interaction sessions
-- =====================================================
CREATE TABLE IF NOT EXISTS student_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Student identification (from Moodle)
    moodle_user_id INT NOT NULL,
    student_name VARCHAR(255),
    student_email VARCHAR(255),

    -- Problem reference
    problem_id INT NOT NULL,

    -- Session data
    session_token VARCHAR(64) UNIQUE NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL DEFAULT NULL,

    -- Progress tracking
    is_completed TINYINT(1) DEFAULT 0,
    time_spent_seconds INT DEFAULT 0,

    -- Session metadata
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),

    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_session_token (session_token),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: student_interactions
-- Records every interaction with the visualization
-- =====================================================
CREATE TABLE IF NOT EXISTS student_interactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    session_id INT NOT NULL,
    problem_id INT NOT NULL,

    -- Interaction data
    interaction_type ENUM('x_change', 'function_change', 'play', 'pause', 'reset', 'answer_submit') NOT NULL,
    x_value DECIMAL(10, 4) DEFAULT NULL,
    fx_value DECIMAL(10, 4) DEFAULT NULL,
    fpx_value DECIMAL(10, 4) DEFAULT NULL,

    -- Additional data (JSON for flexibility)
    interaction_data JSON DEFAULT NULL,

    -- Timestamp
    interaction_time TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),

    FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_problem (problem_id),
    INDEX idx_interaction_type (interaction_type),
    INDEX idx_interaction_time (interaction_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: student_answers
-- Stores submitted answers
-- =====================================================
CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,

    session_id INT NOT NULL,
    problem_id INT NOT NULL,
    moodle_user_id INT NOT NULL,

    -- Answer data
    answer_data JSON NOT NULL,
    answer_text TEXT,

    -- Grading
    is_correct TINYINT(1) DEFAULT NULL,
    score DECIMAL(5, 2) DEFAULT NULL,
    max_score DECIMAL(5, 2) DEFAULT 100.00,

    -- Feedback
    feedback TEXT DEFAULT NULL,
    auto_feedback TEXT DEFAULT NULL,

    -- Attempt tracking
    attempt_number INT DEFAULT 1,

    -- Timestamps
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL DEFAULT NULL,

    FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_problem (problem_id),
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: student_progress
-- Aggregated progress data per student per problem
-- =====================================================
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,

    moodle_user_id INT NOT NULL,
    problem_id INT NOT NULL,

    -- Progress metrics
    total_attempts INT DEFAULT 0,
    successful_attempts INT DEFAULT 0,
    total_time_spent INT DEFAULT 0,

    -- Best performance
    best_score DECIMAL(5, 2) DEFAULT NULL,
    best_attempt_id INT DEFAULT NULL,

    -- Status
    status ENUM('not_started', 'in_progress', 'completed', 'mastered') DEFAULT 'not_started',

    -- Mastery indicators
    correct_streak INT DEFAULT 0,
    last_interaction_at TIMESTAMP NULL DEFAULT NULL,
    completed_at TIMESTAMP NULL DEFAULT NULL,

    -- Timestamps
    first_attempt_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_problem (moodle_user_id, problem_id),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: moodle_sync_log
-- Logs synchronization with Moodle LMS
-- =====================================================
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,

    -- Sync operation
    operation_type ENUM('pull_problem', 'push_grade', 'pull_user', 'test_connection') NOT NULL,

    -- References
    moodle_course_id INT DEFAULT NULL,
    moodle_user_id INT DEFAULT NULL,
    problem_id INT DEFAULT NULL,

    -- Sync details
    request_data JSON DEFAULT NULL,
    response_data JSON DEFAULT NULL,

    -- Status
    status ENUM('success', 'failed', 'pending') NOT NULL,
    error_message TEXT DEFAULT NULL,

    -- Timestamps
    sync_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP NULL DEFAULT NULL,

    INDEX idx_operation_type (operation_type),
    INDEX idx_status (status),
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_sync_started (sync_started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Table: system_config
-- Stores system configuration
-- =====================================================
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,

    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value TEXT,
    config_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',

    description TEXT,
    is_editable TINYINT(1) DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- Insert default configuration
-- =====================================================
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('moodle_url', '', 'string', 'Moodle LMS base URL'),
('moodle_ws_token', '', 'string', 'Moodle web service token'),
('session_timeout', '3600', 'number', 'Session timeout in seconds (default: 1 hour)'),
('max_attempts', '5', 'number', 'Maximum attempts per problem'),
('enable_analytics', 'true', 'boolean', 'Enable interaction analytics tracking'),
('enable_moodle_sync', 'true', 'boolean', 'Enable automatic Moodle synchronization')
ON DUPLICATE KEY UPDATE config_value=config_value;

-- =====================================================
-- Insert sample problems for testing
-- =====================================================
INSERT INTO problems (
    title,
    description,
    function_expression,
    x_min,
    x_max,
    difficulty,
    category,
    target_points,
    hints
) VALUES
(
    '데모: 이차 함수의 도함수',
    'x²의 그래프와 그 도함수 2x를 관찰하세요. X 값이 변할 때 기울기가 어떻게 변하는지 확인하세요.',
    'x^2',
    -5.0000,
    5.0000,
    'beginner',
    'derivatives',
    '[0, 1, 2, -1, -2]',
    '["x = 0일 때 기울기는 0입니다.", "x가 증가하면 기울기도 증가합니다.", "f\'(x) = 2x입니다."]'
),
(
    '삼차 함수의 도함수',
    'x³의 도함수를 탐구하세요. 변곡점을 찾을 수 있나요?',
    'x^3',
    -3.0000,
    3.0000,
    'medium',
    'derivatives',
    '[0, 1, -1]',
    '["변곡점은 x = 0입니다.", "f\'(x) = 3x²입니다.", "도함수는 항상 양수이거나 0입니다."]'
),
(
    '삼각함수: 사인',
    'sin(x)의 도함수는 무엇일까요? 그래프를 관찰하세요.',
    'sin(x)',
    -6.2832,
    6.2832,
    'medium',
    'trigonometry',
    '[0, 1.5708, 3.1416, -1.5708]',
    '["sin(x)의 도함수는 cos(x)입니다.", "최댓값과 최솟값에서 기울기는 0입니다."]'
),
(
    '복합 함수',
    '더 복잡한 함수 x³ - 2x를 탐구하세요.',
    'x^3-2*x',
    -3.0000,
    3.0000,
    'advanced',
    'derivatives',
    '[-1.1547, 0, 1.1547]',
    '["극값은 f\'(x) = 0인 지점에서 발생합니다.", "f\'(x) = 3x² - 2입니다."]'
);

-- =====================================================
-- Create views for reporting
-- =====================================================

-- View: Student performance summary
CREATE OR REPLACE VIEW v_student_performance AS
SELECT
    sp.moodle_user_id,
    p.title AS problem_title,
    p.difficulty,
    sp.total_attempts,
    sp.successful_attempts,
    sp.best_score,
    sp.total_time_spent,
    sp.status,
    sp.last_interaction_at,
    CASE
        WHEN sp.total_attempts > 0
        THEN ROUND((sp.successful_attempts / sp.total_attempts) * 100, 2)
        ELSE 0
    END AS success_rate
FROM student_progress sp
JOIN problems p ON sp.problem_id = p.id;

-- View: Problem statistics
CREATE OR REPLACE VIEW v_problem_statistics AS
SELECT
    p.id AS problem_id,
    p.title,
    p.difficulty,
    p.category,
    COUNT(DISTINCT sp.moodle_user_id) AS total_students,
    AVG(sp.total_attempts) AS avg_attempts,
    AVG(sp.best_score) AS avg_best_score,
    SUM(sp.successful_attempts) AS total_successful,
    SUM(sp.total_attempts) AS total_attempts,
    ROUND((SUM(sp.successful_attempts) / NULLIF(SUM(sp.total_attempts), 0)) * 100, 2) AS overall_success_rate
FROM problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
GROUP BY p.id, p.title, p.difficulty, p.category;

-- =====================================================
-- Stored Procedures
-- =====================================================

DELIMITER //

-- Procedure: Start a new student session
CREATE PROCEDURE sp_start_session(
    IN p_moodle_user_id INT,
    IN p_student_name VARCHAR(255),
    IN p_student_email VARCHAR(255),
    IN p_problem_id INT,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    OUT p_session_token VARCHAR(64)
)
BEGIN
    SET p_session_token = MD5(CONCAT(p_moodle_user_id, p_problem_id, NOW(), RAND()));

    INSERT INTO student_sessions (
        moodle_user_id,
        student_name,
        student_email,
        problem_id,
        session_token,
        ip_address,
        user_agent
    ) VALUES (
        p_moodle_user_id,
        p_student_name,
        p_student_email,
        p_problem_id,
        p_session_token,
        p_ip_address,
        p_user_agent
    );

    -- Update student progress
    INSERT INTO student_progress (moodle_user_id, problem_id, status, first_attempt_at)
    VALUES (p_moodle_user_id, p_problem_id, 'in_progress', NOW())
    ON DUPLICATE KEY UPDATE
        status = IF(status = 'not_started', 'in_progress', status),
        last_interaction_at = NOW();
END //

-- Procedure: Record interaction
CREATE PROCEDURE sp_record_interaction(
    IN p_session_id INT,
    IN p_problem_id INT,
    IN p_interaction_type VARCHAR(50),
    IN p_x_value DECIMAL(10,4),
    IN p_fx_value DECIMAL(10,4),
    IN p_fpx_value DECIMAL(10,4),
    IN p_interaction_data JSON
)
BEGIN
    INSERT INTO student_interactions (
        session_id,
        problem_id,
        interaction_type,
        x_value,
        fx_value,
        fpx_value,
        interaction_data
    ) VALUES (
        p_session_id,
        p_problem_id,
        p_interaction_type,
        p_x_value,
        p_fx_value,
        p_fpx_value,
        p_interaction_data
    );
END //

DELIMITER ;

-- =====================================================
-- Triggers
-- =====================================================

DELIMITER //

-- Trigger: Update session time on interaction
CREATE TRIGGER tr_update_session_time
AFTER INSERT ON student_interactions
FOR EACH ROW
BEGIN
    UPDATE student_sessions
    SET
        last_activity = CURRENT_TIMESTAMP,
        time_spent_seconds = TIMESTAMPDIFF(SECOND, started_at, CURRENT_TIMESTAMP)
    WHERE id = NEW.session_id;
END //

-- Trigger: Update progress on answer submission
CREATE TRIGGER tr_update_progress_on_answer
AFTER INSERT ON student_answers
FOR EACH ROW
BEGIN
    UPDATE student_progress sp
    SET
        total_attempts = total_attempts + 1,
        successful_attempts = successful_attempts + IF(NEW.is_correct = 1, 1, 0),
        best_score = GREATEST(IFNULL(best_score, 0), IFNULL(NEW.score, 0)),
        correct_streak = IF(NEW.is_correct = 1, correct_streak + 1, 0),
        status = CASE
            WHEN NEW.is_correct = 1 AND correct_streak + 1 >= 3 THEN 'mastered'
            WHEN NEW.is_correct = 1 THEN 'completed'
            ELSE 'in_progress'
        END,
        last_interaction_at = NOW(),
        completed_at = IF(NEW.is_correct = 1 AND completed_at IS NULL, NOW(), completed_at)
    WHERE sp.moodle_user_id = NEW.moodle_user_id
      AND sp.problem_id = NEW.problem_id;
END //

DELIMITER ;

-- =====================================================
-- Indexes for optimization
-- =====================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_session_problem ON student_sessions(moodle_user_id, problem_id);
CREATE INDEX idx_answer_user_problem ON student_answers(moodle_user_id, problem_id, submitted_at);
CREATE INDEX idx_interaction_session_time ON student_interactions(session_id, interaction_time);

-- =====================================================
-- Grant permissions (adjust as needed)
-- =====================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON derivative_sync.* TO 'moodle_user'@'localhost';
-- GRANT EXECUTE ON derivative_sync.* TO 'moodle_user'@'localhost';

-- =====================================================
-- End of schema
-- =====================================================

SELECT 'Database schema created successfully!' AS message;
