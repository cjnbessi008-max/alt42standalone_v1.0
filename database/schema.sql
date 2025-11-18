-- Learning Summary System Database Schema
-- Compatible with MySQL 5.7
-- Integrates with Moodle 3.7 LMS

-- Table: learning_sessions
-- Stores individual student quiz attempt sessions from Moodle
CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle user ID',
    moodle_quiz_id INT NOT NULL COMMENT 'Moodle quiz ID',
    moodle_attempt_id INT NOT NULL COMMENT 'Moodle quiz attempt ID',
    student_name VARCHAR(255) NOT NULL,
    quiz_name VARCHAR(255) NOT NULL,
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    total_questions INT NOT NULL DEFAULT 0,
    correct_answers INT NOT NULL DEFAULT 0,
    score DECIMAL(5,2) NULL COMMENT 'Quiz score percentage',
    status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_moodle_quiz (moodle_quiz_id),
    INDEX idx_moodle_attempt (moodle_attempt_id),
    UNIQUE KEY unique_attempt (moodle_attempt_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: question_responses
-- Stores individual question responses and analysis
CREATE TABLE IF NOT EXISTS question_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    moodle_question_id INT NOT NULL COMMENT 'Moodle question ID',
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) NOT NULL COMMENT 'multichoice, truefalse, shortanswer, etc.',
    student_answer TEXT NULL,
    correct_answer TEXT NULL,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    points_earned DECIMAL(10,2) DEFAULT 0,
    max_points DECIMAL(10,2) DEFAULT 0,
    time_spent_seconds INT NULL COMMENT 'Time spent on this question',
    attempt_count INT DEFAULT 1 COMMENT 'Number of attempts for this question',
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: learning_summaries
-- AI-generated learning summaries for each session
CREATE TABLE IF NOT EXISTS learning_summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    summary_type ENUM('ai_generated', 'teacher_provided', 'system_generated') DEFAULT 'ai_generated',

    -- Core learning insights
    concepts_learned TEXT NULL COMMENT 'Key concepts the student learned',
    strengths TEXT NULL COMMENT 'Student strengths identified',
    weaknesses TEXT NULL COMMENT 'Areas needing improvement',
    misconceptions TEXT NULL COMMENT 'Common misconceptions identified',
    recommendations TEXT NULL COMMENT 'Recommended next steps',

    -- Structured data (JSON format for flexibility)
    detailed_analysis JSON NULL COMMENT 'Detailed AI analysis in JSON format',

    -- Metadata
    ai_model VARCHAR(100) NULL COMMENT 'AI model used (e.g., claude-3-sonnet)',
    confidence_score DECIMAL(3,2) NULL COMMENT 'AI confidence score (0-1)',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id),
    INDEX idx_generated_at (generated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: student_reflections
-- Student's own reflection notes on what they learned
CREATE TABLE IF NOT EXISTS student_reflections (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,

    -- Student's reflection
    what_i_learned TEXT NULL COMMENT 'Student describes what they learned',
    what_was_difficult TEXT NULL COMMENT 'What the student found challenging',
    what_i_want_to_learn TEXT NULL COMMENT 'What the student wants to learn next',
    confidence_rating INT NULL COMMENT 'Self-assessed confidence (1-5)',

    -- Metadata
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: concept_tags
-- Tags for categorizing learned concepts
CREATE TABLE IF NOT EXISTS concept_tags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tag_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NULL COMMENT 'e.g., mathematics, algebra, geometry',
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_tag (tag_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: summary_concepts (Many-to-Many relationship)
-- Links summaries to concept tags
CREATE TABLE IF NOT EXISTS summary_concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    summary_id INT NOT NULL,
    concept_tag_id INT NOT NULL,
    proficiency_level ENUM('introduced', 'practicing', 'proficient', 'mastered') DEFAULT 'practicing',
    FOREIGN KEY (summary_id) REFERENCES learning_summaries(id) ON DELETE CASCADE,
    FOREIGN KEY (concept_tag_id) REFERENCES concept_tags(id) ON DELETE CASCADE,
    UNIQUE KEY unique_summary_concept (summary_id, concept_tag_id),
    INDEX idx_summary (summary_id),
    INDEX idx_concept (concept_tag_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: system_config
-- System configuration and API keys
CREATE TABLE IF NOT EXISTS system_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NULL,
    config_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    is_encrypted TINYINT(1) DEFAULT 0 COMMENT 'Whether the value is encrypted',
    description TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration
INSERT INTO system_config (config_key, config_value, config_type, description) VALUES
('moodle_url', 'http://localhost/moodle', 'string', 'Moodle base URL'),
('moodle_ws_token', '', 'string', 'Moodle web services token'),
('claude_api_key', '', 'string', 'Anthropic Claude API key'),
('claude_model', 'claude-3-sonnet-20240229', 'string', 'Claude model to use'),
('enable_ai_summaries', '1', 'boolean', 'Enable AI-generated summaries'),
('summary_language', 'ko', 'string', 'Language for summaries (ko/en)'),
('max_summary_length', '500', 'integer', 'Maximum summary length in words')
ON DUPLICATE KEY UPDATE config_value=VALUES(config_value);

-- Insert sample concept tags for mathematics
INSERT INTO concept_tags (tag_name, category, description) VALUES
('분수', 'mathematics', '분수의 개념과 연산'),
('소수', 'mathematics', '소수의 개념과 연산'),
('덧셈', 'mathematics', '덧셈 연산'),
('뺄셈', 'mathematics', '뺄셈 연산'),
('곱셈', 'mathematics', '곱셈 연산'),
('나눗셈', 'mathematics', '나눗셈 연산'),
('도형', 'mathematics', '기하학적 도형'),
('방정식', 'mathematics', '대수 방정식'),
('비율', 'mathematics', '비율과 비례'),
('측정', 'mathematics', '길이, 넓이, 부피 측정')
ON DUPLICATE KEY UPDATE category=VALUES(category);
