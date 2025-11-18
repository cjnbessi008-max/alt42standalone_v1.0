/**
 * Variance Vibration Database Schema
 * MySQL 5.7 Compatible Schema for Variance Vibration Feature
 * Compatible with Moodle 3.7 Integration
 */

-- Drop existing tables if they exist
DROP TABLE IF EXISTS variance_submissions;
DROP TABLE IF EXISTS variance_problems;
DROP TABLE IF EXISTS variance_vibration_settings;

-- Variance Problems Table
-- Stores variance calculation problems from Moodle or custom sources
CREATE TABLE variance_problems (
    id VARCHAR(36) PRIMARY KEY,
    moodle_question_id INT DEFAULT NULL,
    question_text TEXT NOT NULL,
    question_text_ko TEXT NOT NULL COMMENT 'Korean translation of question',
    data_set JSON NOT NULL COMMENT 'Array of numeric values for variance calculation',
    is_sample BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'TRUE for sample variance (n-1), FALSE for population (n)',
    expected_variance DECIMAL(15, 6) NOT NULL,
    expected_std_dev DECIMAL(15, 6) NOT NULL,
    mean_value DECIMAL(15, 6) NOT NULL,
    data_count INT NOT NULL,
    min_value DECIMAL(15, 6) NOT NULL,
    max_value DECIMAL(15, 6) NOT NULL,
    range_value DECIMAL(15, 6) NOT NULL,
    hints JSON DEFAULT NULL COMMENT 'Array of hint strings in English',
    hints_ko JSON DEFAULT NULL COMMENT 'Array of hint strings in Korean',
    category VARCHAR(100) NOT NULL DEFAULT 'basic_statistics',
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    grade_level VARCHAR(50) DEFAULT NULL COMMENT 'elementary, middle, high, college',
    tags JSON DEFAULT NULL COMMENT 'Array of tag strings for search/filtering',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT NULL,

    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Variance calculation problems for educational platform';

-- Variance Submissions Table
-- Tracks student answers and vibration feedback
CREATE TABLE variance_submissions (
    id VARCHAR(36) PRIMARY KEY,
    problem_id VARCHAR(36) NOT NULL,
    student_id VARCHAR(100) NOT NULL COMMENT 'User ID from Moodle or system',
    moodle_user_id INT DEFAULT NULL,
    submitted_answer DECIMAL(15, 6) NOT NULL,
    is_correct BOOLEAN NOT NULL,
    actual_variance DECIMAL(15, 6) NOT NULL,
    percent_error DECIMAL(8, 4) NOT NULL COMMENT 'Percentage error (0-100)',
    vibration_intensity INT NOT NULL COMMENT 'Vibration intensity (1-10)',
    vibration_pattern JSON NOT NULL COMMENT 'Array of vibration pulse durations in ms',
    vibration_triggered BOOLEAN NOT NULL DEFAULT FALSE,
    time_spent_seconds INT NOT NULL COMMENT 'Time spent on problem in seconds',
    attempt_number INT NOT NULL DEFAULT 1,
    device_info JSON DEFAULT NULL COMMENT 'Device type, browser, vibration support',
    ip_address VARCHAR(45) DEFAULT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES variance_problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_correct (is_correct),
    INDEX idx_student_problem (student_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student submissions for variance problems with vibration feedback';

-- Variance Vibration Settings Table
-- Module-level configuration for vibration behavior
CREATE TABLE variance_vibration_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value JSON NOT NULL,
    description TEXT DEFAULT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT NULL,

    INDEX idx_key (setting_key),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration settings for variance vibration feature';

-- Insert default settings
INSERT INTO variance_vibration_settings (setting_key, setting_value, description) VALUES
('default_vibration_config', JSON_OBJECT(
    'min_intensity', 1,
    'max_intensity', 10,
    'variance_threshold', 100.0,
    'use_normalized_variance', true,
    'vibration_enabled', true,
    'pattern_type', 'progressive',
    'debounce_ms', 300
), 'Default vibration configuration'),

('tolerance_settings', JSON_OBJECT(
    'easy', 0.15,
    'medium', 0.10,
    'hard', 0.05
), 'Answer tolerance by difficulty level (percentage)'),

('vibration_patterns', JSON_OBJECT(
    'success', JSON_ARRAY(200),
    'error', JSON_ARRAY(100, 50, 100, 50, 100),
    'continuous', JSON_ARRAY(200),
    'pulsed', JSON_ARRAY(100, 50, 100, 50, 100),
    'progressive', JSON_ARRAY(50, 30, 75, 30, 100, 30, 125, 30, 150)
), 'Predefined vibration patterns'),

('display_settings', JSON_OBJECT(
    'show_stats', true,
    'auto_vibrate', true,
    'show_hints', true,
    'show_visualization', true,
    'language', 'ko'
), 'UI display settings for variance vibration component');

-- Sample variance problems for testing
INSERT INTO variance_problems (
    id, question_text, question_text_ko, data_set, is_sample,
    expected_variance, expected_std_dev, mean_value, data_count,
    min_value, max_value, range_value, hints, hints_ko,
    category, difficulty, grade_level
) VALUES
(
    'sample_001',
    'Calculate the sample variance of the following test scores:',
    '다음 시험 점수의 표본 분산을 계산하세요:',
    JSON_ARRAY(85, 90, 78, 92, 88, 85, 95, 82),
    TRUE,
    32.8571,
    5.7324,
    86.875,
    8,
    78,
    95,
    17,
    JSON_ARRAY(
        'First, calculate the mean of all test scores',
        'Subtract the mean from each score and square the result',
        'Sum all squared differences',
        'Divide by (n-1) = 7 for sample variance'
    ),
    JSON_ARRAY(
        '먼저 모든 시험 점수의 평균을 계산하세요',
        '각 점수에서 평균을 빼고 결과를 제곱하세요',
        '모든 제곱 차이의 합을 구하세요',
        '표본 분산을 위해 (n-1) = 7로 나누세요'
    ),
    'test_scores',
    'easy',
    'middle'
),
(
    'sample_002',
    'A company recorded daily sales (in thousands): Calculate the population variance:',
    '회사가 일일 매출(천 단위)을 기록했습니다: 모집단 분산을 계산하세요:',
    JSON_ARRAY(45.5, 52.3, 48.7, 51.2, 49.8, 47.3, 53.1, 46.9),
    FALSE,
    5.7481,
    2.3975,
    49.35,
    8,
    45.5,
    53.1,
    7.6,
    JSON_ARRAY(
        'Calculate the mean of all daily sales',
        'Find squared deviations from the mean',
        'Use population variance formula (divide by n, not n-1)'
    ),
    JSON_ARRAY(
        '모든 일일 매출의 평균을 계산하세요',
        '평균으로부터의 제곱 편차를 구하세요',
        '모집단 분산 공식을 사용하세요 (n-1이 아닌 n으로 나누세요)'
    ),
    'business_data',
    'medium',
    'high'
),
(
    'sample_003',
    'Heights of basketball players (in cm): Find the sample variance:',
    '농구 선수들의 키(cm): 표본 분산을 구하세요:',
    JSON_ARRAY(188, 195, 183, 191, 187, 192, 189, 194, 186, 190),
    TRUE,
    14.4889,
    3.8064,
    189.5,
    10,
    183,
    195,
    12,
    JSON_ARRAY(
        'This is a sample of players, not the entire population',
        'Mean height is around 189-190 cm',
        'Use n-1 in denominator for unbiased estimate'
    ),
    JSON_ARRAY(
        '이것은 전체 모집단이 아닌 선수들의 표본입니다',
        '평균 키는 약 189-190 cm입니다',
        '불편 추정량을 위해 분모에 n-1을 사용하세요'
    ),
    'sports_statistics',
    'medium',
    'high'
),
(
    'sample_004',
    'Temperature readings (°C) for a week: Calculate sample variance:',
    '일주일 동안의 온도 측정값(°C): 표본 분산을 계산하세요:',
    JSON_ARRAY(22.5, 24.1, 23.8, 21.9, 25.3, 23.2, 24.7),
    TRUE,
    1.5919,
    1.2617,
    23.6429,
    7,
    21.9,
    25.3,
    3.4,
    JSON_ARRAY(
        'Calculate mean temperature first',
        'Small dataset (n=7), so use sample variance',
        'Temperature varies about 1.6 degrees squared'
    ),
    JSON_ARRAY(
        '먼저 평균 온도를 계산하세요',
        '작은 데이터셋(n=7)이므로 표본 분산을 사용하세요',
        '온도는 약 1.6도 제곱만큼 변합니다'
    ),
    'weather_data',
    'easy',
    'middle'
),
(
    'sample_005',
    'Stock price changes (%): Find the population variance:',
    '주가 변동률(%): 모집단 분산을 구하세요:',
    JSON_ARRAY(2.3, -1.5, 3.8, 0.7, -2.1, 1.9, -0.8, 2.5, 1.2, -1.3, 3.2, 0.4),
    FALSE,
    3.8256,
    1.9559,
    0.8583,
    12,
    -2.1,
    3.8,
    5.9,
    JSON_ARRAY(
        'These are the complete set of changes for the period',
        'Use population variance (divide by n)',
        'Notice both positive and negative values'
    ),
    JSON_ARRAY(
        '이것은 기간 동안의 완전한 변동 집합입니다',
        '모집단 분산을 사용하세요 (n으로 나누세요)',
        '양수와 음수 값이 모두 있음을 주목하세요'
    ),
    'financial_data',
    'hard',
    'college'
);

-- Create view for variance statistics summary
CREATE OR REPLACE VIEW variance_problem_stats AS
SELECT
    vp.id,
    vp.category,
    vp.difficulty,
    vp.is_sample,
    COUNT(vs.id) AS total_submissions,
    SUM(CASE WHEN vs.is_correct THEN 1 ELSE 0 END) AS correct_submissions,
    ROUND(SUM(CASE WHEN vs.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(vs.id), 2) AS success_rate,
    AVG(vs.percent_error) AS avg_percent_error,
    AVG(vs.time_spent_seconds) AS avg_time_spent,
    AVG(vs.vibration_intensity) AS avg_vibration_intensity,
    COUNT(DISTINCT vs.student_id) AS unique_students
FROM variance_problems vp
LEFT JOIN variance_submissions vs ON vp.id = vs.problem_id
WHERE vp.is_active = TRUE
GROUP BY vp.id, vp.category, vp.difficulty, vp.is_sample;

-- Create view for student performance
CREATE OR REPLACE VIEW student_variance_performance AS
SELECT
    vs.student_id,
    COUNT(DISTINCT vs.problem_id) AS problems_attempted,
    COUNT(vs.id) AS total_attempts,
    SUM(CASE WHEN vs.is_correct THEN 1 ELSE 0 END) AS correct_attempts,
    ROUND(SUM(CASE WHEN vs.is_correct THEN 1 ELSE 0 END) * 100.0 / COUNT(vs.id), 2) AS accuracy_rate,
    AVG(vs.percent_error) AS avg_error,
    AVG(vs.time_spent_seconds) AS avg_time_per_problem,
    MIN(vs.submitted_at) AS first_attempt,
    MAX(vs.submitted_at) AS last_attempt
FROM variance_submissions vs
GROUP BY vs.student_id;

-- Create indexes for views
CREATE INDEX idx_vs_problem_correct ON variance_submissions(problem_id, is_correct);
CREATE INDEX idx_vs_student_submitted ON variance_submissions(student_id, submitted_at);

-- Add comments for MySQL 5.7 compatibility
ALTER TABLE variance_problems COMMENT = 'Variance problems compatible with MySQL 5.7 and Moodle 3.7';
ALTER TABLE variance_submissions COMMENT = 'Student submissions with vibration feedback tracking';
ALTER TABLE variance_vibration_settings COMMENT = 'Configuration for variance vibration feature';

-- Success message
SELECT 'Variance Vibration database schema created successfully!' AS status;
SELECT 'Sample problems inserted for testing' AS info;
SELECT COUNT(*) AS sample_problem_count FROM variance_problems;
SELECT COUNT(*) AS setting_count FROM variance_vibration_settings;
