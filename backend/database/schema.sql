-- Similarity Cards - Moodle Database Schema
-- MySQL 5.7, Moodle 3.7
--
-- Additional tables for triangle similarity learning module

-- Question metadata for similarity problems
CREATE TABLE IF NOT EXISTS mdl_question_similarity_meta (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id BIGINT(10) UNSIGNED NOT NULL,
    similarity_type VARCHAR(10) NOT NULL COMMENT 'AAA, SAS, SSS',
    difficulty VARCHAR(10) NOT NULL DEFAULT 'medium' COMMENT 'easy, medium, hard',
    triangle_data TEXT COMMENT 'JSON data for triangle properties',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_question_id (question_id),
    KEY idx_similarity_type (similarity_type),
    KEY idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Metadata for similarity questions';

-- Student attempt tracking
CREATE TABLE IF NOT EXISTS mdl_question_attempts (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id BIGINT(10) UNSIGNED NOT NULL,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    attempts INT(5) UNSIGNED NOT NULL DEFAULT 0,
    is_correct TINYINT(1) NOT NULL DEFAULT 0,
    time_spent INT(10) UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Time in seconds',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_question_student (question_id, student_id),
    KEY idx_student_id (student_id),
    KEY idx_is_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Student progress tracking';

-- Sample data for development
INSERT INTO mdl_question_similarity_meta (question_id, similarity_type, difficulty, triangle_data) VALUES
(101, 'AAA', 'easy', '{"triangle1":{"angles":[60,70,50]},"triangle2":{"angles":[60,70,50]}}'),
(102, 'SAS', 'medium', '{"triangle1":{"sides":[6,8],"angles":[60]},"triangle2":{"sides":[3,4],"angles":[60]}}'),
(103, 'SSS', 'hard', '{"triangle1":{"sides":[6,8,10]},"triangle2":{"sides":[3,4,5]}}')
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- Sample questions (assuming mdl_question table exists in Moodle)
-- Note: This is a simplified version. Actual Moodle question structure is more complex.
--
-- INSERT INTO mdl_question (id, category, name, questiontext, qtype) VALUES
-- (101, 1, '삼각형 닮음 - AAA 조건', '두 삼각형의 세 각이 각각 60°, 70°, 50°입니다. 이 두 삼각형은 닮음입니까?', 'similarity'),
-- (102, 1, '삼각형 닮음 - SAS 조건', '삼각형 ABC와 DEF에서 AB=6cm, AC=8cm, DE=3cm, DF=4cm이고 ∠A=∠D=60°일 때 닮음입니까?', 'similarity'),
-- (103, 1, '삼각형 닮음 - SSS 조건', '삼각형 ABC의 세 변이 6cm, 8cm, 10cm이고 삼각형 DEF의 세 변이 3cm, 4cm, 5cm일 때 닮음입니까?', 'similarity');

-- Indexes for performance
CREATE INDEX idx_created_at ON mdl_question_similarity_meta(created_at);
CREATE INDEX idx_updated_at ON mdl_question_attempts(updated_at);

-- Views for analytics
CREATE OR REPLACE VIEW v_similarity_stats AS
SELECT
    qm.similarity_type,
    qm.difficulty,
    COUNT(DISTINCT qa.student_id) as total_students,
    AVG(qa.attempts) as avg_attempts,
    SUM(qa.is_correct) as correct_count,
    COUNT(qa.id) as total_attempts,
    AVG(qa.time_spent) as avg_time_spent
FROM mdl_question_similarity_meta qm
LEFT JOIN mdl_question_attempts qa ON qm.question_id = qa.question_id
GROUP BY qm.similarity_type, qm.difficulty;

-- Grant permissions (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE ON mdl_question_similarity_meta TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON mdl_question_attempts TO 'moodle_user'@'localhost';
