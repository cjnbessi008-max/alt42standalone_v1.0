-- MySQL 5.7 Compatible Schema for Moodle LMS Integration
-- Supports Moodle 3.7, PHP 7.1.9, MySQL 5.7
--
-- This schema stores data about Moodle questions, reconstructed problems,
-- and complexity assessments for the reverse problem integration feature.

-- Database: alt42_moodle_integration
-- Character set: utf8mb4 for full Unicode support (including emoji)
-- Collation: utf8mb4_unicode_ci

-- ============================================================================
-- Table: moodle_connections
-- Stores Moodle LMS connection configurations
-- ============================================================================
CREATE TABLE IF NOT EXISTS moodle_connections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Connection name',
    base_url VARCHAR(512) NOT NULL COMMENT 'Moodle site base URL',
    ws_token_encrypted TEXT NOT NULL COMMENT 'Encrypted web service token',
    is_active TINYINT(1) DEFAULT 1 COMMENT 'Whether connection is active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    UNIQUE KEY unique_base_url (base_url)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Moodle LMS connection configurations';


-- ============================================================================
-- Table: moodle_questions
-- Stores questions fetched from Moodle question bank
-- ============================================================================
CREATE TABLE IF NOT EXISTS moodle_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    connection_id INT NOT NULL COMMENT 'Reference to moodle_connections',
    moodle_question_id INT NOT NULL COMMENT 'Original question ID in Moodle',
    name VARCHAR(512) NOT NULL COMMENT 'Question name',
    question_text TEXT NOT NULL COMMENT 'Question text content',
    question_type VARCHAR(50) NOT NULL COMMENT 'Type: multichoice, truefalse, shortanswer, numerical, etc.',
    category_id INT DEFAULT NULL COMMENT 'Moodle category ID',

    -- Question metadata
    difficulty_level DECIMAL(3,2) DEFAULT NULL COMMENT 'Difficulty level (0.00-5.00)',
    time_created INT DEFAULT NULL COMMENT 'Unix timestamp from Moodle',
    time_modified INT DEFAULT NULL COMMENT 'Unix timestamp from Moodle',

    -- Question structure (JSON)
    options JSON DEFAULT NULL COMMENT 'Question-specific options',
    answers JSON DEFAULT NULL COMMENT 'Answer choices',

    -- Complexity metrics
    condition_count INT DEFAULT 0 COMMENT 'Number of logical conditions',
    nesting_depth INT DEFAULT 0 COMMENT 'Depth of nested logic',
    entity_count INT DEFAULT 0 COMMENT 'Number of entities/concepts',
    has_cyclical_dependencies TINYINT(1) DEFAULT 0 COMMENT 'Has circular dependencies',
    complexity_level VARCHAR(20) DEFAULT 'simple' COMMENT 'simple, moderate, complex, very_complex',

    -- Metadata
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Last sync from Moodle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (connection_id) REFERENCES moodle_connections(id) ON DELETE CASCADE,
    INDEX idx_connection_question (connection_id, moodle_question_id),
    INDEX idx_question_type (question_type),
    INDEX idx_complexity_level (complexity_level),
    INDEX idx_last_synced (last_synced_at),
    UNIQUE KEY unique_connection_question (connection_id, moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Moodle questions with complexity analysis';


-- ============================================================================
-- Table: reconstructed_problems
-- Stores reverse-reconstructed problems
-- ============================================================================
CREATE TABLE IF NOT EXISTS reconstructed_problems (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_question_id BIGINT NOT NULL COMMENT 'Reference to moodle_questions',

    -- Reconstruction details
    strategy VARCHAR(50) NOT NULL COMMENT 'reverse_solution, decompose_recompose, complexity_variation, pattern_extraction',
    language VARCHAR(10) DEFAULT 'ko' COMMENT 'Language: ko or en',

    -- Content
    original_text TEXT NOT NULL COMMENT 'Original problem text',
    reconstructed_text TEXT NOT NULL COMMENT 'Reconstructed problem text',

    -- Problem structure (JSON)
    structure JSON NOT NULL COMMENT 'Decomposed problem structure',

    -- Complexity assessment
    complexity_metrics JSON NOT NULL COMMENT 'Complexity metrics',
    complexity_assessment JSON NOT NULL COMMENT 'Full complexity assessment',

    -- Variations
    variations JSON DEFAULT NULL COMMENT 'Generated problem variations',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (original_question_id) REFERENCES moodle_questions(id) ON DELETE CASCADE,
    INDEX idx_original_question (original_question_id),
    INDEX idx_strategy (strategy),
    INDEX idx_language (language),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Reverse-reconstructed problems from Moodle questions';


-- ============================================================================
-- Table: moodle_quizzes
-- Stores Moodle quiz metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS moodle_quizzes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    connection_id INT NOT NULL COMMENT 'Reference to moodle_connections',
    moodle_quiz_id INT NOT NULL COMMENT 'Original quiz ID in Moodle',
    course_id INT NOT NULL COMMENT 'Moodle course ID',

    -- Quiz details
    name VARCHAR(512) NOT NULL COMMENT 'Quiz name',
    intro TEXT DEFAULT NULL COMMENT 'Quiz introduction',
    time_limit INT DEFAULT NULL COMMENT 'Time limit in seconds',

    -- Statistics
    total_questions INT DEFAULT 0 COMMENT 'Total number of questions',
    average_complexity_score DECIMAL(5,2) DEFAULT NULL COMMENT 'Average complexity',

    -- Metadata
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Last sync from Moodle',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (connection_id) REFERENCES moodle_connections(id) ON DELETE CASCADE,
    INDEX idx_connection_quiz (connection_id, moodle_quiz_id),
    INDEX idx_course (course_id),
    INDEX idx_last_synced (last_synced_at),
    UNIQUE KEY unique_connection_quiz (connection_id, moodle_quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Moodle quiz metadata';


-- ============================================================================
-- Table: quiz_questions
-- Junction table: many-to-many relationship between quizzes and questions
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_questions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    quiz_id BIGINT NOT NULL COMMENT 'Reference to moodle_quizzes',
    question_id BIGINT NOT NULL COMMENT 'Reference to moodle_questions',

    -- Question position in quiz
    slot_number INT NOT NULL COMMENT 'Order in quiz',
    page_number INT DEFAULT 1 COMMENT 'Page number in quiz',
    max_mark DECIMAL(10,5) DEFAULT 1.00000 COMMENT 'Maximum mark for this question',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (quiz_id) REFERENCES moodle_quizzes(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES moodle_questions(id) ON DELETE CASCADE,
    INDEX idx_quiz (quiz_id),
    INDEX idx_question (question_id),
    INDEX idx_slot (quiz_id, slot_number),
    UNIQUE KEY unique_quiz_question (quiz_id, question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Junction table for quizzes and questions';


-- ============================================================================
-- Table: complexity_assessments
-- Stores historical complexity assessments
-- ============================================================================
CREATE TABLE IF NOT EXISTS complexity_assessments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    question_id BIGINT NOT NULL COMMENT 'Reference to moodle_questions',

    -- Assessment details
    assessment_type VARCHAR(50) DEFAULT 'automatic' COMMENT 'automatic, manual, hybrid',
    assessed_by VARCHAR(255) DEFAULT NULL COMMENT 'User who performed assessment',

    -- Metrics
    condition_count INT NOT NULL,
    nesting_depth INT NOT NULL,
    entity_count INT NOT NULL,
    has_cyclical_dependencies TINYINT(1) NOT NULL,

    -- Results
    complexity_level VARCHAR(20) NOT NULL COMMENT 'simple, moderate, complex, very_complex',
    complexity_score DECIMAL(5,2) NOT NULL COMMENT 'Calculated complexity score',
    requires_focus_card TINYINT(1) DEFAULT 0 COMMENT 'Whether focus card is needed',

    -- Recommendations (JSON)
    recommendations JSON DEFAULT NULL COMMENT 'List of recommendations',
    focus_message TEXT DEFAULT NULL COMMENT 'Focus card message',

    -- Metadata
    language VARCHAR(10) DEFAULT 'ko' COMMENT 'Language for messages',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (question_id) REFERENCES moodle_questions(id) ON DELETE CASCADE,
    INDEX idx_question (question_id),
    INDEX idx_complexity_level (complexity_level),
    INDEX idx_assessment_type (assessment_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historical complexity assessments';


-- ============================================================================
-- Table: sync_logs
-- Logs synchronization activities with Moodle
-- ============================================================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    connection_id INT NOT NULL COMMENT 'Reference to moodle_connections',

    -- Sync details
    sync_type VARCHAR(50) NOT NULL COMMENT 'quiz, question, category, full',
    entity_type VARCHAR(50) NOT NULL COMMENT 'quiz, question, etc.',
    entity_id INT DEFAULT NULL COMMENT 'Moodle entity ID',

    -- Status
    status VARCHAR(20) NOT NULL COMMENT 'success, failure, partial',
    records_synced INT DEFAULT 0 COMMENT 'Number of records synced',
    records_failed INT DEFAULT 0 COMMENT 'Number of failures',

    -- Error tracking
    error_message TEXT DEFAULT NULL COMMENT 'Error message if failed',
    error_details JSON DEFAULT NULL COMMENT 'Detailed error information',

    -- Performance
    duration_ms INT DEFAULT NULL COMMENT 'Sync duration in milliseconds',

    -- Metadata
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP DEFAULT NULL,

    FOREIGN KEY (connection_id) REFERENCES moodle_connections(id) ON DELETE CASCADE,
    INDEX idx_connection (connection_id),
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Synchronization activity logs';


-- ============================================================================
-- Table: api_usage_stats
-- Track API usage for Moodle integration endpoints
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_usage_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    -- Request details
    endpoint VARCHAR(255) NOT NULL COMMENT 'API endpoint called',
    method VARCHAR(10) NOT NULL COMMENT 'HTTP method',
    connection_id INT DEFAULT NULL COMMENT 'Reference to moodle_connections',

    -- Response details
    status_code INT NOT NULL COMMENT 'HTTP status code',
    response_time_ms INT NOT NULL COMMENT 'Response time in milliseconds',

    -- User/source
    user_agent TEXT DEFAULT NULL COMMENT 'User agent string',
    ip_address VARCHAR(45) DEFAULT NULL COMMENT 'Client IP address',

    -- Metadata
    request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_endpoint (endpoint),
    INDEX idx_connection (connection_id),
    INDEX idx_status_code (status_code),
    INDEX idx_request_timestamp (request_timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='API usage statistics';


-- ============================================================================
-- Views for common queries
-- ============================================================================

-- View: questions with latest complexity assessment
CREATE OR REPLACE VIEW v_questions_with_complexity AS
SELECT
    q.id AS question_id,
    q.moodle_question_id,
    q.name AS question_name,
    q.question_type,
    q.complexity_level,
    ca.complexity_score,
    ca.requires_focus_card,
    ca.recommendations,
    ca.created_at AS last_assessed_at
FROM moodle_questions q
LEFT JOIN (
    SELECT
        question_id,
        complexity_score,
        requires_focus_card,
        recommendations,
        created_at,
        ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at DESC) as rn
    FROM complexity_assessments
) ca ON q.id = ca.question_id AND ca.rn = 1;


-- View: quiz statistics
CREATE OR REPLACE VIEW v_quiz_statistics AS
SELECT
    qz.id AS quiz_id,
    qz.moodle_quiz_id,
    qz.name AS quiz_name,
    qz.total_questions,
    COUNT(DISTINCT qq.question_id) AS actual_question_count,
    AVG(q.condition_count) AS avg_condition_count,
    AVG(q.nesting_depth) AS avg_nesting_depth,
    AVG(q.entity_count) AS avg_entity_count,
    SUM(CASE WHEN q.complexity_level = 'simple' THEN 1 ELSE 0 END) AS simple_count,
    SUM(CASE WHEN q.complexity_level = 'moderate' THEN 1 ELSE 0 END) AS moderate_count,
    SUM(CASE WHEN q.complexity_level = 'complex' THEN 1 ELSE 0 END) AS complex_count,
    SUM(CASE WHEN q.complexity_level = 'very_complex' THEN 1 ELSE 0 END) AS very_complex_count
FROM moodle_quizzes qz
LEFT JOIN quiz_questions qq ON qz.id = qq.quiz_id
LEFT JOIN moodle_questions q ON qq.question_id = q.id
GROUP BY qz.id, qz.moodle_quiz_id, qz.name, qz.total_questions;


-- ============================================================================
-- Initial data / Sample data (optional)
-- ============================================================================

-- Insert sample connection (replace with actual values)
-- INSERT INTO moodle_connections (name, base_url, ws_token_encrypted, is_active)
-- VALUES ('KAIST Moodle', 'https://moodle.kaist.ac.kr', 'ENCRYPTED_TOKEN_HERE', 1);


-- ============================================================================
-- Indexes for performance optimization (MySQL 5.7 specific)
-- ============================================================================

-- Composite indexes for common query patterns
CREATE INDEX idx_question_complexity_type
ON moodle_questions(question_type, complexity_level);

CREATE INDEX idx_reconstructed_strategy_lang
ON reconstructed_problems(strategy, language);

CREATE INDEX idx_sync_log_status_time
ON sync_logs(status, started_at);


-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER $$

-- Procedure: Update quiz statistics
CREATE PROCEDURE update_quiz_statistics(IN p_quiz_id BIGINT)
BEGIN
    UPDATE moodle_quizzes
    SET
        total_questions = (
            SELECT COUNT(*)
            FROM quiz_questions
            WHERE quiz_id = p_quiz_id
        ),
        average_complexity_score = (
            SELECT AVG(ca.complexity_score)
            FROM quiz_questions qq
            JOIN moodle_questions q ON qq.question_id = q.id
            LEFT JOIN (
                SELECT question_id, complexity_score,
                       ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at DESC) as rn
                FROM complexity_assessments
            ) ca ON q.id = ca.question_id AND ca.rn = 1
            WHERE qq.quiz_id = p_quiz_id
        )
    WHERE id = p_quiz_id;
END$$


-- Procedure: Clean old sync logs (keep last 30 days)
CREATE PROCEDURE clean_old_sync_logs()
BEGIN
    DELETE FROM sync_logs
    WHERE started_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$


-- Procedure: Get question complexity trend
CREATE PROCEDURE get_question_complexity_trend(
    IN p_question_id BIGINT,
    IN p_days INT
)
BEGIN
    SELECT
        DATE(created_at) AS assessment_date,
        complexity_level,
        complexity_score,
        COUNT(*) AS assessment_count
    FROM complexity_assessments
    WHERE question_id = p_question_id
        AND created_at >= DATE_SUB(NOW(), INTERVAL p_days DAY)
    GROUP BY DATE(created_at), complexity_level, complexity_score
    ORDER BY assessment_date DESC;
END$$

DELIMITER ;


-- ============================================================================
-- Events for automated maintenance (MySQL 5.7)
-- ============================================================================

-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Event: Clean old sync logs daily
CREATE EVENT IF NOT EXISTS evt_clean_sync_logs
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
    CALL clean_old_sync_logs();


-- ============================================================================
-- Grants (example - adjust as needed)
-- ============================================================================

-- Example: Create application user with appropriate permissions
-- CREATE USER 'alt42_app'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alt42_moodle_integration.* TO 'alt42_app'@'localhost';
-- FLUSH PRIVILEGES;


-- ============================================================================
-- End of schema
-- ============================================================================
