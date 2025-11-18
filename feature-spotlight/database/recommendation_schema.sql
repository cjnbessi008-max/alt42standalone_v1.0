-- AI Function Recommendation System - Database Schema
-- Extension to Feature Spotlight system

USE feature_spotlight;

-- Table: Student Learning Profiles
-- Stores student skill levels and learning preferences
CREATE TABLE IF NOT EXISTS fs_student_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Moodle user ID',
    skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',

    -- Skill scores (0-100)
    polynomial_mastery DECIMAL(5,2) DEFAULT 0.00,
    trigonometry_mastery DECIMAL(5,2) DEFAULT 0.00,
    exponential_mastery DECIMAL(5,2) DEFAULT 0.00,
    rational_mastery DECIMAL(5,2) DEFAULT 0.00,
    calculus_mastery DECIMAL(5,2) DEFAULT 0.00,

    -- Learning preferences
    preferred_difficulty ENUM('easy', 'medium', 'hard', 'mixed') DEFAULT 'medium',
    learning_pace ENUM('slow', 'normal', 'fast') DEFAULT 'normal',
    visual_learner BOOLEAN DEFAULT TRUE,

    -- Statistics
    total_problems_attempted INT DEFAULT 0,
    total_problems_correct INT DEFAULT 0,
    average_time_per_problem INT DEFAULT 0 COMMENT 'in seconds',
    last_active_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user (user_id),
    INDEX idx_skill_level (skill_level),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student learning profiles for personalized recommendations';

