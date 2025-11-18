-- Absolute Mirror - MySQL Database Schema
-- Compatible with MySQL 5.7
-- Character set: UTF-8 (supports Korean and English)

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS absolute_mirror
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE absolute_mirror;

-- ============================================================================
-- Table: problems
-- Stores absolute value equation problems
-- ============================================================================
CREATE TABLE IF NOT EXISTS problems (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Problem identification
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT COMMENT '문제 설명',
    equation VARCHAR(100) NOT NULL COMMENT '절댓값 방정식 (예: |x - 3| = 5)',

    -- Equation parameters
    axis_of_symmetry DECIMAL(10, 2) NOT NULL COMMENT '대칭축 (x = a)',
    target_value DECIMAL(10, 2) NOT NULL COMMENT '목표 값 (절댓값 결과)',

    -- Solutions
    solution_left DECIMAL(10, 2) NOT NULL COMMENT '좌측 해',
    solution_right DECIMAL(10, 2) NOT NULL COMMENT '우측 해',

    -- Additional info
    explanation TEXT COMMENT '해설',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '난이도',
    grade_level TINYINT UNSIGNED COMMENT '학년 (1-12)',

    -- Moodle integration
    moodle_question_id INT UNSIGNED COMMENT 'Moodle 질문 ID',
    moodle_course_id INT UNSIGNED COMMENT 'Moodle 코스 ID',

    -- Metadata
    created_by INT UNSIGNED COMMENT '생성자 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성 상태',

    -- Indexes
    INDEX idx_difficulty (difficulty),
    INDEX idx_grade_level (grade_level),
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='절댓값 방정식 문제 저장';

-- ============================================================================
-- Table: users
-- User information (can sync with Moodle users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- User identification
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),

    -- Moodle integration
    moodle_user_id INT UNSIGNED UNIQUE COMMENT 'Moodle 사용자 ID',

    -- User type
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    grade_level TINYINT UNSIGNED COMMENT '학년',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,

    -- Indexes
    INDEX idx_role (role),
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 정보';

-- ============================================================================
-- Table: student_attempts
-- Student attempts at solving problems
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Foreign keys
    user_id INT UNSIGNED NOT NULL,
    problem_id INT UNSIGNED NOT NULL,

    -- Attempt data
    answer_submitted VARCHAR(255) COMMENT '제출한 답',
    is_correct BOOLEAN DEFAULT FALSE,
    attempt_number TINYINT UNSIGNED DEFAULT 1 COMMENT '시도 번호',

    -- Interaction data
    time_spent_seconds INT UNSIGNED COMMENT '소요 시간 (초)',
    x_value_explored JSON COMMENT '탐색한 x 값들',
    visualization_interactions INT UNSIGNED DEFAULT 0 COMMENT '시각화 상호작용 횟수',

    -- Metadata
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(100) COMMENT '세션 ID',
    ip_address VARCHAR(45) COMMENT 'IP 주소',

    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_is_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학생 문제 풀이 시도 기록';

-- ============================================================================
-- Table: student_progress
-- Overall student progress tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_progress (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Foreign keys
    user_id INT UNSIGNED NOT NULL UNIQUE,

    -- Progress metrics
    total_problems_attempted INT UNSIGNED DEFAULT 0,
    total_problems_correct INT UNSIGNED DEFAULT 0,
    accuracy_percentage DECIMAL(5, 2) DEFAULT 0.00,

    -- Difficulty breakdown
    easy_attempted INT UNSIGNED DEFAULT 0,
    easy_correct INT UNSIGNED DEFAULT 0,
    medium_attempted INT UNSIGNED DEFAULT 0,
    medium_correct INT UNSIGNED DEFAULT 0,
    hard_attempted INT UNSIGNED DEFAULT 0,
    hard_correct INT UNSIGNED DEFAULT 0,

    -- Time metrics
    total_time_spent_seconds INT UNSIGNED DEFAULT 0,
    average_time_per_problem INT UNSIGNED DEFAULT 0,

    -- Engagement metrics
    total_sessions INT UNSIGNED DEFAULT 0,
    last_activity_at TIMESTAMP NULL,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_accuracy (accuracy_percentage),
    INDEX idx_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학생 전체 진행 상황';

-- ============================================================================
-- Table: sessions
-- User session tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

    -- Foreign keys
    user_id INT UNSIGNED NOT NULL,

    -- Session data
    session_id VARCHAR(100) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,

    -- Session metrics
    problems_viewed INT UNSIGNED DEFAULT 0,
    problems_attempted INT UNSIGNED DEFAULT 0,

    -- Timestamps
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,

    -- Foreign key constraint
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 세션 추적';

-- ============================================================================
-- Sample data for testing
-- ============================================================================

-- Insert sample problems
INSERT INTO problems (
    title, description, equation,
    axis_of_symmetry, target_value,
    solution_left, solution_right,
    explanation, difficulty, grade_level
) VALUES
    (
        '기본 절댓값 방정식',
        '|x - 3| = 5를 풀어보세요. 대칭축을 기준으로 양쪽으로 5만큼 떨어진 값을 찾아야 합니다.',
        '|x - 3| = 5',
        3, 5, -2, 8,
        '절댓값 방정식 |x - 3| = 5는 두 개의 해를 가집니다.\n\n경우 1: x - 3 = 5 → x = 8\n경우 2: x - 3 = -5 → x = -2\n\n미러 터널에서 대칭축 x=3을 기준으로 양쪽으로 5만큼 떨어진 점이 해입니다.',
        'easy', 7
    ),
    (
        '절댓값 방정식 - 작은 값',
        '|x + 2| = 3을 풀어보세요.',
        '|x + 2| = 3',
        -2, 3, -5, 1,
        '절댓값 방정식 |x + 2| = 3은 |x - (-2)| = 3으로 쓸 수 있습니다.\n\n경우 1: x + 2 = 3 → x = 1\n경우 2: x + 2 = -3 → x = -5\n\n대칭축은 x = -2입니다.',
        'easy', 7
    ),
    (
        '절댓값 방정식 - 정수 해',
        '|x| = 7을 풀어보세요.',
        '|x| = 7',
        0, 7, -7, 7,
        '가장 기본적인 절댓값 방정식입니다.\n\n경우 1: x = 7\n경우 2: x = -7\n\n대칭축은 원점(x = 0)입니다.',
        'easy', 6
    ),
    (
        '절댓값 방정식 - 큰 값',
        '|x - 5| = 10을 풀어보세요.',
        '|x - 5| = 10',
        5, 10, -5, 15,
        '절댓값 방정식 |x - 5| = 10의 해를 구합니다.\n\n경우 1: x - 5 = 10 → x = 15\n경우 2: x - 5 = -10 → x = -5\n\n대칭축 x=5를 기준으로 양쪽으로 10만큼 떨어진 점입니다.',
        'medium', 8
    ),
    (
        '절댓값 방정식 - 음수 대칭축',
        '|x + 4| = 6을 풀어보세요.',
        '|x + 4| = 6',
        -4, 6, -10, 2,
        '절댓값 방정식 |x + 4| = 6의 해를 구합니다.\n\n경우 1: x + 4 = 6 → x = 2\n경우 2: x + 4 = -6 → x = -10\n\n대칭축은 x = -4입니다.',
        'medium', 8
    );

-- Insert sample admin user
INSERT INTO users (username, email, full_name, role) VALUES
    ('admin', 'admin@example.com', '관리자', 'admin'),
    ('teacher1', 'teacher@example.com', '김선생', 'teacher'),
    ('student1', 'student@example.com', '이학생', 'student');

-- ============================================================================
-- Views for easier data access
-- ============================================================================

-- View: Recent student attempts with problem details
CREATE OR REPLACE VIEW v_recent_attempts AS
SELECT
    sa.id AS attempt_id,
    u.username,
    u.full_name,
    p.title AS problem_title,
    p.equation,
    sa.answer_submitted,
    sa.is_correct,
    sa.time_spent_seconds,
    sa.attempted_at
FROM student_attempts sa
JOIN users u ON sa.user_id = u.id
JOIN problems p ON sa.problem_id = p.id
ORDER BY sa.attempted_at DESC;

-- View: Student performance summary
CREATE OR REPLACE VIEW v_student_performance AS
SELECT
    u.id AS user_id,
    u.username,
    u.full_name,
    sp.total_problems_attempted,
    sp.total_problems_correct,
    sp.accuracy_percentage,
    sp.total_time_spent_seconds,
    sp.average_time_per_problem,
    sp.last_activity_at
FROM users u
LEFT JOIN student_progress sp ON u.user_id = sp.user_id
WHERE u.role = 'student';

-- ============================================================================
-- Stored Procedures
-- ============================================================================

-- Procedure: Update student progress after attempt
DELIMITER //
CREATE PROCEDURE update_student_progress(
    IN p_user_id INT UNSIGNED,
    IN p_problem_id INT UNSIGNED,
    IN p_is_correct BOOLEAN,
    IN p_time_spent INT UNSIGNED
)
BEGIN
    DECLARE v_difficulty VARCHAR(20);

    -- Get problem difficulty
    SELECT difficulty INTO v_difficulty
    FROM problems
    WHERE id = p_problem_id;

    -- Insert or update student progress
    INSERT INTO student_progress (user_id, total_problems_attempted, total_problems_correct, total_time_spent_seconds)
    VALUES (p_user_id, 1, IF(p_is_correct, 1, 0), p_time_spent)
    ON DUPLICATE KEY UPDATE
        total_problems_attempted = total_problems_attempted + 1,
        total_problems_correct = total_problems_correct + IF(p_is_correct, 1, 0),
        total_time_spent_seconds = total_time_spent_seconds + p_time_spent,
        average_time_per_problem = total_time_spent_seconds / total_problems_attempted,
        accuracy_percentage = (total_problems_correct / total_problems_attempted) * 100,
        last_activity_at = CURRENT_TIMESTAMP;

    -- Update difficulty-specific counters
    IF v_difficulty = 'easy' THEN
        UPDATE student_progress
        SET easy_attempted = easy_attempted + 1,
            easy_correct = easy_correct + IF(p_is_correct, 1, 0)
        WHERE user_id = p_user_id;
    ELSEIF v_difficulty = 'medium' THEN
        UPDATE student_progress
        SET medium_attempted = medium_attempted + 1,
            medium_correct = medium_correct + IF(p_is_correct, 1, 0)
        WHERE user_id = p_user_id;
    ELSEIF v_difficulty = 'hard' THEN
        UPDATE student_progress
        SET hard_attempted = hard_attempted + 1,
            hard_correct = hard_correct + IF(p_is_correct, 1, 0)
        WHERE user_id = p_user_id;
    END IF;
END//
DELIMITER ;
