-- Set MiniMap Database Schema
-- MySQL 5.7 Compatible

-- 집합 정보 테이블
CREATE TABLE IF NOT EXISTS sets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id INT DEFAULT NULL,
    color VARCHAR(7) DEFAULT '#3498db',
    position_x INT DEFAULT 0,
    position_y INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES sets(id) ON DELETE CASCADE,
    INDEX idx_parent (parent_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 집합 간 관계 테이블
CREATE TABLE IF NOT EXISTS set_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    set_a_id INT NOT NULL,
    set_b_id INT NOT NULL,
    relationship_type ENUM('subset', 'superset', 'intersect', 'union', 'disjoint') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (set_a_id) REFERENCES sets(id) ON DELETE CASCADE,
    FOREIGN KEY (set_b_id) REFERENCES sets(id) ON DELETE CASCADE,
    INDEX idx_set_a (set_a_id),
    INDEX idx_set_b (set_b_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 문제 정보 테이블 (Moodle 연동)
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50),
    difficulty_level INT DEFAULT 1,
    tags TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_moodle_id (moodle_question_id),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 문제-집합 매핑 테이블
CREATE TABLE IF NOT EXISTS problem_set_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    set_id INT NOT NULL,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id),
    INDEX idx_set (set_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 미니맵 설정 테이블
CREATE TABLE IF NOT EXISTS minimap_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT DEFAULT NULL,
    layout_type ENUM('tree', 'venn', 'network', 'hierarchy') DEFAULT 'tree',
    zoom_level DECIMAL(3,2) DEFAULT 1.00,
    center_x INT DEFAULT 0,
    center_y INT DEFAULT 0,
    show_labels BOOLEAN DEFAULT TRUE,
    show_relationships BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학습자 진행 상황 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    set_id INT NOT NULL,
    attempt_count INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (set_id) REFERENCES sets(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_set (set_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 샘플 데이터 삽입
INSERT INTO sets (name, description, color, position_x, position_y) VALUES
('자연수', '1부터 시작하는 양의 정수', '#e74c3c', 100, 100),
('정수', '음수, 0, 양수를 포함하는 수', '#3498db', 100, 200),
('유리수', '분수로 표현할 수 있는 수', '#2ecc71', 100, 300),
('실수', '수직선 위의 모든 수', '#f39c12', 100, 400),
('짝수', '2로 나누어떨어지는 정수', '#9b59b6', 300, 150),
('홀수', '2로 나누어떨어지지 않는 정수', '#1abc9c', 300, 250);

INSERT INTO set_relationships (set_a_id, set_b_id, relationship_type) VALUES
(1, 2, 'subset'),  -- 자연수 ⊂ 정수
(2, 3, 'subset'),  -- 정수 ⊂ 유리수
(3, 4, 'subset'),  -- 유리수 ⊂ 실수
(5, 2, 'subset'),  -- 짝수 ⊂ 정수
(6, 2, 'subset'),  -- 홀수 ⊂ 정수
(5, 6, 'disjoint'); -- 짝수와 홀수는 서로소
