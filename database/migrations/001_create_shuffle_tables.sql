-- Data Shuffle Feature Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- ============================================
-- Table: shuffle_seeds
-- Purpose: Store shuffle seeds for consistent randomization per student/quiz
-- ============================================
CREATE TABLE IF NOT EXISTS shuffle_seeds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Student ID from Moodle user table',
    quiz_id INT NOT NULL COMMENT 'Quiz ID from Moodle quiz table',
    question_seed VARCHAR(64) NOT NULL COMMENT 'Seed for question order shuffle',
    answer_seed VARCHAR(64) NOT NULL COMMENT 'Seed for answer choices shuffle',
    session_id VARCHAR(128) DEFAULT NULL COMMENT 'Session identifier for tracking',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL COMMENT 'Expiration time for cache invalidation',
    UNIQUE KEY unique_student_quiz (student_id, quiz_id),
    INDEX idx_session (session_id),
    INDEX idx_expires (expires_at),
    INDEX idx_student (student_id),
    INDEX idx_quiz (quiz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores shuffle seeds for consistent randomization';

-- ============================================
-- Table: shuffle_history
-- Purpose: Audit trail for shuffle operations
-- ============================================
CREATE TABLE IF NOT EXISTS shuffle_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    quiz_id INT NOT NULL,
    question_id INT NOT NULL COMMENT 'Question ID from Moodle question table',
    original_position INT NOT NULL COMMENT 'Original question position (1-based)',
    shuffled_position INT NOT NULL COMMENT 'Shuffled position for this student (1-based)',
    answer_mapping JSON COMMENT 'Original to shuffled answer mapping: {"A":2, "B":1, "C":3, "D":0}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student_quiz (student_id, quiz_id),
    INDEX idx_question (question_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Audit trail for shuffle operations';

-- ============================================
-- Table: shuffle_config
-- Purpose: Quiz-specific shuffle configuration
-- ============================================
CREATE TABLE IF NOT EXISTS shuffle_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL UNIQUE COMMENT 'Quiz ID from Moodle',
    shuffle_questions BOOLEAN DEFAULT TRUE COMMENT 'Enable question order shuffling',
    shuffle_answers BOOLEAN DEFAULT TRUE COMMENT 'Enable answer choice shuffling',
    seed_strategy ENUM('student_id', 'session', 'timestamp', 'combined') DEFAULT 'combined'
        COMMENT 'Strategy for generating shuffle seeds',
    cache_duration INT DEFAULT 3600 COMMENT 'Cache duration in seconds',
    salt VARCHAR(128) DEFAULT NULL COMMENT 'Additional salt for seed generation',
    enabled BOOLEAN DEFAULT TRUE COMMENT 'Master switch for shuffle feature',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT DEFAULT NULL COMMENT 'Teacher/admin user ID who last updated',
    INDEX idx_quiz (quiz_id),
    INDEX idx_enabled (enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Shuffle configuration per quiz';

-- ============================================
-- Table: shuffle_cache
-- Purpose: Cache shuffled quiz data for performance
-- ============================================
CREATE TABLE IF NOT EXISTS shuffle_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE COMMENT 'Format: quiz:{quiz_id}:student:{student_id}',
    quiz_id INT NOT NULL,
    student_id INT NOT NULL,
    shuffled_data LONGTEXT NOT NULL COMMENT 'JSON data of shuffled questions and answers',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    hit_count INT DEFAULT 0 COMMENT 'Number of cache hits for analytics',
    last_accessed TIMESTAMP NULL,
    INDEX idx_cache_key (cache_key),
    INDEX idx_expires (expires_at),
    INDEX idx_quiz_student (quiz_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cache for shuffled quiz data';

-- ============================================
-- Table: shuffle_analytics
-- Purpose: Track shuffle performance metrics
-- ============================================
CREATE TABLE IF NOT EXISTS shuffle_analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_type ENUM('shuffle_generated', 'cache_hit', 'cache_miss', 'api_call', 'error') NOT NULL,
    quiz_id INT DEFAULT NULL,
    student_id INT DEFAULT NULL,
    execution_time_ms INT DEFAULT NULL COMMENT 'Execution time in milliseconds',
    memory_usage_mb DECIMAL(10,2) DEFAULT NULL COMMENT 'Memory usage in megabytes',
    error_message TEXT DEFAULT NULL,
    metadata JSON DEFAULT NULL COMMENT 'Additional event-specific data',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_event_type (event_type),
    INDEX idx_quiz (quiz_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Analytics for shuffle performance monitoring';

-- ============================================
-- Insert default configuration for testing
-- ============================================
INSERT INTO shuffle_config (quiz_id, shuffle_questions, shuffle_answers, seed_strategy, salt)
VALUES (1, TRUE, TRUE, 'combined', 'default_salt_2025')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- Create cleanup procedure for expired cache
-- ============================================
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS cleanup_expired_cache()
BEGIN
    DELETE FROM shuffle_cache
    WHERE expires_at < NOW();

    DELETE FROM shuffle_seeds
    WHERE expires_at IS NOT NULL AND expires_at < NOW();

    -- Log cleanup
    INSERT INTO shuffle_analytics (event_type, metadata)
    VALUES ('cache_cleanup', JSON_OBJECT('deleted_rows', ROW_COUNT(), 'timestamp', NOW()));
END$$

DELIMITER ;

-- ============================================
-- Create event scheduler for automatic cleanup
-- (Runs daily at 2 AM)
-- ============================================
SET GLOBAL event_scheduler = ON;

CREATE EVENT IF NOT EXISTS daily_cache_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS TIMESTAMP(CURRENT_DATE + INTERVAL 1 DAY, '02:00:00')
DO CALL cleanup_expired_cache();

-- ============================================
-- Verification queries
-- ============================================

-- Show all tables
SELECT
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME LIKE 'shuffle_%'
ORDER BY TABLE_NAME;

-- Show indexes
SELECT
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS,
    INDEX_TYPE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME LIKE 'shuffle_%'
GROUP BY TABLE_NAME, INDEX_NAME, INDEX_TYPE
ORDER BY TABLE_NAME, INDEX_NAME;
