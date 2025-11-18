-- ============================================
-- AI Education System - Personalized Learning
-- Database Schema for MySQL 5.7
-- ============================================

-- Drop tables if exist (for clean reinstall)
DROP TABLE IF EXISTS student_attempts;
DROP TABLE IF EXISTS learning_patterns;
DROP TABLE IF EXISTS personalized_recommendations;
DROP TABLE IF EXISTS fraction_problems;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;

-- ============================================
-- 1. Teachers Table
-- ============================================
CREATE TABLE teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    institution VARCHAR(255) DEFAULT 'KAIST Touch Math Academy',
    role ENUM('teacher', 'admin') DEFAULT 'teacher',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. Students Table
-- ============================================
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    grade_level TINYINT NOT NULL COMMENT '1-12 grade level',
    moodle_user_id INT NULL COMMENT 'Moodle user ID for SSO integration',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_student_code (student_code),
    INDEX idx_moodle_user (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. Fraction Problems Table
-- ============================================
CREATE TABLE fraction_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_type ENUM('visualization', 'addition', 'subtraction', 'multiplication', 'division', 'comparison', 'simplification') NOT NULL,

    -- Problem data
    numerator_1 INT NOT NULL,
    denominator_1 INT NOT NULL CHECK (denominator_1 > 0),
    numerator_2 INT NULL,
    denominator_2 INT NULL CHECK (denominator_2 > 0 OR denominator_2 IS NULL),

    -- Visual representation
    visual_type ENUM('pizza', 'cake', 'bar', 'circle', 'number_line') DEFAULT 'bar',

    -- Difficulty and metadata
    difficulty_level TINYINT NOT NULL CHECK (difficulty_level BETWEEN 1 AND 5),
    recommended_for_pattern ENUM('visual', 'analytical', 'experimental', 'all') DEFAULT 'all',

    -- Correct answer
    answer_numerator INT NOT NULL,
    answer_denominator INT NOT NULL CHECK (answer_denominator > 0),

    -- Additional context
    problem_text TEXT NULL,
    hint_visual TEXT NULL COMMENT 'Visual hint (image path or description)',
    hint_analytical TEXT NULL COMMENT 'Step-by-step logical hint',
    hint_experimental TEXT NULL COMMENT 'Interactive manipulation hint',

    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (created_by) REFERENCES teachers(id) ON DELETE SET NULL,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_problem_type (problem_type),
    INDEX idx_recommended_pattern (recommended_for_pattern)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. Student Attempts Table
-- ============================================
CREATE TABLE student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,

    -- Student's answer
    answer_numerator INT NOT NULL,
    answer_denominator INT NOT NULL,
    is_correct BOOLEAN NOT NULL,

    -- Behavior tracking
    time_spent_seconds INT NOT NULL COMMENT 'Time spent on this problem',
    hint_requested BOOLEAN DEFAULT FALSE,
    hint_type_used ENUM('visual', 'analytical', 'experimental', 'none') DEFAULT 'none',
    visual_tool_clicks INT DEFAULT 0 COMMENT 'Number of clicks on visual tools',
    step_by_step_views INT DEFAULT 0 COMMENT 'Number of times viewed step-by-step solution',
    interactive_manipulations INT DEFAULT 0 COMMENT 'Number of interactive tool manipulations',

    -- Attempt metadata
    attempt_number TINYINT DEFAULT 1 COMMENT 'Which attempt for this problem',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES fraction_problems(id) ON DELETE CASCADE,
    INDEX idx_student_problem (student_id, problem_id),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. Learning Patterns Table
-- ============================================
CREATE TABLE learning_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,

    -- Pattern scores (0-100)
    visual_score DECIMAL(5,2) DEFAULT 33.33 COMMENT 'Preference for visual learning (0-100)',
    analytical_score DECIMAL(5,2) DEFAULT 33.33 COMMENT 'Preference for analytical learning (0-100)',
    experimental_score DECIMAL(5,2) DEFAULT 33.34 COMMENT 'Preference for experimental learning (0-100)',

    -- Dominant pattern
    dominant_pattern ENUM('visual', 'analytical', 'experimental', 'balanced') DEFAULT 'balanced',
    confidence_level DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Confidence in pattern detection (0-100)',

    -- Performance metrics
    total_problems_attempted INT DEFAULT 0,
    total_correct INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Overall accuracy percentage',
    avg_time_per_problem DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Average seconds per problem',

    -- Pattern-specific performance
    visual_problems_correct INT DEFAULT 0,
    visual_problems_total INT DEFAULT 0,
    analytical_problems_correct INT DEFAULT 0,
    analytical_problems_total INT DEFAULT 0,
    experimental_problems_correct INT DEFAULT 0,
    experimental_problems_total INT DEFAULT 0,

    -- Timestamps
    last_analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_pattern (student_id),
    INDEX idx_dominant_pattern (dominant_pattern)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. Personalized Recommendations Table
-- ============================================
CREATE TABLE personalized_recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,

    -- Recommendation score
    recommendation_score DECIMAL(5,2) NOT NULL COMMENT 'How well this problem matches student (0-100)',
    reason TEXT NULL COMMENT 'Why this problem was recommended',

    -- Recommended interaction style
    recommended_hint_type ENUM('visual', 'analytical', 'experimental') NOT NULL,
    recommended_difficulty TINYINT NULL COMMENT 'Suggested difficulty adjustment',

    -- Status
    is_presented BOOLEAN DEFAULT FALSE,
    presented_at TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES fraction_problems(id) ON DELETE CASCADE,
    INDEX idx_student_recommendations (student_id, recommendation_score DESC),
    INDEX idx_presented (is_presented, is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Initial Data: Teachers
-- ============================================
INSERT INTO teachers (name, email, role) VALUES
('김수학', 'kim.math@kaist.ac.kr', 'admin'),
('이교사', 'lee.teacher@kaist.ac.kr', 'teacher'),
('박선생', 'park.teacher@kaist.ac.kr', 'teacher');

-- ============================================
-- Initial Data: Sample Students
-- ============================================
INSERT INTO students (student_code, name, grade_level) VALUES
('STU001', '학생1', 4),
('STU002', '학생2', 4),
('STU003', '학생3', 5),
('STU004', '학생4', 5),
('STU005', '학생5', 6);

-- ============================================
-- Initial Data: Fraction Problems
-- ============================================

-- Easy Visual Problems (Difficulty 1-2)
INSERT INTO fraction_problems (
    problem_type, numerator_1, denominator_1, numerator_2, denominator_2,
    visual_type, difficulty_level, recommended_for_pattern,
    answer_numerator, answer_denominator,
    problem_text, hint_visual, hint_analytical, hint_experimental
) VALUES
-- Problem 1: Simple visualization
('visualization', 1, 2, NULL, NULL, 'pizza', 1, 'visual', 1, 2,
'피자의 1/2을 색칠하세요.',
'피자를 2개의 같은 크기 조각으로 나누고, 그 중 1조각을 색칠합니다.',
'전체를 2로 나누면 한 조각은 1/2입니다.',
'피자를 클릭하여 조각으로 나눠보세요.'),

-- Problem 2: Simple addition
('addition', 1, 4, 1, 4, 'bar', 1, 'visual', 2, 4,
'1/4 + 1/4 = ?',
'막대를 4등분하고, 1칸과 1칸을 합치면 2칸이 됩니다.',
'분모가 같으면 분자끼리 더합니다: 1+1=2, 분모는 그대로 4',
'막대 모델을 움직여서 합쳐보세요.'),

-- Problem 3: Comparison
('comparison', 1, 2, 1, 4, 'circle', 2, 'visual', 1, 2,
'1/2와 1/4 중 어느 것이 더 클까요?',
'원을 반으로 자른 것과 4등분으로 자른 것을 비교해보세요.',
'같은 크기의 원에서 2등분한 조각이 4등분한 조각보다 큽니다.',
'두 원을 겹쳐서 비교해보세요.'),

-- Medium Analytical Problems (Difficulty 3)
('addition', 1, 3, 1, 6, 'number_line', 3, 'analytical', 3, 6,
'1/3 + 1/6 = ?',
'수직선에서 1/3 위치에서 시작해 1/6만큼 더 이동합니다.',
'분모를 6으로 통일: 1/3 = 2/6, 따라서 2/6 + 1/6 = 3/6',
'수직선 위를 이동하며 답을 찾아보세요.'),

('subtraction', 3, 4, 1, 2, 'bar', 3, 'analytical', 1, 4,
'3/4 - 1/2 = ?',
'막대 3/4에서 1/2를 빼면 얼마가 남을까요?',
'분모를 4로 통일: 1/2 = 2/4, 따라서 3/4 - 2/4 = 1/4',
'막대에서 일부를 제거해보세요.'),

-- Advanced Problems (Difficulty 4-5)
('multiplication', 2, 3, 3, 4, 'bar', 4, 'analytical', 6, 12,
'2/3 × 3/4 = ?',
NULL,
'분자끼리 곱하고 분모끼리 곱합니다: (2×3)/(3×4) = 6/12 = 1/2',
'사각형을 가로세로로 나눠 면적을 구해보세요.'),

('division', 1, 2, 1, 4, 'bar', 4, 'analytical', 2, 1,
'1/2 ÷ 1/4 = ?',
NULL,
'나누기는 역수를 곱하기: 1/2 ÷ 1/4 = 1/2 × 4/1 = 4/2 = 2',
'1/2 안에 1/4이 몇 개 들어가는지 세어보세요.'),

('simplification', 6, 8, NULL, NULL, 'bar', 3, 'analytical', 3, 4,
'6/8을 기약분수로 나타내세요.',
'막대를 보고 가장 간단한 형태를 찾아보세요.',
'최대공약수 2로 나누면: 6÷2 / 8÷2 = 3/4',
'막대를 재그룹화하여 간단히 만들어보세요.'),

-- Experimental/Interactive Problems
('visualization', 3, 5, NULL, NULL, 'pizza', 2, 'experimental', 3, 5,
'피자를 5조각으로 나누고 3조각을 색칠하세요.',
'피자를 똑같은 5조각으로 나누는 것이 중요합니다.',
'전체를 5로 나눈 것의 3배입니다.',
'마우스로 직접 피자를 나눠보세요.'),

('addition', 2, 5, 1, 5, 'bar', 2, 'experimental', 3, 5,
'2/5 + 1/5 = ?',
'막대 2칸과 1칸을 합쳐보세요.',
'분모가 같으면: 2+1=3, 분모는 5 그대로',
'막대를 드래그하여 합쳐보세요.');

-- ============================================
-- Views for Analytics
-- ============================================

-- View: Student Performance Summary
CREATE VIEW v_student_performance AS
SELECT
    s.id,
    s.student_code,
    s.name,
    s.grade_level,
    lp.dominant_pattern,
    lp.confidence_level,
    lp.total_problems_attempted,
    lp.total_correct,
    lp.accuracy_rate,
    lp.avg_time_per_problem,
    lp.visual_score,
    lp.analytical_score,
    lp.experimental_score
FROM students s
LEFT JOIN learning_patterns lp ON s.id = lp.student_id;

-- View: Recent Student Activity
CREATE VIEW v_recent_activity AS
SELECT
    sa.id,
    s.student_code,
    s.name AS student_name,
    fp.problem_type,
    fp.difficulty_level,
    sa.is_correct,
    sa.time_spent_seconds,
    sa.hint_type_used,
    sa.attempted_at
FROM student_attempts sa
JOIN students s ON sa.student_id = s.id
JOIN fraction_problems fp ON sa.problem_id = fp.id
ORDER BY sa.attempted_at DESC;

-- ============================================
-- Stored Procedures
-- ============================================

DELIMITER //

-- Procedure: Initialize learning pattern for new student
CREATE PROCEDURE sp_initialize_learning_pattern(IN p_student_id INT)
BEGIN
    INSERT INTO learning_patterns (
        student_id,
        visual_score,
        analytical_score,
        experimental_score,
        dominant_pattern,
        confidence_level
    ) VALUES (
        p_student_id,
        33.33,
        33.33,
        33.34,
        'balanced',
        0.00
    )
    ON DUPLICATE KEY UPDATE
        updated_at = CURRENT_TIMESTAMP;
END //

-- Procedure: Update learning pattern based on recent attempts
CREATE PROCEDURE sp_update_learning_pattern(IN p_student_id INT)
BEGIN
    DECLARE v_visual_clicks INT DEFAULT 0;
    DECLARE v_analytical_views INT DEFAULT 0;
    DECLARE v_experimental_manips INT DEFAULT 0;
    DECLARE v_total_interactions INT DEFAULT 0;
    DECLARE v_visual_pct DECIMAL(5,2) DEFAULT 33.33;
    DECLARE v_analytical_pct DECIMAL(5,2) DEFAULT 33.33;
    DECLARE v_experimental_pct DECIMAL(5,2) DEFAULT 33.34;
    DECLARE v_dominant VARCHAR(20) DEFAULT 'balanced';
    DECLARE v_confidence DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_total_attempts INT DEFAULT 0;
    DECLARE v_total_correct INT DEFAULT 0;
    DECLARE v_accuracy DECIMAL(5,2) DEFAULT 0.00;
    DECLARE v_avg_time DECIMAL(8,2) DEFAULT 0.00;

    -- Calculate interaction patterns
    SELECT
        SUM(visual_tool_clicks),
        SUM(step_by_step_views),
        SUM(interactive_manipulations),
        COUNT(*),
        SUM(CASE WHEN is_correct THEN 1 ELSE 0 END),
        AVG(time_spent_seconds)
    INTO
        v_visual_clicks,
        v_analytical_views,
        v_experimental_manips,
        v_total_attempts,
        v_total_correct,
        v_avg_time
    FROM student_attempts
    WHERE student_id = p_student_id;

    -- Calculate total interactions
    SET v_total_interactions = COALESCE(v_visual_clicks, 0) +
                                COALESCE(v_analytical_views, 0) +
                                COALESCE(v_experimental_manips, 0);

    -- Calculate percentages
    IF v_total_interactions > 0 THEN
        SET v_visual_pct = (COALESCE(v_visual_clicks, 0) / v_total_interactions) * 100;
        SET v_analytical_pct = (COALESCE(v_analytical_views, 0) / v_total_interactions) * 100;
        SET v_experimental_pct = (COALESCE(v_experimental_manips, 0) / v_total_interactions) * 100;
    END IF;

    -- Determine dominant pattern
    IF v_visual_pct > v_analytical_pct AND v_visual_pct > v_experimental_pct THEN
        SET v_dominant = 'visual';
        SET v_confidence = v_visual_pct;
    ELSEIF v_analytical_pct > v_experimental_pct THEN
        SET v_dominant = 'analytical';
        SET v_confidence = v_analytical_pct;
    ELSEIF v_experimental_pct > 40 THEN
        SET v_dominant = 'experimental';
        SET v_confidence = v_experimental_pct;
    ELSE
        SET v_dominant = 'balanced';
        SET v_confidence = 50.00;
    END IF;

    -- Calculate accuracy
    IF v_total_attempts > 0 THEN
        SET v_accuracy = (v_total_correct / v_total_attempts) * 100;
    END IF;

    -- Update learning pattern
    UPDATE learning_patterns
    SET
        visual_score = v_visual_pct,
        analytical_score = v_analytical_pct,
        experimental_score = v_experimental_pct,
        dominant_pattern = v_dominant,
        confidence_level = v_confidence,
        total_problems_attempted = COALESCE(v_total_attempts, 0),
        total_correct = COALESCE(v_total_correct, 0),
        accuracy_rate = v_accuracy,
        avg_time_per_problem = COALESCE(v_avg_time, 0),
        last_analyzed_at = CURRENT_TIMESTAMP
    WHERE student_id = p_student_id;

END //

DELIMITER ;

-- ============================================
-- Triggers
-- ============================================

DELIMITER //

-- Trigger: Auto-initialize learning pattern for new students
CREATE TRIGGER tr_student_after_insert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    CALL sp_initialize_learning_pattern(NEW.id);
END //

-- Trigger: Update learning pattern after each attempt
CREATE TRIGGER tr_attempt_after_insert
AFTER INSERT ON student_attempts
FOR EACH ROW
BEGIN
    CALL sp_update_learning_pattern(NEW.student_id);
END //

DELIMITER ;

-- ============================================
-- Indexes for Performance
-- ============================================

-- Already created inline, but listing here for reference:
-- students: idx_student_code, idx_moodle_user
-- fraction_problems: idx_difficulty, idx_problem_type, idx_recommended_pattern
-- student_attempts: idx_student_problem, idx_attempted_at
-- learning_patterns: unique_student_pattern, idx_dominant_pattern
-- personalized_recommendations: idx_student_recommendations, idx_presented

-- ============================================
-- End of Schema
-- ============================================
