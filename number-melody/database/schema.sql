-- Number Melody Database Schema
-- Compatible with MySQL 5.7

CREATE DATABASE IF NOT EXISTS number_melody
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE number_melody;

-- Problems/Questions table
CREATE TABLE IF NOT EXISTS problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    number_sequence JSON NOT NULL COMMENT 'Array of numbers to display',
    correct_answer VARCHAR(100) NOT NULL,
    difficulty TINYINT UNSIGNED DEFAULT 1 COMMENT '1=Easy, 2=Medium, 3=Hard',
    sound_pattern VARCHAR(50) DEFAULT 'melody' COMMENT 'melody, rhythm, harmony',
    time_limit INT UNSIGNED DEFAULT 0 COMMENT 'Time limit in seconds, 0=no limit',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty),
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    problem_id INT UNSIGNED NOT NULL,
    user_id INT UNSIGNED NOT NULL,
    answer VARCHAR(100) NOT NULL,
    is_correct TINYINT(1) DEFAULT 0,
    time_spent INT UNSIGNED DEFAULT 0 COMMENT 'Time in seconds',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_problem (problem_id),
    INDEX idx_user (user_id),
    INDEX idx_attempted_at (attempted_at),
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User interactions table (for analytics)
CREATE TABLE IF NOT EXISTS interactions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    problem_id INT UNSIGNED NULL,
    interaction_type VARCHAR(50) NOT NULL COMMENT 'tap, sequence, complete, etc.',
    interaction_data JSON NULL COMMENT 'Additional data about the interaction',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_type (interaction_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress summary (for quick access)
CREATE TABLE IF NOT EXISTS student_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    total_problems_attempted INT UNSIGNED DEFAULT 0,
    total_correct INT UNSIGNED DEFAULT 0,
    current_level TINYINT UNSIGNED DEFAULT 1,
    total_time_spent INT UNSIGNED DEFAULT 0 COMMENT 'Total time in seconds',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_level (current_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO problems (title, description, number_sequence, correct_answer, difficulty, sound_pattern) VALUES
('Basic Sequence', 'Tap numbers 1 through 5 in order', JSON_ARRAY(1, 2, 3, 4, 5), '12345', 1, 'melody'),
('Skip Counting', 'Tap every other number: 2, 4, 6, 8', JSON_ARRAY(1, 2, 3, 4, 5, 6, 7, 8, 9), '2468', 2, 'melody'),
('Countdown', 'Tap numbers from 5 down to 1', JSON_ARRAY(5, 4, 3, 2, 1), '54321', 1, 'rhythm'),
('Odd Numbers', 'Tap only odd numbers from 1 to 9', JSON_ARRAY(1, 2, 3, 4, 5, 6, 7, 8, 9), '13579', 2, 'melody'),
('Number Pattern', 'Complete the pattern: 1, 4, 7', JSON_ARRAY(1, 2, 3, 4, 5, 6, 7, 8, 9), '147', 3, 'harmony');
