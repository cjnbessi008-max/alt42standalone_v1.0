-- Wave Rate Application Database Schema
-- MySQL 5.7 Compatible

-- 문제 정보 테이블 (Moodle과 연동)
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    question_text TEXT NOT NULL,
    function_expression VARCHAR(255) NOT NULL,
    x_min DECIMAL(10, 2) DEFAULT -10,
    x_max DECIMAL(10, 2) DEFAULT 10,
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 함수 변화율 데이터 캐시 테이블
CREATE TABLE IF NOT EXISTS rate_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    x_value DECIMAL(10, 4) NOT NULL,
    y_value DECIMAL(10, 4) NOT NULL,
    derivative_value DECIMAL(10, 4) NOT NULL,
    wave_amplitude DECIMAL(10, 4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 응답 테이블
CREATE TABLE IF NOT EXISTS student_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    response_data JSON,
    is_correct BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem_student (problem_id, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 샘플 데이터 삽입
INSERT INTO problems (moodle_question_id, question_text, function_expression, x_min, x_max, difficulty_level) VALUES
(1001, '다음 함수의 변화율을 파동으로 시각화하시오: f(x) = x²', 'x*x', -5, 5, 'easy'),
(1002, '다음 함수의 변화율을 파동으로 시각화하시오: f(x) = sin(x)', 'Math.sin(x)', -6.28, 6.28, 'medium'),
(1003, '다음 함수의 변화율을 파동으로 시각화하시오: f(x) = e^x', 'Math.exp(x)', -2, 2, 'hard');
