-- ALT42 Filter Shrink LMS Database Schema
-- MySQL 5.7

-- 1. 학생 테이블
CREATE TABLE IF NOT EXISTS students (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_moodle_user_id (moodle_user_id),
    INDEX idx_grade_level (grade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 필터 정의 테이블
CREATE TABLE IF NOT EXISTS filter_definitions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filter_name VARCHAR(100) NOT NULL,
    filter_key VARCHAR(50) NOT NULL,
    filter_order INT NOT NULL DEFAULT 0,
    filter_type ENUM('select', 'range', 'multi_select', 'boolean') DEFAULT 'select',
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_filter_key (filter_key),
    INDEX idx_filter_order (filter_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. 필터 옵션 테이블
CREATE TABLE IF NOT EXISTS filter_options (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    filter_id INT UNSIGNED NOT NULL,
    option_value VARCHAR(100) NOT NULL,
    option_label VARCHAR(200) NOT NULL,
    option_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (filter_id) REFERENCES filter_definitions(id) ON DELETE CASCADE,
    INDEX idx_filter_id (filter_id),
    INDEX idx_option_order (option_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. 문제 테이블 (Moodle 연동)
CREATE TABLE IF NOT EXISTS problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT UNSIGNED NOT NULL,
    title VARCHAR(500) NOT NULL,
    question_text TEXT,
    question_type VARCHAR(50),
    difficulty_level ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',
    grade_level VARCHAR(20),
    subject VARCHAR(100),
    topic VARCHAR(200),
    subtopic VARCHAR(200),
    points INT DEFAULT 1,
    time_limit INT COMMENT 'seconds',
    metadata JSON COMMENT 'Additional metadata from Moodle',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_moodle_question_id (moodle_question_id),
    INDEX idx_grade_level (grade_level),
    INDEX idx_subject (subject),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_topic (topic),
    FULLTEXT INDEX ft_title (title)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. 문제-필터 매핑 테이블
CREATE TABLE IF NOT EXISTS problem_filters (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    problem_id INT UNSIGNED NOT NULL,
    filter_key VARCHAR(50) NOT NULL,
    filter_value VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem_id (problem_id),
    INDEX idx_filter_key (filter_key),
    INDEX idx_filter_value (filter_value),
    INDEX idx_composite (filter_key, filter_value, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Filter Shrink 세션 테이블
CREATE TABLE IF NOT EXISTS filter_sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    session_token VARCHAR(64) NOT NULL,
    applied_filters JSON COMMENT 'Array of applied filters',
    remaining_count INT UNSIGNED DEFAULT 0,
    current_step INT UNSIGNED DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uk_session_token (session_token),
    INDEX idx_student_id (student_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. 학생 문제 시도 테이블
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    problem_id INT UNSIGNED NOT NULL,
    session_id INT UNSIGNED,
    answer_text TEXT,
    is_correct BOOLEAN,
    points_earned DECIMAL(5,2) DEFAULT 0,
    time_spent INT COMMENT 'seconds',
    attempt_number INT DEFAULT 1,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES filter_sessions(id) ON DELETE SET NULL,
    INDEX idx_student_id (student_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_session_id (session_id),
    INDEX idx_submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. 학생 진도 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    student_id INT UNSIGNED NOT NULL,
    grade_level VARCHAR(20),
    subject VARCHAR(100),
    topic VARCHAR(200),
    total_problems_attempted INT DEFAULT 0,
    total_problems_correct INT DEFAULT 0,
    total_points_earned DECIMAL(10,2) DEFAULT 0,
    mastery_level DECIMAL(5,2) DEFAULT 0 COMMENT 'Percentage 0-100',
    last_activity_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY uk_student_subject_topic (student_id, subject, topic),
    INDEX idx_mastery_level (mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Moodle 동기화 로그
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('questions', 'users', 'courses', 'full') NOT NULL,
    sync_status ENUM('started', 'in_progress', 'completed', 'failed') DEFAULT 'started',
    items_processed INT DEFAULT 0,
    items_total INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_sync_type (sync_type),
    INDEX idx_sync_status (sync_status),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS system_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
