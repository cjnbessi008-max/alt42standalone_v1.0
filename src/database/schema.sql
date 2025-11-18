-- Concept-Problem Matching Database Schema for Moodle LMS Integration
-- MySQL 5.7 Compatible

-- 개념(Concept) 테이블
CREATE TABLE IF NOT EXISTS concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    parent_concept_id INT NULL,
    moodle_category_id INT NULL COMMENT 'Moodle 카테고리 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_concept_id) REFERENCES concepts(id) ON DELETE SET NULL,
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_moodle_category (moodle_category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 개념 정보';

-- 문제(Problem) 테이블
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    problem_type VARCHAR(50) COMMENT '문제 유형',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    points INT DEFAULT 10 COMMENT '배점',
    moodle_question_id INT NULL COMMENT 'Moodle 문제 ID',
    moodle_quiz_id INT NULL COMMENT 'Moodle 퀴즈 ID',
    time_limit INT NULL COMMENT '제한 시간(초)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_type (problem_type),
    INDEX idx_moodle_question (moodle_question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='문제 정보';

-- 개념-문제 매칭 테이블
CREATE TABLE IF NOT EXISTS concept_problem_mapping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concept_id INT NOT NULL,
    problem_id INT NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 1.00 COMMENT '연관도 점수 (0-1)',
    is_primary BOOLEAN DEFAULT FALSE COMMENT '주 개념 여부',
    mapping_type ENUM('direct', 'prerequisite', 'related') DEFAULT 'direct',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mapping (concept_id, problem_id),
    INDEX idx_concept (concept_id),
    INDEX idx_problem (problem_id),
    INDEX idx_relevance (relevance_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='개념-문제 매칭 관계';

-- 학생 진도 추적 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id INT NOT NULL,
    concept_id INT NOT NULL,
    attempts INT DEFAULT 0 COMMENT '시도 횟수',
    correct_attempts INT DEFAULT 0 COMMENT '정답 횟수',
    last_score DECIMAL(5,2) NULL COMMENT '최근 점수',
    best_score DECIMAL(5,2) NULL COMMENT '최고 점수',
    time_spent INT DEFAULT 0 COMMENT '소요 시간(초)',
    status ENUM('not_started', 'in_progress', 'completed', 'mastered') DEFAULT 'not_started',
    first_attempt_at TIMESTAMP NULL,
    last_attempt_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_progress (student_id, problem_id, concept_id),
    INDEX idx_student (student_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 학습 진도';

-- 개념 선수 관계 테이블
CREATE TABLE IF NOT EXISTS concept_prerequisites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concept_id INT NOT NULL COMMENT '학습할 개념',
    prerequisite_id INT NOT NULL COMMENT '선수 개념',
    importance ENUM('required', 'recommended', 'optional') DEFAULT 'recommended',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_prerequisite (concept_id, prerequisite_id),
    INDEX idx_concept (concept_id),
    INDEX idx_prerequisite (prerequisite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='개념 선수 학습 관계';

-- Moodle 동기화 로그 테이블
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('concepts', 'problems', 'students', 'progress') NOT NULL,
    status ENUM('started', 'completed', 'failed') NOT NULL,
    records_processed INT DEFAULT 0,
    error_message TEXT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 동기화 로그';

-- 샘플 데이터 삽입
INSERT INTO concepts (name, description, category, difficulty_level) VALUES
('분수의 개념', '분수의 기본 개념과 표현 방법', '수학-분수', 'beginner'),
('분수의 덧셈', '같은 분모를 가진 분수의 덧셈', '수학-분수', 'intermediate'),
('분수의 뺄셈', '같은 분모를 가진 분수의 뺄셈', '수학-분수', 'intermediate'),
('통분', '서로 다른 분모를 같게 만들기', '수학-분수', 'intermediate'),
('약분', '분수를 간단하게 만들기', '수학-분수', 'intermediate');

INSERT INTO problems (title, description, problem_type, difficulty_level, points) VALUES
('분수 기본 문제 1', '1/2은 무엇을 의미하나요?', 'multiple_choice', 'easy', 10),
('분수 덧셈 문제 1', '1/4 + 2/4 = ?', 'calculation', 'medium', 15),
('분수 뺄셈 문제 1', '3/5 - 1/5 = ?', 'calculation', 'medium', 15),
('통분 문제 1', '1/2와 1/3을 통분하세요', 'calculation', 'hard', 20),
('약분 문제 1', '4/8을 약분하세요', 'calculation', 'medium', 15);

INSERT INTO concept_problem_mapping (concept_id, problem_id, relevance_score, is_primary, mapping_type) VALUES
(1, 1, 1.00, TRUE, 'direct'),
(2, 2, 1.00, TRUE, 'direct'),
(3, 3, 1.00, TRUE, 'direct'),
(4, 4, 1.00, TRUE, 'direct'),
(5, 5, 1.00, TRUE, 'direct'),
(1, 2, 0.80, FALSE, 'prerequisite'),
(1, 3, 0.80, FALSE, 'prerequisite'),
(2, 4, 0.70, FALSE, 'related'),
(3, 4, 0.70, FALSE, 'related');

INSERT INTO concept_prerequisites (concept_id, prerequisite_id, importance) VALUES
(2, 1, 'required'),
(3, 1, 'required'),
(4, 2, 'recommended'),
(4, 3, 'recommended');
