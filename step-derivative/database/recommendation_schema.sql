-- Recommendation System Database Schema Extension
-- For personalized learning and adaptive difficulty

USE step_derivative;

-- Student skill levels table: tracks mastery of each derivative rule
CREATE TABLE IF NOT EXISTS student_skill_levels (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL, -- e.g., 'power_rule', 'chain_rule', etc.
    skill_level DECIMAL(3,2) NOT NULL DEFAULT 0.50, -- 0.00 to 1.00 (mastery level)
    attempts_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    average_time_seconds INT DEFAULT 0, -- average time to complete problems using this skill
    last_practiced TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_skill (moodle_user_id, skill_name),
    INDEX idx_user (moodle_user_id),
    INDEX idx_skill (skill_name),
    INDEX idx_level (skill_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problem skills mapping: which skills each problem requires
CREATE TABLE IF NOT EXISTS problem_skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    skill_weight DECIMAL(3,2) DEFAULT 1.00, -- how heavily this skill is weighted (0.00 to 1.00)
    is_primary BOOLEAN DEFAULT FALSE, -- is this the main skill being tested?
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_skill (skill_name),
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendations history: track what was recommended and outcomes
CREATE TABLE IF NOT EXISTS recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    recommendation_type ENUM('next_problem', 'difficulty_adjustment', 'remedial_practice', 'skill_building') NOT NULL,
    problem_id INT NULL, -- recommended problem (if applicable)
    difficulty_level ENUM('basic', 'intermediate', 'advanced') NULL,
    skills_to_practice JSON NULL, -- array of skill names
    reasoning TEXT, -- why this was recommended
    was_accepted BOOLEAN DEFAULT FALSE,
    was_completed BOOLEAN DEFAULT FALSE,
    outcome_score DECIMAL(3,2) NULL, -- 0.00 to 1.00 - how well they did
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL,
    INDEX idx_user (moodle_user_id),
    INDEX idx_type (recommendation_type),
    INDEX idx_accepted (was_accepted),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning paths: personalized curriculum sequences
CREATE TABLE IF NOT EXISTS learning_paths (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    path_name VARCHAR(255) NOT NULL,
    target_skills JSON NOT NULL, -- array of skills to master
    current_position INT DEFAULT 0, -- which step they're on
    total_steps INT NOT NULL,
    estimated_duration_minutes INT, -- estimated time to complete
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (moodle_user_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning path steps: individual steps in a learning path
CREATE TABLE IF NOT EXISTS learning_path_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    path_id INT NOT NULL,
    step_number INT NOT NULL,
    problem_id INT NULL,
    skill_focus VARCHAR(100) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,
    performance_score DECIMAL(3,2) NULL, -- how well they did (0.00 to 1.00)
    FOREIGN KEY (path_id) REFERENCES learning_paths(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL,
    INDEX idx_path (path_id),
    INDEX idx_step (step_number),
    INDEX idx_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Skill prerequisites: which skills need to be learned before others
CREATE TABLE IF NOT EXISTS skill_prerequisites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    skill_name VARCHAR(100) NOT NULL,
    prerequisite_skill VARCHAR(100) NOT NULL,
    importance ENUM('required', 'recommended', 'optional') DEFAULT 'recommended',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_prerequisite (skill_name, prerequisite_skill),
    INDEX idx_skill (skill_name),
    INDEX idx_prerequisite (prerequisite_skill)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert skill prerequisites (derivative rules dependency graph)
INSERT INTO skill_prerequisites (skill_name, prerequisite_skill, importance) VALUES
-- Basic rules are prerequisites for advanced rules
('power_rule', 'constant_rule', 'recommended'),
('constant_multiple', 'constant_rule', 'required'),
('constant_multiple', 'power_rule', 'recommended'),
('sum_rule', 'constant_rule', 'required'),
('sum_rule', 'power_rule', 'recommended'),
('product_rule', 'power_rule', 'required'),
('product_rule', 'constant_multiple', 'recommended'),
('quotient_rule', 'power_rule', 'required'),
('quotient_rule', 'product_rule', 'recommended'),
('chain_rule', 'power_rule', 'required'),
('chain_rule', 'constant_multiple', 'recommended'),
('chain_rule', 'sum_rule', 'recommended'),
-- Trig derivatives need basic rules
('sin_rule', 'constant_multiple', 'recommended'),
('cos_rule', 'constant_multiple', 'recommended'),
('sin_rule', 'chain_rule', 'optional'),
('cos_rule', 'chain_rule', 'optional'),
-- Exponential and log need chain rule
('exponential_rule', 'chain_rule', 'recommended'),
('logarithm_rule', 'chain_rule', 'recommended');

-- Difficulty progression table: defines skill thresholds for difficulty levels
CREATE TABLE IF NOT EXISTS difficulty_thresholds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    difficulty_level ENUM('basic', 'intermediate', 'advanced') NOT NULL,
    min_skill_level DECIMAL(3,2) NOT NULL, -- minimum average skill level required
    max_skill_level DECIMAL(3,2) NOT NULL, -- maximum - when to move up
    min_attempts INT DEFAULT 0, -- minimum attempts before level change
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert difficulty thresholds
INSERT INTO difficulty_thresholds (difficulty_level, min_skill_level, max_skill_level, min_attempts, description) VALUES
('basic', 0.00, 0.65, 3, '기초 수준: 미분의 기본 규칙 학습'),
('intermediate', 0.55, 0.85, 5, '중급 수준: 복합 규칙과 응용'),
('advanced', 0.75, 1.00, 5, '고급 수준: 복잡한 합성 함수와 응용 문제');

-- Performance metrics summary: aggregated statistics per user
CREATE TABLE IF NOT EXISTS student_performance_summary (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE,
    total_attempts INT DEFAULT 0,
    total_completed INT DEFAULT 0,
    average_completion_rate DECIMAL(5,2) DEFAULT 0.00, -- percentage
    average_skill_level DECIMAL(3,2) DEFAULT 0.50, -- overall mastery
    current_difficulty ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
    recommended_difficulty ENUM('basic', 'intermediate', 'advanced') DEFAULT 'basic',
    weak_skills JSON NULL, -- array of skills below threshold
    strong_skills JSON NULL, -- array of mastered skills
    total_time_spent_seconds INT DEFAULT 0,
    last_activity TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (moodle_user_id),
    INDEX idx_difficulty (current_difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recommendation settings: configurable parameters for the recommendation engine
CREATE TABLE IF NOT EXISTS recommendation_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    setting_type ENUM('int', 'float', 'string', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default recommendation settings
INSERT INTO recommendation_settings (setting_key, setting_value, setting_type, description) VALUES
('skill_mastery_threshold', '0.80', 'float', '기술 숙달로 간주되는 최소 레벨'),
('skill_weakness_threshold', '0.50', 'float', '보강 학습이 필요한 최대 레벨'),
('min_attempts_for_recommendation', '3', 'int', '추천 생성에 필요한 최소 시도 횟수'),
('difficulty_adjustment_cooldown_hours', '24', 'int', '난이도 조정 사이 최소 대기 시간'),
('max_recommendations_per_session', '5', 'int', '세션당 최대 추천 개수'),
('remedial_practice_trigger_threshold', '0.40', 'float', '보강 학습 트리거 임계값'),
('enable_adaptive_difficulty', 'true', 'boolean', '적응형 난이도 활성화'),
('enable_skill_based_recommendations', 'true', 'boolean', '스킬 기반 추천 활성화');
