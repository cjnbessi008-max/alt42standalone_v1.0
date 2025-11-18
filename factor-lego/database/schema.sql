-- Factor Lego Database Schema
-- MySQL 5.7 Compatible

-- 문제 정보 테이블
CREATE TABLE IF NOT EXISTS factor_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    expression VARCHAR(255) NOT NULL,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'easy',
    problem_type ENUM('binomial', 'trinomial', 'polynomial') DEFAULT 'binomial',
    correct_factors TEXT NOT NULL COMMENT 'JSON array of correct factor pieces',
    hints TEXT COMMENT 'JSON array of hints',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 답안 기록 테이블
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    moodle_attempt_id INT,
    student_answer TEXT NOT NULL COMMENT 'JSON array of student factor pieces',
    is_correct BOOLEAN DEFAULT FALSE,
    score DECIMAL(5,2) DEFAULT 0.00,
    time_spent INT DEFAULT 0 COMMENT 'Time spent in seconds',
    interactions_count INT DEFAULT 0 COMMENT 'Number of drag-drop actions',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES factor_problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 레고 조각 템플릿 테이블
CREATE TABLE IF NOT EXISTS lego_pieces (
    id INT AUTO_INCREMENT PRIMARY KEY,
    piece_type ENUM('variable', 'coefficient', 'operator', 'parenthesis') NOT NULL,
    piece_value VARCHAR(50) NOT NULL,
    color_code VARCHAR(7) DEFAULT '#3498db',
    icon_path VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 진행 상황 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    average_time INT DEFAULT 0,
    mastery_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기본 레고 조각 데이터 삽입
INSERT INTO lego_pieces (piece_type, piece_value, color_code, icon_path) VALUES
('variable', 'x', '#3498db', '/assets/images/lego/x-piece.svg'),
('variable', 'y', '#2ecc71', '/assets/images/lego/y-piece.svg'),
('coefficient', '1', '#e74c3c', '/assets/images/lego/num-piece.svg'),
('coefficient', '2', '#e74c3c', '/assets/images/lego/num-piece.svg'),
('coefficient', '3', '#e74c3c', '/assets/images/lego/num-piece.svg'),
('operator', '+', '#f39c12', '/assets/images/lego/plus-piece.svg'),
('operator', '-', '#f39c12', '/assets/images/lego/minus-piece.svg'),
('operator', '*', '#9b59b6', '/assets/images/lego/multiply-piece.svg'),
('parenthesis', '(', '#34495e', '/assets/images/lego/open-paren.svg'),
('parenthesis', ')', '#34495e', '/assets/images/lego/close-paren.svg');

-- 샘플 문제 데이터
INSERT INTO factor_problems (moodle_question_id, expression, difficulty_level, problem_type, correct_factors, hints) VALUES
(1001, 'x^2 + 5x + 6', 'easy', 'trinomial',
 '{"factors": ["(x + 2)", "(x + 3)"], "steps": ["find two numbers that multiply to 6 and add to 5", "2 × 3 = 6 and 2 + 3 = 5", "(x + 2)(x + 3)"]}',
 '["6을 곱해서 나오고 5를 더해서 나오는 두 수를 찾아보세요", "2와 3을 생각해보세요"]'),
(1002, 'x^2 - 9', 'easy', 'binomial',
 '{"factors": ["(x + 3)", "(x - 3)"], "steps": ["difference of squares: a^2 - b^2 = (a+b)(a-b)", "x^2 - 3^2", "(x + 3)(x - 3)"]}',
 '["제곱수의 차를 이용하세요", "a^2 - b^2 = (a+b)(a-b)"]'),
(1003, '2x^2 + 7x + 3', 'medium', 'trinomial',
 '{"factors": ["(2x + 1)", "(x + 3)"], "steps": ["use AC method: A=2, C=3, AC=6", "find factors of 6 that add to 7: 1 and 6", "2x^2 + 6x + x + 3", "(2x + 1)(x + 3)"]}',
 '["AC 방법을 사용하세요", "2 × 3 = 6의 인수를 찾으세요"]');
