-- Weak Concept Link Detection System
-- Database Schema for MySQL 5.7

-- 개념(Concept) 테이블
CREATE TABLE IF NOT EXISTS concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    moodle_question_ids TEXT COMMENT 'JSON array of related Moodle question IDs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_concept_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 개념 간 연결 관계 테이블
CREATE TABLE IF NOT EXISTS concept_relations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    source_concept_id INT NOT NULL,
    target_concept_id INT NOT NULL,
    relation_type ENUM('prerequisite', 'related', 'similar', 'opposite') DEFAULT 'related',
    strength DECIMAL(5,2) DEFAULT 0.5 COMMENT 'Connection strength (0.0 to 1.0)',
    evidence_count INT DEFAULT 0 COMMENT 'Number of supporting data points',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (source_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (target_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_relation (source_concept_id, target_concept_id, relation_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 퀴즈 분석 결과 테이블
CREATE TABLE IF NOT EXISTS quiz_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_quiz_id INT NOT NULL,
    moodle_question_id INT NOT NULL,
    concept_id INT,
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    incorrect_attempts INT DEFAULT 0,
    accuracy_rate DECIMAL(5,2) DEFAULT 0.0 COMMENT 'Percentage (0.00 to 100.00)',
    avg_time_seconds INT DEFAULT 0,
    difficulty_score DECIMAL(5,2) DEFAULT 0.0 COMMENT 'Calculated difficulty (0.0 to 1.0)',
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL,
    INDEX idx_quiz_question (moodle_quiz_id, moodle_question_id),
    INDEX idx_concept (concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 약한 연결 지점 테이블
CREATE TABLE IF NOT EXISTS weak_links (
    id INT AUTO_INCREMENT PRIMARY KEY,
    relation_id INT NOT NULL,
    weakness_score DECIMAL(5,2) NOT NULL COMMENT 'How weak the link is (0.0 to 100.0)',
    weakness_type ENUM('low_accuracy', 'high_correlation', 'prerequisite_failure', 'concept_gap') NOT NULL,
    affected_students INT DEFAULT 0,
    evidence TEXT COMMENT 'JSON data with supporting evidence',
    recommendation TEXT COMMENT 'Suggested intervention',
    status ENUM('detected', 'reviewing', 'addressed', 'ignored') DEFAULT 'detected',
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (relation_id) REFERENCES concept_relations(id) ON DELETE CASCADE,
    INDEX idx_weakness_score (weakness_score DESC),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Moodle 동기화 로그 테이블
CREATE TABLE IF NOT EXISTS moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('quiz', 'question', 'attempt', 'full') NOT NULL,
    moodle_course_id INT,
    records_processed INT DEFAULT 0,
    records_success INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_log TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    status ENUM('running', 'completed', 'failed') DEFAULT 'running',
    INDEX idx_sync_status (status, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 학생 성과 패턴 테이블 (추가 분석용)
CREATE TABLE IF NOT EXISTS student_performance_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_student_id INT NOT NULL,
    concept_id INT NOT NULL,
    mastery_level DECIMAL(5,2) DEFAULT 0.0 COMMENT 'Mastery percentage (0.00 to 100.00)',
    attempts_count INT DEFAULT 0,
    last_attempt_date TIMESTAMP NULL,
    struggle_indicators TEXT COMMENT 'JSON data with struggle patterns',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_concept (moodle_student_id, concept_id),
    INDEX idx_mastery_level (mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 인덱스 최적화
CREATE INDEX idx_concepts_category ON concepts(category);
CREATE INDEX idx_relations_strength ON concept_relations(strength DESC);
CREATE INDEX idx_quiz_accuracy ON quiz_analysis(accuracy_rate ASC);

-- 초기 설정 데이터 삽입 (예시)
INSERT INTO concepts (name, description, category) VALUES
('분수 기본', '분수의 정의와 분자, 분모의 개념', '분수'),
('분수 덧셈', '같은 분모를 가진 분수의 덧셈', '분수'),
('분수 뺄셈', '같은 분모를 가진 분수의 뺄셈', '분수'),
('통분', '서로 다른 분모를 같게 만드는 과정', '분수'),
('약분', '분자와 분모를 공약수로 나누는 과정', '분수')
ON DUPLICATE KEY UPDATE name=name;

-- 개념 간 기본 관계 설정 (예시)
INSERT INTO concept_relations (source_concept_id, target_concept_id, relation_type, strength)
SELECT c1.id, c2.id, 'prerequisite', 0.9
FROM concepts c1, concepts c2
WHERE c1.name = '분수 기본' AND c2.name = '분수 덧셈'
ON DUPLICATE KEY UPDATE strength=0.9;

INSERT INTO concept_relations (source_concept_id, target_concept_id, relation_type, strength)
SELECT c1.id, c2.id, 'prerequisite', 0.9
FROM concepts c1, concepts c2
WHERE c1.name = '분수 기본' AND c2.name = '분수 뺄셈'
ON DUPLICATE KEY UPDATE strength=0.9;

INSERT INTO concept_relations (source_concept_id, target_concept_id, relation_type, strength)
SELECT c1.id, c2.id, 'prerequisite', 0.95
FROM concepts c1, concepts c2
WHERE c1.name = '통분' AND c2.name = '분수 덧셈'
ON DUPLICATE KEY UPDATE strength=0.95;