-- Table: Function Library
-- Pre-defined functions with metadata for recommendations
CREATE TABLE IF NOT EXISTS fs_function_library (
    id INT AUTO_INCREMENT PRIMARY KEY,
    function_expression TEXT NOT NULL,
    function_type VARCHAR(50) NOT NULL COMMENT 'polynomial, trigonometric, exponential, etc.',
    difficulty_level ENUM('easy', 'medium', 'hard', 'expert') DEFAULT 'medium',

    -- Complexity metrics
    complexity_score DECIMAL(5,2) NOT NULL COMMENT '0-100 scale',
    has_maxima BOOLEAN DEFAULT FALSE,
    has_minima BOOLEAN DEFAULT FALSE,
    has_inflection BOOLEAN DEFAULT FALSE,
    number_of_features INT DEFAULT 0,

    -- Educational metadata
    concept_tags JSON COMMENT 'Array of concept tags',
    prerequisites JSON COMMENT 'Required prerequisite concepts',
    learning_objectives TEXT,

    -- Usage statistics
    times_recommended INT DEFAULT 0,
    times_attempted INT DEFAULT 0,
    average_success_rate DECIMAL(5,2) DEFAULT 0.00,
    average_completion_time INT DEFAULT 0,

    -- Display info
    display_name VARCHAR(200),
    description TEXT,
    hint TEXT,

    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_function_type (function_type),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_complexity (complexity_score),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Library of functions for recommendation system';

-- Table: Student Attempts History
-- Detailed tracking of student problem-solving attempts
CREATE TABLE IF NOT EXISTS fs_attempt_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    function_id INT NOT NULL,
    question_id INT NULL COMMENT 'Moodle question ID if applicable',

    -- Attempt details
    is_correct BOOLEAN DEFAULT FALSE,
    time_spent INT NOT NULL COMMENT 'in seconds',
    hints_used INT DEFAULT 0,
    attempts_count INT DEFAULT 1,

    -- Feature interaction tracking
    features_clicked JSON COMMENT 'Which features the student clicked',
    features_identified JSON COMMENT 'Features the student correctly identified',

    -- Performance metrics
    accuracy_score DECIMAL(5,2) COMMENT '0-100',
    confidence_score DECIMAL(5,2) COMMENT 'Self-reported or calculated',

    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_user_id (user_id),
    INDEX idx_function_id (function_id),
    INDEX idx_attempted_at (attempted_at),
    FOREIGN KEY (function_id) REFERENCES fs_function_library(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student attempt history for learning analytics';

-- Table: Recommendations Log
-- Track what was recommended and why
CREATE TABLE IF NOT EXISTS fs_recommendations_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    function_id INT NOT NULL,

    -- Recommendation metadata
    recommendation_type ENUM('skill_based', 'collaborative', 'content_based', 'ai_generated', 'sequential') NOT NULL,
    confidence_score DECIMAL(5,2) NOT NULL COMMENT 'How confident the system is in this recommendation',
    reasoning TEXT COMMENT 'Why this was recommended',

    -- Outcome tracking
    was_attempted BOOLEAN DEFAULT FALSE,
    was_successful BOOLEAN NULL,
    user_rating INT NULL COMMENT '1-5 stars',

    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempted_at TIMESTAMP NULL,

    INDEX idx_user_id (user_id),
    INDEX idx_function_id (function_id),
    INDEX idx_recommendation_type (recommendation_type),
    FOREIGN KEY (function_id) REFERENCES fs_function_library(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Log of all recommendations made by the system';

-- Table: Learning Paths
-- Predefined learning sequences
CREATE TABLE IF NOT EXISTS fs_learning_paths (
    id INT AUTO_INCREMENT PRIMARY KEY,
    path_name VARCHAR(200) NOT NULL,
    description TEXT,
    target_skill_level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL,

    -- Path configuration
    function_sequence JSON NOT NULL COMMENT 'Ordered array of function IDs',
    estimated_duration INT COMMENT 'in minutes',

    -- Metadata
    created_by INT COMMENT 'Teacher user ID',
    is_published BOOLEAN DEFAULT FALSE,
    difficulty_progression ENUM('gradual', 'steep', 'mixed') DEFAULT 'gradual',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_target_skill (target_skill_level),
    INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Curated learning paths for students';

-- Table: AI Recommendation Cache
-- Cache AI-generated recommendations to reduce API calls
CREATE TABLE IF NOT EXISTS fs_ai_recommendation_cache (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cache_key VARCHAR(255) NOT NULL UNIQUE,

    -- Input parameters
    user_profile JSON NOT NULL,
    context JSON COMMENT 'Additional context used for recommendation',

    -- AI response
    recommended_functions JSON NOT NULL,
    reasoning TEXT,
    confidence_score DECIMAL(5,2),

    -- Cache metadata
    ai_model VARCHAR(100) COMMENT 'Which AI model was used',
    tokens_used INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    hit_count INT DEFAULT 0,

    INDEX idx_cache_key (cache_key),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Cache for AI-generated recommendations';

-- Insert sample function library data
INSERT INTO fs_function_library (
    function_expression, function_type, difficulty_level, complexity_score,
    has_maxima, has_minima, has_inflection, number_of_features,
    concept_tags, prerequisites, display_name, description
) VALUES
-- Beginner Level
('x^2', 'polynomial', 'easy', 15.00, FALSE, TRUE, FALSE, 1,
 JSON_ARRAY('quadratic', 'parabola', 'vertex'), JSON_ARRAY('basic_algebra'),
 '기본 이차함수', 'Simple quadratic function with one minimum'),

('x^2 - 4', 'polynomial', 'easy', 18.00, FALSE, TRUE, FALSE, 1,
 JSON_ARRAY('quadratic', 'vertical_shift'), JSON_ARRAY('basic_algebra'),
 '수직 이동 이차함수', 'Quadratic with vertical shift'),

('2*x^2 + 3', 'polynomial', 'easy', 20.00, FALSE, TRUE, FALSE, 1,
 JSON_ARRAY('quadratic', 'scaling'), JSON_ARRAY('basic_algebra'),
 '확대된 이차함수', 'Scaled quadratic function'),

-- Intermediate Level
('x^3 - 3*x', 'polynomial', 'medium', 45.00, TRUE, TRUE, TRUE, 3,
 JSON_ARRAY('cubic', 'critical_points', 'inflection'), JSON_ARRAY('derivatives', 'quadratic'),
 '삼차함수 (표준)', 'Standard cubic with max, min, and inflection'),

('x^3 - 6*x^2 + 9*x + 1', 'polynomial', 'medium', 50.00, TRUE, TRUE, TRUE, 3,
 JSON_ARRAY('cubic', 'multiple_features'), JSON_ARRAY('derivatives', 'quadratic'),
 '복잡한 삼차함수', 'Complex cubic function'),

('sin(x)', 'trigonometric', 'medium', 40.00, TRUE, TRUE, TRUE, 5,
 JSON_ARRAY('trigonometry', 'periodic', 'wave'), JSON_ARRAY('trig_basics'),
 '사인 함수', 'Basic sine wave with periodic features'),

('cos(x)', 'trigonometric', 'medium', 40.00, TRUE, TRUE, TRUE, 5,
 JSON_ARRAY('trigonometry', 'periodic', 'wave'), JSON_ARRAY('trig_basics'),
 '코사인 함수', 'Basic cosine wave'),

-- Advanced Level
('x^4 - 4*x^3 + 4*x^2', 'polynomial', 'hard', 65.00, TRUE, TRUE, TRUE, 4,
 JSON_ARRAY('quartic', 'multiple_extrema'), JSON_ARRAY('higher_derivatives', 'cubic'),
 '사차함수', 'Quartic function with multiple features'),

('x*sin(x)', 'mixed', 'hard', 70.00, TRUE, TRUE, TRUE, 6,
 JSON_ARRAY('product', 'trigonometry', 'amplitude_modulation'), JSON_ARRAY('trig_basics', 'product_rule'),
 '곱함수 (삼각)', 'Product of polynomial and trigonometric'),

('exp(-x^2)', 'exponential', 'hard', 60.00, TRUE, FALSE, TRUE, 2,
 JSON_ARRAY('gaussian', 'exponential', 'bell_curve'), JSON_ARRAY('exponentials'),
 '가우시안 함수', 'Gaussian/bell curve function'),

-- Expert Level
('x/(1 + x^2)', 'rational', 'expert', 75.00, TRUE, TRUE, TRUE, 5,
 JSON_ARRAY('rational', 'asymptotic', 'limits'), JSON_ARRAY('rational_functions', 'limits'),
 '유리함수 (복잡)', 'Complex rational function'),

('x^2*exp(-x)', 'mixed', 'expert', 80.00, TRUE, TRUE, TRUE, 4,
 JSON_ARRAY('product', 'exponential', 'decay'), JSON_ARRAY('exponentials', 'product_rule'),
 '지수 감쇠 함수', 'Exponential decay with polynomial'),

('sin(x)/x', 'mixed', 'expert', 85.00, TRUE, TRUE, TRUE, 6,
 JSON_ARRAY('sinc', 'limits', 'oscillation'), JSON_ARRAY('trig_basics', 'limits'),
 'Sinc 함수', 'Sinc function with limit at zero')

ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Insert sample learning paths
INSERT INTO fs_learning_paths (
    path_name, description, target_skill_level, function_sequence,
    estimated_duration, difficulty_progression
) VALUES
('초급 과정: 이차함수 마스터',
 '기본적인 이차함수부터 시작하여 점진적으로 난이도를 높입니다.',
 'beginner',
 JSON_ARRAY(1, 2, 3),
 30,
 'gradual'),

('중급 과정: 미적분 기초',
 '극값과 변곡점을 포함한 다양한 함수를 학습합니다.',
 'intermediate',
 JSON_ARRAY(4, 5, 6, 7),
 60,
 'gradual'),

('고급 과정: 복잡한 함수 분석',
 '사차함수, 곱함수, 지수함수 등 복잡한 함수를 다룹니다.',
 'advanced',
 JSON_ARRAY(8, 9, 10),
 90,
 'steep'),

('전문가 과정: 특수 함수',
 '유리함수, 특수함수 등 고급 수학 개념을 학습합니다.',
 'expert',
 JSON_ARRAY(11, 12, 13),
 120,
 'steep')

ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Create indexes for performance
CREATE INDEX idx_complexity_difficulty ON fs_function_library(complexity_score, difficulty_level);
CREATE INDEX idx_user_success ON fs_attempt_history(user_id, is_correct);

-- Create view for student statistics
CREATE OR REPLACE VIEW v_student_statistics AS
SELECT
    sp.user_id,
    sp.skill_level,
    sp.total_problems_attempted,
    sp.total_problems_correct,
    CASE
        WHEN sp.total_problems_attempted > 0
        THEN (sp.total_problems_correct / sp.total_problems_attempted) * 100
        ELSE 0
    END as success_rate,
    sp.average_time_per_problem,
    AVG(ah.accuracy_score) as avg_accuracy,
    COUNT(DISTINCT ah.function_id) as unique_functions_attempted,
    MAX(ah.attempted_at) as last_attempt_date
FROM fs_student_profiles sp
LEFT JOIN fs_attempt_history ah ON sp.user_id = ah.user_id
GROUP BY sp.user_id, sp.skill_level, sp.total_problems_attempted,
         sp.total_problems_correct, sp.average_time_per_problem;

-- Create view for function popularity
CREATE OR REPLACE VIEW v_function_popularity AS
SELECT
    fl.id,
    fl.function_expression,
    fl.difficulty_level,
    fl.complexity_score,
    COUNT(DISTINCT ah.user_id) as unique_users,
    COUNT(ah.id) as total_attempts,
    AVG(CASE WHEN ah.is_correct THEN 1 ELSE 0 END) * 100 as success_rate,
    AVG(ah.time_spent) as avg_time_spent,
    fl.times_recommended,
    CASE
        WHEN COUNT(ah.id) > 0
        THEN (COUNT(DISTINCT ah.user_id) / COUNT(ah.id)) * 100
        ELSE 0
    END as engagement_score
FROM fs_function_library fl
LEFT JOIN fs_attempt_history ah ON fl.id = ah.function_id
WHERE fl.is_active = TRUE
GROUP BY fl.id, fl.function_expression, fl.difficulty_level,
         fl.complexity_score, fl.times_recommended;
