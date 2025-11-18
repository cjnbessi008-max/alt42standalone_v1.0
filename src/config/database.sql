-- Component Lego System Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- Database creation
CREATE DATABASE IF NOT EXISTS component_lego
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE component_lego;

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Questions table (cached from Moodle)
CREATE TABLE questions (
    question_id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_question_id INT UNIQUE NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('chemistry', 'mathematics', 'physics', 'biology') NOT NULL,
    difficulty_level TINYINT DEFAULT 1,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_question_type (question_type),
    INDEX idx_moodle_id (moodle_question_id)
) ENGINE=InnoDB;

-- Components table (Lego blocks)
CREATE TABLE components (
    component_id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    component_type VARCHAR(50) NOT NULL COMMENT 'atom, molecule, number, operator, etc.',
    symbol VARCHAR(20) COMMENT 'H, O, +, -, etc.',
    display_name VARCHAR(100) NOT NULL,
    display_text VARCHAR(200),
    color VARCHAR(7) COMMENT 'Hex color code',
    properties JSON COMMENT 'Component-specific properties',
    visual_config JSON COMMENT 'Size, shape, icon, etc.',
    quantity INT DEFAULT 1 COMMENT 'Available quantity in palette',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    INDEX idx_question_component (question_id, component_type)
) ENGINE=InnoDB;

-- Assembly patterns (correct answers and student attempts)
CREATE TABLE assembly_patterns (
    pattern_id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    pattern_name VARCHAR(100),
    pattern_data JSON NOT NULL COMMENT 'Component positions and connections',
    is_correct BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2) DEFAULT 1.00,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    INDEX idx_question_correct (question_id, is_correct)
) ENGINE=InnoDB;

-- ============================================================================
-- Student Activity Tables
-- ============================================================================

-- Students table
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id INT UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(200),
    grade_level VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP NULL,
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB;

