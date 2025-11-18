-- Permutation Pattern Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS permutation_pattern CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE permutation_pattern;

-- Students table (synced from Moodle)
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    grade_level VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pattern types and difficulty levels
CREATE TABLE pattern_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL,
    pattern_rule TEXT NOT NULL, -- JSON describing the permutation rule
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Problems from Moodle
CREATE TABLE problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT UNIQUE,
    pattern_type_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    initial_sequence TEXT NOT NULL, -- JSON array
    target_sequence TEXT NOT NULL, -- JSON array (correct answer)
    pattern_hint TEXT,
    difficulty_level ENUM('beginner', 'intermediate', 'advanced', 'expert') NOT NULL,
    time_limit_seconds INT DEFAULT 300,
    max_attempts INT DEFAULT 3,
    points INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (pattern_type_id) REFERENCES pattern_types(id) ON DELETE CASCADE,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_pattern_type (pattern_type_id),
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts and submissions
CREATE TABLE attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    submitted_sequence TEXT NOT NULL, -- JSON array
    is_correct BOOLEAN NOT NULL,
    time_spent_seconds INT,
    score INT DEFAULT 0,
    attempt_number INT DEFAULT 1,
    feedback TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_student_problem (student_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student progress tracking
CREATE TABLE student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    pattern_type_id INT NOT NULL,
    problems_attempted INT DEFAULT 0,
    problems_solved INT DEFAULT 0,
    total_score INT DEFAULT 0,
    average_time_seconds DECIMAL(10, 2),
    mastery_level DECIMAL(5, 2) DEFAULT 0.00, -- 0-100 percentage
    last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (pattern_type_id) REFERENCES pattern_types(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_pattern (student_id, pattern_type_id),
    INDEX idx_student (student_id),
    INDEX idx_mastery (mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions for tracking active learning sessions
CREATE TABLE sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    moodle_session_id VARCHAR(255),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_session_token (session_token),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Achievements and badges
CREATE TABLE achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    badge_icon VARCHAR(255),
    criteria TEXT NOT NULL, -- JSON describing achievement criteria
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student achievements
CREATE TABLE student_achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    achievement_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_achievement (student_id, achievement_id),
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample pattern types
INSERT INTO pattern_types (name, description, difficulty_level, pattern_rule) VALUES
('Rotation', 'Elements rotate positions in a circular pattern', 'beginner', '{"type": "rotation", "direction": "right", "steps": 1}'),
('Reversal', 'Elements are reversed in order', 'beginner', '{"type": "reversal"}'),
('Swap Adjacent', 'Adjacent elements swap positions', 'intermediate', '{"type": "swap", "pattern": "adjacent"}'),
('Fibonacci Sequence', 'Elements follow Fibonacci position pattern', 'advanced', '{"type": "fibonacci"}'),
('Custom Permutation', 'Complex custom permutation pattern', 'expert', '{"type": "custom", "rule": "defined_by_problem"}');

-- Insert sample problems
INSERT INTO problems (pattern_type_id, title, description, initial_sequence, target_sequence, pattern_hint, difficulty_level, moodle_question_id) VALUES
(1, 'Basic Rotation', 'Rotate the elements one position to the right', '["A", "B", "C", "D"]', '["D", "A", "B", "C"]', 'Each element moves one position to the right', 'beginner', 1001),
(2, 'Simple Reversal', 'Reverse the order of elements', '["1", "2", "3", "4", "5"]', '["5", "4", "3", "2", "1"]', 'First becomes last, second becomes second-to-last', 'beginner', 1002),
(3, 'Adjacent Swap', 'Swap each pair of adjacent elements', '["A", "B", "C", "D"]', '["B", "A", "D", "C"]', 'Pairs of neighbors exchange positions', 'intermediate', 1003),
(1, 'Double Rotation', 'Rotate the elements two positions to the right', '["🔴", "🟢", "🔵", "🟡", "🟣"]', '["🟡", "🟣", "🔴", "🟢", "🔵"]', 'Each element moves two positions', 'intermediate', 1004);

-- Insert sample achievements
INSERT INTO achievements (name, description, badge_icon, criteria, points) VALUES
('First Steps', 'Complete your first problem', '🎯', '{"problems_solved": 1}', 10),
('Pattern Master', 'Solve 10 problems correctly', '⭐', '{"problems_solved": 10}', 50),
('Speed Demon', 'Solve a problem in under 30 seconds', '⚡', '{"time_limit": 30}', 25),
('Perfect Score', 'Solve 5 problems without any mistakes', '💎', '{"perfect_streak": 5}', 100),
('Rotation Expert', 'Master all rotation pattern problems', '🔄', '{"pattern_type": "rotation", "mastery": 100}', 75);
