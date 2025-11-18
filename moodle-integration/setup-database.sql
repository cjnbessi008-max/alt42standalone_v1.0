-- Roll Along App Database Setup Script
-- Compatible with MySQL 5.7+
-- For use with Moodle 3.7

-- Create Roll Along Problems Table
CREATE TABLE IF NOT EXISTS roll_along_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    instructions TEXT,
    function_type VARCHAR(50) DEFAULT 'linear',
    custom_function TEXT,
    x_min DECIMAL(10, 2) DEFAULT -10.00,
    x_max DECIMAL(10, 2) DEFAULT 10.00,
    y_min DECIMAL(10, 2) DEFAULT -10.00,
    y_max DECIMAL(10, 2) DEFAULT 10.00,
    difficulty_level INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_function_type (function_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Roll Along problem definitions';

-- Create Roll Along Progress Table
CREATE TABLE IF NOT EXISTS roll_along_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_id VARCHAR(255),
    progress_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_course (user_id, course_id),
    INDEX idx_problem (problem_id),
    INDEX idx_session (session_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student progress tracking';

-- Create Roll Along Answers Table
CREATE TABLE IF NOT EXISTS roll_along_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    problem_id INT NOT NULL,
    session_id VARCHAR(255),
    answer_data JSON,
    grade DECIMAL(5, 2),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    graded_at TIMESTAMP NULL,
    INDEX idx_user_course (user_id, course_id),
    INDEX idx_problem (problem_id),
    INDEX idx_grade (grade),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student submitted answers';

-- Insert Sample Problems
INSERT INTO roll_along_problems (title, instructions, function_type, x_min, x_max, y_min, y_max, difficulty_level)
VALUES
    (
        '일차함수 이해하기',
        'x값이 증가할 때 y값이 어떻게 변하는지 관찰하세요. 공을 움직여보면서 일차함수의 특성을 파악해보세요.',
        'linear',
        -10, 10, -10, 10, 1
    ),
    (
        '이차함수 탐구하기',
        'x값이 변할 때 y값이 제곱에 비례하여 변하는 것을 관찰하세요. 포물선 형태를 이해해보세요.',
        'quadratic',
        -10, 10, -10, 10, 2
    ),
    (
        '삼차함수 분석하기',
        'x값의 변화에 따라 y값이 세제곱으로 변하는 패턴을 찾아보세요.',
        'cubic',
        -10, 10, -10, 10, 3
    ),
    (
        '사인함수 파형 이해하기',
        '주기적으로 반복되는 사인 파형을 공의 움직임으로 이해해보세요.',
        'sine',
        -10, 10, -10, 10, 3
    ),
    (
        '코사인함수 학습하기',
        '사인함수와 비슷하지만 시작점이 다른 코사인 함수를 관찰하세요.',
        'cosine',
        -10, 10, -10, 10, 3
    ),
    (
        '사용자 정의 함수',
        '자신만의 함수를 만들어 공의 움직임을 관찰해보세요.',
        'custom',
        -10, 10, -10, 10, 4
    );

-- Create view for student performance analytics
CREATE OR REPLACE VIEW roll_along_student_stats AS
SELECT
    ra.user_id,
    ra.course_id,
    COUNT(DISTINCT ra.problem_id) as problems_attempted,
    COUNT(ra.id) as total_submissions,
    AVG(ra.grade) as average_grade,
    MAX(ra.grade) as best_grade,
    MIN(ra.grade) as lowest_grade,
    COUNT(DISTINCT rp.session_id) as total_sessions,
    MAX(ra.submitted_at) as last_submission
FROM roll_along_answers ra
LEFT JOIN roll_along_progress rp ON ra.user_id = rp.user_id AND ra.course_id = rp.course_id
GROUP BY ra.user_id, ra.course_id;

-- Create view for problem statistics
CREATE OR REPLACE VIEW roll_along_problem_stats AS
SELECT
    p.id,
    p.title,
    p.function_type,
    p.difficulty_level,
    COUNT(DISTINCT ra.user_id) as unique_students,
    COUNT(ra.id) as total_attempts,
    AVG(ra.grade) as average_grade,
    STDDEV(ra.grade) as grade_stddev,
    MIN(ra.grade) as min_grade,
    MAX(ra.grade) as max_grade
FROM roll_along_problems p
LEFT JOIN roll_along_answers ra ON p.id = ra.problem_id
GROUP BY p.id, p.title, p.function_type, p.difficulty_level;

-- Sample test data (optional - comment out for production)
-- INSERT INTO roll_along_progress (user_id, course_id, problem_id, session_id, progress_data)
-- VALUES
--     (1, 1, 1, 'test-session-001', '{"eventName": "page_load", "timestamp": "2025-01-18T12:00:00Z"}'),
--     (1, 1, 1, 'test-session-001', '{"eventName": "function_changed", "function": "quadratic"}');

-- INSERT INTO roll_along_answers (user_id, course_id, problem_id, session_id, answer_data, grade)
-- VALUES
--     (1, 1, 1, 'test-session-001', '{"x": 5, "y": 25, "function": "quadratic"}', 95.50),
--     (1, 1, 2, 'test-session-002', '{"x": 3, "y": 9, "function": "quadratic"}', 87.00);

-- Grant permissions (adjust user as needed)
-- GRANT SELECT, INSERT, UPDATE ON roll_along_problems TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON roll_along_progress TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON roll_along_answers TO 'moodle_user'@'localhost';
-- GRANT SELECT ON roll_along_student_stats TO 'moodle_user'@'localhost';
-- GRANT SELECT ON roll_along_problem_stats TO 'moodle_user'@'localhost';

-- Success message
SELECT 'Roll Along database tables created successfully!' as Status;