-- Student attempts
CREATE TABLE student_attempts (
    attempt_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    question_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    assembled_pattern JSON NOT NULL COMMENT 'Student assembled components',
    is_correct BOOLEAN,
    time_spent INT COMMENT 'Seconds spent on assembly',
    hint_count TINYINT DEFAULT 0,
    attempt_number TINYINT DEFAULT 1,
    feedback TEXT,
    score DECIMAL(5,2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    INDEX idx_student_question (student_id, question_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB;

-- Student progress tracking
CREATE TABLE student_progress (
    progress_id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    question_id INT NOT NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'mastered') DEFAULT 'not_started',
    attempts_count INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    average_time INT COMMENT 'Average time in seconds',
    mastery_level DECIMAL(3,2) DEFAULT 0.00 COMMENT '0.00 to 1.00',
    first_attempt_at TIMESTAMP NULL,
    last_attempt_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_question (student_id, question_id),
    INDEX idx_mastery (mastery_level)
) ENGINE=InnoDB;

-- ============================================================================
-- Component Type Definitions
-- ============================================================================

-- Component type templates
CREATE TABLE component_templates (
    template_id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(100) UNIQUE NOT NULL,
    component_type VARCHAR(50) NOT NULL,
    subject_area ENUM('chemistry', 'mathematics', 'physics', 'biology') NOT NULL,
    default_properties JSON,
    default_visual JSON,
    validation_rules JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subject_type (subject_area, component_type)
) ENGINE=InnoDB;

-- ============================================================================
-- Analytics & Logging
-- ============================================================================

-- Component interactions log
CREATE TABLE interaction_logs (
    log_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    question_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    action_type ENUM('drag', 'drop', 'connect', 'disconnect', 'delete', 'submit') NOT NULL,
    component_id INT,
    position JSON COMMENT 'x, y coordinates',
    timestamp TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP(3),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(question_id) ON DELETE CASCADE,
    INDEX idx_session_time (session_id, timestamp)
) ENGINE=InnoDB;

-- System settings
CREATE TABLE system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    setting_type ENUM('string', 'integer', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Insert default component templates
INSERT INTO component_templates (template_name, component_type, subject_area, default_properties, default_visual) VALUES
-- Chemistry templates
('hydrogen_atom', 'atom', 'chemistry',
    '{"symbol": "H", "atomic_number": 1, "valence": 1, "mass": 1.008}',
    '{"color": "#FFFFFF", "shape": "circle", "size": 40, "icon": "H"}'),
('oxygen_atom', 'atom', 'chemistry',
    '{"symbol": "O", "atomic_number": 8, "valence": 2, "mass": 15.999}',
    '{"color": "#FF0000", "shape": "circle", "size": 50, "icon": "O"}'),
('carbon_atom', 'atom', 'chemistry',
    '{"symbol": "C", "atomic_number": 6, "valence": 4, "mass": 12.011}',
    '{"color": "#000000", "shape": "circle", "size": 45, "icon": "C"}'),
('nitrogen_atom', 'atom', 'chemistry',
    '{"symbol": "N", "atomic_number": 7, "valence": 3, "mass": 14.007}',
    '{"color": "#0000FF", "shape": "circle", "size": 45, "icon": "N"}'),

-- Chemistry bonds
('single_bond', 'bond', 'chemistry',
    '{"bond_type": "single", "strength": 1}',
    '{"color": "#333333", "width": 2, "style": "solid"}'),
('double_bond', 'bond', 'chemistry',
    '{"bond_type": "double", "strength": 2}',
    '{"color": "#333333", "width": 4, "style": "double"}'),
('triple_bond', 'bond', 'chemistry',
    '{"bond_type": "triple", "strength": 3}',
    '{"color": "#333333", "width": 6, "style": "triple"}'),

-- Mathematics templates
('number', 'number', 'mathematics',
    '{"value_type": "integer"}',
    '{"color": "#4CAF50", "shape": "square", "size": 40}'),
('fraction_numerator', 'fraction_part', 'mathematics',
    '{"position": "numerator"}',
    '{"color": "#2196F3", "shape": "rectangle", "size": 35}'),
('fraction_denominator', 'fraction_part', 'mathematics',
    '{"position": "denominator"}',
    '{"color": "#2196F3", "shape": "rectangle", "size": 35}'),
('fraction_bar', 'operator', 'mathematics',
    '{"operator": "divide"}',
    '{"color": "#000000", "shape": "line", "width": 60, "height": 2}'),
('plus_operator', 'operator', 'mathematics',
    '{"operator": "add"}',
    '{"color": "#FF9800", "shape": "symbol", "size": 30, "icon": "+"}'),
('minus_operator', 'operator', 'mathematics',
    '{"operator": "subtract"}',
    '{"color": "#FF9800", "shape": "symbol", "size": 30, "icon": "-"}'),
('multiply_operator', 'operator', 'mathematics',
    '{"operator": "multiply"}',
    '{"color": "#FF9800", "shape": "symbol", "size": 30, "icon": "×"}'),
('divide_operator', 'operator', 'mathematics',
    '{"operator": "divide"}',
    '{"color": "#FF9800", "shape": "symbol", "size": 30, "icon": "÷"}'),
('equals_operator', 'operator', 'mathematics',
    '{"operator": "equals"}',
    '{"color": "#000000", "shape": "symbol", "size": 30, "icon": "="}'),
('variable_x', 'variable', 'mathematics',
    '{"variable_name": "x"}',
    '{"color": "#9C27B0", "shape": "rounded_square", "size": 40, "icon": "x"}');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('moodle_url', 'https://your-moodle-site.com', 'string', 'Moodle base URL'),
('moodle_token', '', 'string', 'Moodle web service token'),
('smartphone_width', '360', 'integer', 'Virtual smartphone width in pixels'),
('smartphone_height', '640', 'integer', 'Virtual smartphone height in pixels'),
('max_attempts_per_question', '5', 'integer', 'Maximum attempts allowed per question'),
('hint_penalty', '0.1', 'string', 'Score penalty for using hints (0.0-1.0)'),
('auto_save_interval', '30', 'integer', 'Auto-save interval in seconds'),
('enable_analytics', 'true', 'boolean', 'Enable interaction analytics logging');

-- ============================================================================
-- Sample Data (for testing)
-- ============================================================================

-- Sample question: H2O molecule assembly
INSERT INTO questions (moodle_question_id, question_text, question_type, difficulty_level, metadata) VALUES
(1001, '물 분자(H₂O)를 조립하세요. Assemble a water molecule (H₂O).', 'chemistry', 1,
    '{"formula": "H2O", "molecule_name": "water", "korean_name": "물"}');

SET @h2o_question_id = LAST_INSERT_ID();

-- Components for H2O
INSERT INTO components (question_id, component_type, symbol, display_name, display_text, color, properties, visual_config, quantity) VALUES
(@h2o_question_id, 'atom', 'H', 'Hydrogen', '수소 (H)', '#FFFFFF',
    '{"atomic_number": 1, "valence": 1}',
    '{"shape": "circle", "size": 40, "border": "#333333"}', 2),
(@h2o_question_id, 'atom', 'O', 'Oxygen', '산소 (O)', '#FF0000',
    '{"atomic_number": 8, "valence": 2}',
    '{"shape": "circle", "size": 50, "border": "#333333"}', 1),
(@h2o_question_id, 'bond', '-', 'Single Bond', '단일 결합', '#333333',
    '{"bond_type": "single"}',
    '{"width": 3, "style": "solid"}', 2);

-- Correct assembly pattern for H2O
INSERT INTO assembly_patterns (question_id, pattern_name, pattern_data, is_correct, confidence_score) VALUES
(@h2o_question_id, 'water_molecule_standard',
    '{
        "components": [
            {"id": 1, "type": "atom", "symbol": "H", "position": {"x": 50, "y": 100}},
            {"id": 2, "type": "atom", "symbol": "O", "position": {"x": 150, "y": 100}},
            {"id": 3, "type": "atom", "symbol": "H", "position": {"x": 250, "y": 100}}
        ],
        "connections": [
            {"from": 1, "to": 2, "bond_type": "single"},
            {"from": 2, "to": 3, "bond_type": "single"}
        ],
        "structure": "H-O-H"
    }',
    TRUE, 1.00);

-- Sample question: Simple fraction
INSERT INTO questions (moodle_question_id, question_text, question_type, difficulty_level, metadata) VALUES
(2001, '3/4 분수를 조립하세요. Assemble the fraction 3/4.', 'mathematics', 1,
    '{"fraction": "3/4", "numerator": 3, "denominator": 4}');

SET @fraction_question_id = LAST_INSERT_ID();

-- Components for 3/4 fraction
INSERT INTO components (question_id, component_type, symbol, display_name, display_text, color, properties, visual_config, quantity) VALUES
(@fraction_question_id, 'number', '3', 'Three', '숫자 3', '#2196F3',
    '{"value": 3}',
    '{"shape": "square", "size": 40}', 1),
(@fraction_question_id, 'number', '4', 'Four', '숫자 4', '#2196F3',
    '{"value": 4}',
    '{"shape": "square", "size": 40}', 1),
(@fraction_question_id, 'operator', '/', 'Fraction Bar', '분수선', '#000000',
    '{"operator": "divide"}',
    '{"shape": "line", "width": 60, "height": 2}', 1);

-- Correct assembly pattern for 3/4
INSERT INTO assembly_patterns (question_id, pattern_name, pattern_data, is_correct) VALUES
(@fraction_question_id, 'fraction_3_4_standard',
    '{
        "components": [
            {"id": 1, "type": "number", "value": "3", "position": {"x": 150, "y": 80, "layer": "numerator"}},
            {"id": 2, "type": "operator", "symbol": "/", "position": {"x": 150, "y": 100, "layer": "middle"}},
            {"id": 3, "type": "number", "value": "4", "position": {"x": 150, "y": 120, "layer": "denominator"}}
        ],
        "structure": "3/4"
    }',
    TRUE);

-- ============================================================================
-- Views for common queries
-- ============================================================================

-- View: Student performance summary
CREATE VIEW v_student_performance AS
SELECT
    s.student_id,
    s.username,
    s.full_name,
    COUNT(DISTINCT sp.question_id) as questions_attempted,
    SUM(CASE WHEN sp.status = 'mastered' THEN 1 ELSE 0 END) as questions_mastered,
    AVG(sp.mastery_level) as avg_mastery_level,
    SUM(sp.attempts_count) as total_attempts,
    SUM(sp.correct_count) as total_correct
FROM students s
LEFT JOIN student_progress sp ON s.student_id = sp.student_id
GROUP BY s.student_id, s.username, s.full_name;

-- View: Question statistics
CREATE VIEW v_question_stats AS
SELECT
    q.question_id,
    q.question_text,
    q.question_type,
    q.difficulty_level,
    COUNT(DISTINCT sa.student_id) as students_attempted,
    COUNT(sa.attempt_id) as total_attempts,
    SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_attempts,
    AVG(sa.time_spent) as avg_time_spent,
    AVG(sa.score) as avg_score
FROM questions q
LEFT JOIN student_attempts sa ON q.question_id = sa.question_id
GROUP BY q.question_id, q.question_text, q.question_type, q.difficulty_level;

-- ============================================================================
-- Indexes for performance optimization
-- ============================================================================

-- Additional composite indexes
CREATE INDEX idx_attempts_student_date ON student_attempts(student_id, submitted_at DESC);
CREATE INDEX idx_progress_status ON student_progress(status, mastery_level);
CREATE INDEX idx_logs_session_action ON interaction_logs(session_id, action_type, timestamp);

-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER //

-- Procedure: Update student progress after attempt
CREATE PROCEDURE update_student_progress(
    IN p_student_id INT,
    IN p_question_id INT,
    IN p_is_correct BOOLEAN,
    IN p_time_spent INT
)
BEGIN
    DECLARE v_attempts_count INT DEFAULT 0;
    DECLARE v_correct_count INT DEFAULT 0;
    DECLARE v_new_mastery DECIMAL(3,2);

    -- Get current progress or initialize
    SELECT attempts_count, correct_count INTO v_attempts_count, v_correct_count
    FROM student_progress
    WHERE student_id = p_student_id AND question_id = p_question_id;

    IF v_attempts_count IS NULL THEN
        -- First attempt
        INSERT INTO student_progress (student_id, question_id, status, attempts_count, correct_count, average_time, first_attempt_at, last_attempt_at)
        VALUES (p_student_id, p_question_id, 'in_progress', 1, IF(p_is_correct, 1, 0), p_time_spent, NOW(), NOW());
    ELSE
        -- Update existing progress
        SET v_attempts_count = v_attempts_count + 1;
        IF p_is_correct THEN
            SET v_correct_count = v_correct_count + 1;
        END IF;

        -- Calculate mastery level (correct ratio with recency weighting)
        SET v_new_mastery = LEAST(1.0, (v_correct_count / v_attempts_count) * 1.2);

        UPDATE student_progress
        SET attempts_count = v_attempts_count,
            correct_count = v_correct_count,
            mastery_level = v_new_mastery,
            status = CASE
                WHEN v_new_mastery >= 0.9 THEN 'mastered'
                WHEN v_new_mastery >= 0.5 THEN 'in_progress'
                ELSE 'in_progress'
            END,
            average_time = (average_time + p_time_spent) / 2,
            last_attempt_at = NOW()
        WHERE student_id = p_student_id AND question_id = p_question_id;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- Triggers
-- ============================================================================

DELIMITER //

-- Trigger: Auto-update student progress after attempt
CREATE TRIGGER after_attempt_insert
AFTER INSERT ON student_attempts
FOR EACH ROW
BEGIN
    CALL update_student_progress(NEW.student_id, NEW.question_id, NEW.is_correct, NEW.time_spent);
END //

DELIMITER ;

-- ============================================================================
-- Grants (adjust as needed for your environment)
-- ============================================================================

-- CREATE USER 'component_lego_user'@'localhost' IDENTIFIED BY 'your_secure_password';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON component_lego.* TO 'component_lego_user'@'localhost';
-- FLUSH PRIVILEGES;
