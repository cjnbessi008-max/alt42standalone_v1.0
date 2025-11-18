-- Sample Quiz Data for Testing Data Shuffle Feature
-- MySQL 5.7 Compatible

-- ============================================
-- Sample Quiz Configuration
-- ============================================
INSERT INTO shuffle_config (quiz_id, shuffle_questions, shuffle_answers, seed_strategy, salt, enabled)
VALUES
    (101, TRUE, TRUE, 'combined', 'math_quiz_salt_2025', TRUE),
    (102, TRUE, FALSE, 'student_id', 'science_quiz_salt', TRUE),
    (103, FALSE, TRUE, 'combined', 'history_quiz_salt', TRUE)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- Sample Shuffle Seeds (for demo purposes)
-- ============================================
INSERT INTO shuffle_seeds (student_id, quiz_id, question_seed, answer_seed, session_id, expires_at)
VALUES
    (1001, 101, '5f7c8a9b1d3e4f2a6c8d9e0b1a2c3d4e', '9e0b1a2c3d4e5f7c8a9b1d3e4f2a6c8d', 'session_abc123', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
    (1002, 101, 'a1b2c3d4e5f6789012345678901234ab', 'f6789012345678901234aba1b2c3d4e5', 'session_def456', DATE_ADD(NOW(), INTERVAL 2 HOUR)),
    (1003, 102, 'c3d4e5f67890a1b2c3d4e5f67890a1b2', '67890a1b2c3d4e5f67890a1b2c3d4e5f6', 'session_ghi789', DATE_ADD(NOW(), INTERVAL 2 HOUR))
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

-- ============================================
-- Sample Shuffle History
-- ============================================
INSERT INTO shuffle_history (student_id, quiz_id, question_id, original_position, shuffled_position, answer_mapping)
VALUES
    -- Student 1001, Quiz 101
    (1001, 101, 5001, 1, 3, '{"A": 2, "B": 0, "C": 3, "D": 1}'),
    (1001, 101, 5002, 2, 1, '{"A": 1, "B": 3, "C": 0, "D": 2}'),
    (1001, 101, 5003, 3, 5, '{"A": 3, "B": 1, "C": 2, "D": 0}'),
    (1001, 101, 5004, 4, 2, '{"A": 0, "B": 2, "C": 1, "D": 3}'),
    (1001, 101, 5005, 5, 4, '{"A": 2, "B": 3, "C": 0, "D": 1}'),

    -- Student 1002, Quiz 101 (different shuffle)
    (1002, 101, 5001, 1, 2, '{"A": 1, "B": 2, "C": 0, "D": 3}'),
    (1002, 101, 5002, 2, 4, '{"A": 3, "B": 0, "C": 2, "D": 1}'),
    (1002, 101, 5003, 3, 1, '{"A": 0, "B": 3, "C": 1, "D": 2}'),
    (1002, 101, 5004, 4, 5, '{"A": 2, "B": 1, "C": 3, "D": 0}'),
    (1002, 101, 5005, 5, 3, '{"A": 1, "B": 0, "C": 2, "D": 3}');

-- ============================================
-- Sample Analytics Data
-- ============================================
INSERT INTO shuffle_analytics (event_type, quiz_id, student_id, execution_time_ms, memory_usage_mb, metadata)
VALUES
    ('shuffle_generated', 101, 1001, 45, 2.3, '{"questions_count": 5, "timestamp": "2025-11-18T10:00:00Z"}'),
    ('cache_hit', 101, 1001, 12, 0.5, '{"cached_at": "2025-11-18T10:00:00Z"}'),
    ('shuffle_generated', 101, 1002, 52, 2.5, '{"questions_count": 5, "timestamp": "2025-11-18T10:05:00Z"}'),
    ('api_call', 101, NULL, 180, 1.2, '{"endpoint": "/api/v1/quiz/101/shuffled", "method": "GET"}');

-- ============================================
-- Verification Queries
-- ============================================

-- Show all shuffle configurations
SELECT
    sc.quiz_id,
    sc.shuffle_questions,
    sc.shuffle_answers,
    sc.seed_strategy,
    sc.enabled,
    COUNT(DISTINCT ss.student_id) AS students_with_seeds
FROM shuffle_config sc
LEFT JOIN shuffle_seeds ss ON sc.quiz_id = ss.quiz_id
GROUP BY sc.quiz_id
ORDER BY sc.quiz_id;

-- Show shuffle seeds summary
SELECT
    quiz_id,
    COUNT(*) AS total_students,
    COUNT(DISTINCT session_id) AS unique_sessions,
    MIN(created_at) AS first_seed_created,
    MAX(created_at) AS last_seed_created
FROM shuffle_seeds
GROUP BY quiz_id;

-- Show shuffle history summary
SELECT
    student_id,
    quiz_id,
    COUNT(*) AS questions_shuffled,
    GROUP_CONCAT(shuffled_position ORDER BY original_position) AS shuffle_order
FROM shuffle_history
GROUP BY student_id, quiz_id
ORDER BY quiz_id, student_id;

-- Show analytics summary
SELECT
    event_type,
    COUNT(*) AS event_count,
    AVG(execution_time_ms) AS avg_execution_ms,
    AVG(memory_usage_mb) AS avg_memory_mb,
    MAX(execution_time_ms) AS max_execution_ms
FROM shuffle_analytics
GROUP BY event_type
ORDER BY event_count DESC;
