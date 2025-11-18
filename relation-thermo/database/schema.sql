-- Relation Thermo Database Schema
-- MySQL 5.7 Compatible

-- 문제(Problem) 테이블
CREATE TABLE IF NOT EXISTS rt_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL,
    moodle_activity_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    set_a VARCHAR(255) NOT NULL COMMENT '집합 A 요소들 (JSON 배열)',
    set_b VARCHAR(255) NOT NULL COMMENT '집합 B 요소들 (JSON 배열)',
    relation_type ENUM('subset', 'superset', 'equal', 'disjoint', 'intersect') NOT NULL,
    difficulty TINYINT DEFAULT 1 COMMENT '난이도 (1-5)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_moodle_activity (moodle_activity_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 응답(Student Response) 테이블
CREATE TABLE IF NOT EXISTS rt_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    selected_relation ENUM('subset', 'superset', 'equal', 'disjoint', 'intersect'),
    confidence_level TINYINT COMMENT '확신도 (0-100, 온도계 값)',
    is_correct BOOLEAN,
    time_spent INT COMMENT '소요 시간 (초)',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES rt_problems(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_problem_user (problem_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학습 진행 상황(Progress) 테이블
CREATE TABLE IF NOT EXISTS rt_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    total_problems INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    average_confidence DECIMAL(5,2) COMMENT '평균 확신도',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_course (user_id, moodle_course_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 온도계 설정(Thermometer Settings) 테이블
CREATE TABLE IF NOT EXISTS rt_thermo_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL,
    min_temp INT DEFAULT 0 COMMENT '최소 온도 값',
    max_temp INT DEFAULT 100 COMMENT '최대 온도 값',
    color_cold VARCHAR(7) DEFAULT '#0066FF' COMMENT '낮은 온도 색상',
    color_warm VARCHAR(7) DEFAULT '#FF6600' COMMENT '높은 온도 색상',
    show_percentage BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 샘플 데이터
INSERT INTO rt_problems (moodle_course_id, moodle_activity_id, title, description, set_a, set_b, relation_type, difficulty)
VALUES
(1, 1, '부분집합 관계 이해', 'A = {1, 2, 3}이고 B = {1, 2, 3, 4, 5}일 때, 두 집합의 관계는?', '[1,2,3]', '[1,2,3,4,5]', 'subset', 1),
(1, 1, '교집합 관계', 'A = {2, 4, 6}이고 B = {4, 5, 6}일 때, 두 집합의 관계는?', '[2,4,6]', '[4,5,6]', 'intersect', 2),
(1, 1, '서로소 집합', 'A = {1, 3, 5}이고 B = {2, 4, 6}일 때, 두 집합의 관계는?', '[1,3,5]', '[2,4,6]', 'disjoint', 2);
