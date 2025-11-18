-- Sequence Puzzle Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7 LMS Integration

-- 문제 카테고리 테이블
CREATE TABLE IF NOT EXISTS puzzle_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 수열 퍼즐 문제 테이블
CREATE TABLE IF NOT EXISTS sequence_puzzles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    sequence_type ENUM('arithmetic', 'geometric', 'fibonacci', 'custom') DEFAULT 'arithmetic',
    -- 수열 데이터 (JSON 형식)
    sequence_data TEXT NOT NULL COMMENT 'JSON: 수열 숫자들',
    -- 퍼즐 조각 데이터 (JSON 형식)
    puzzle_pieces TEXT NOT NULL COMMENT 'JSON: 드래그할 퍼즐 조각들',
    correct_answer TEXT NOT NULL COMMENT 'JSON: 정답 순서',
    hint TEXT,
    points INT DEFAULT 10,
    time_limit INT DEFAULT 300 COMMENT '제한시간(초)',
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES puzzle_categories(id) ON DELETE SET NULL,
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 세션 테이블 (Moodle 사용자 연동)
CREATE TABLE IF NOT EXISTS student_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_name VARCHAR(100),
    user_email VARCHAR(255),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_session_token (session_token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 답안 및 진행 상황 테이블
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    puzzle_id INT NOT NULL,
    student_answer TEXT COMMENT 'JSON: 학생이 제출한 답안',
    is_correct TINYINT(1),
    score INT DEFAULT 0,
    time_spent INT COMMENT '소요 시간(초)',
    attempts_count INT DEFAULT 1,
    hint_used TINYINT(1) DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (puzzle_id) REFERENCES sequence_puzzles(id) ON DELETE CASCADE,
    INDEX idx_session_puzzle (session_id, puzzle_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학습 진도 추적 테이블
CREATE TABLE IF NOT EXISTS learning_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    total_puzzles_attempted INT DEFAULT 0,
    total_puzzles_solved INT DEFAULT 0,
    total_score INT DEFAULT 0,
    average_time FLOAT,
    last_puzzle_id INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
    UNIQUE KEY unique_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Moodle 성적 전송 로그
CREATE TABLE IF NOT EXISTS grade_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    puzzle_id INT NOT NULL,
    moodle_grade_item_id INT,
    grade_value DECIMAL(10,2),
    sync_status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
    error_message TEXT,
    synced_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES student_sessions(id) ON DELETE CASCADE,
    INDEX idx_sync_status (sync_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 샘플 데이터 삽입
INSERT INTO puzzle_categories (name, description) VALUES
('등차수열', '일정한 차이로 증가하거나 감소하는 수열'),
('등비수열', '일정한 비율로 증가하거나 감소하는 수열'),
('피보나치', '앞의 두 항을 더한 값이 다음 항이 되는 수열'),
('규칙 찾기', '다양한 패턴과 규칙이 숨어있는 수열');

-- 샘플 퍼즐 문제
INSERT INTO sequence_puzzles (
    category_id, title, description, difficulty, sequence_type,
    sequence_data, puzzle_pieces, correct_answer, hint, points, time_limit
) VALUES
(
    1,
    '등차수열 기초 - 3씩 증가',
    '다음 수열의 규칙을 찾아 퍼즐을 완성하세요: 2, 5, 8, 11, ?',
    'easy',
    'arithmetic',
    '{"sequence": [2, 5, 8, 11], "missing_position": 4, "answer": 14}',
    '{"pieces": [
        {"id": 1, "text": "첫 번째 수는 2", "correct": true},
        {"id": 2, "text": "매번 3씩 증가", "correct": true},
        {"id": 3, "text": "다음 수는 14", "correct": true},
        {"id": 4, "text": "매번 2씩 증가", "correct": false},
        {"id": 5, "text": "다음 수는 15", "correct": false}
    ]}',
    '[1, 2, 3]',
    '각 숫자 사이의 차이를 살펴보세요',
    10,
    180
),
(
    2,
    '등비수열 기초 - 2배씩 증가',
    '다음 수열의 규칙을 찾아 퍼즐을 완성하세요: 3, 6, 12, 24, ?',
    'easy',
    'geometric',
    '{"sequence": [3, 6, 12, 24], "missing_position": 4, "answer": 48}',
    '{"pieces": [
        {"id": 1, "text": "첫 번째 수는 3", "correct": true},
        {"id": 2, "text": "매번 2배씩 증가", "correct": true},
        {"id": 3, "text": "다음 수는 48", "correct": true},
        {"id": 4, "text": "매번 3씩 더함", "correct": false},
        {"id": 5, "text": "다음 수는 36", "correct": false}
    ]}',
    '[1, 2, 3]',
    '이전 수에 곱해지는 숫자를 찾아보세요',
    10,
    180
),
(
    3,
    '피보나치 수열 입문',
    '피보나치 수열의 규칙을 찾아보세요: 1, 1, 2, 3, 5, ?',
    'medium',
    'fibonacci',
    '{"sequence": [1, 1, 2, 3, 5], "missing_position": 5, "answer": 8}',
    '{"pieces": [
        {"id": 1, "text": "앞의 두 수를 더함", "correct": true},
        {"id": 2, "text": "3 + 5 = 8", "correct": true},
        {"id": 3, "text": "다음 수는 8", "correct": true},
        {"id": 4, "text": "매번 2배", "correct": false},
        {"id": 5, "text": "다음 수는 6", "correct": false},
        {"id": 6, "text": "일정한 차이", "correct": false}
    ]}',
    '[1, 2, 3]',
    '앞의 두 개 숫자를 더해보세요',
    15,
    240
),
(
    4,
    '복잡한 규칙 - 제곱수 패턴',
    '다음 수열의 규칙을 찾아보세요: 1, 4, 9, 16, ?',
    'medium',
    'custom',
    '{"sequence": [1, 4, 9, 16], "missing_position": 4, "answer": 25}',
    '{"pieces": [
        {"id": 1, "text": "각 항은 순서의 제곱", "correct": true},
        {"id": 2, "text": "1², 2², 3², 4²", "correct": true},
        {"id": 3, "text": "다음은 5² = 25", "correct": true},
        {"id": 4, "text": "매번 3씩 증가", "correct": false},
        {"id": 5, "text": "다음 수는 20", "correct": false}
    ]}',
    '[1, 2, 3]',
    '각 숫자가 무엇의 제곱인지 생각해보세요',
    20,
    300
);
