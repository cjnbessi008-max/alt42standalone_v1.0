-- Case Timeline Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7, PHP 7.1.9

-- 케이스 정보 테이블
CREATE TABLE IF NOT EXISTS ct_cases (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_course_id INT NOT NULL,
    moodle_activity_id INT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'intermediate',
    total_duration INT COMMENT 'Expected completion time in minutes',
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    created_by INT NOT NULL COMMENT 'Moodle user ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 타임라인 이벤트 테이블
CREATE TABLE IF NOT EXISTS ct_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    event_order INT NOT NULL COMMENT 'Order in timeline',
    event_time VARCHAR(50) COMMENT 'Display time (e.g., "Day 1, 09:00" or "2 hours later")',
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    event_type ENUM('symptom', 'diagnosis', 'treatment', 'outcome', 'question', 'information') DEFAULT 'information',
    media_type ENUM('text', 'image', 'video', 'audio') DEFAULT 'text',
    media_url VARCHAR(500),
    is_interactive BOOLEAN DEFAULT FALSE,
    requires_response BOOLEAN DEFAULT FALSE,
    correct_response TEXT COMMENT 'For interactive events',
    feedback_correct TEXT,
    feedback_incorrect TEXT,
    points INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES ct_cases(id) ON DELETE CASCADE,
    INDEX idx_case_order (case_id, event_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 진행상황 테이블
CREATE TABLE IF NOT EXISTS ct_user_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    case_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    current_event_id INT,
    completed_events JSON COMMENT 'Array of completed event IDs',
    total_score INT DEFAULT 0,
    max_score INT DEFAULT 0,
    start_time TIMESTAMP NULL,
    completion_time TIMESTAMP NULL,
    status ENUM('not_started', 'in_progress', 'completed', 'paused') DEFAULT 'not_started',
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES ct_cases(id) ON DELETE CASCADE,
    FOREIGN KEY (current_event_id) REFERENCES ct_events(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_case (moodle_user_id, case_id),
    INDEX idx_user (moodle_user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 응답 테이블
CREATE TABLE IF NOT EXISTS ct_user_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    progress_id INT NOT NULL,
    event_id INT NOT NULL,
    response_data TEXT,
    is_correct BOOLEAN,
    points_earned INT DEFAULT 0,
    attempt_number INT DEFAULT 1,
    time_spent INT COMMENT 'Time spent in seconds',
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (progress_id) REFERENCES ct_user_progress(id) ON DELETE CASCADE,
    FOREIGN KEY (event_id) REFERENCES ct_events(id) ON DELETE CASCADE,
    INDEX idx_progress_event (progress_id, event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle 통합 설정 테이블
CREATE TABLE IF NOT EXISTS ct_moodle_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 설정 데이터
INSERT INTO ct_moodle_settings (setting_key, setting_value, description) VALUES
('moodle_url', '', 'Moodle installation URL'),
('api_token', '', 'Moodle web service token'),
('default_course_id', '0', 'Default course ID for new cases'),
('enable_grading', 'true', 'Enable automatic grading to Moodle gradebook'),
('max_attempts', '3', 'Maximum attempts for interactive events')
ON DUPLICATE KEY UPDATE setting_key=setting_key;

-- 샘플 데이터 (개발/테스트용)
INSERT INTO ct_cases (moodle_course_id, title, description, category, difficulty_level, total_duration, status, created_by) VALUES
(1, 'Acute Appendicitis Case', 'A 25-year-old patient presents with abdominal pain. Follow the diagnostic and treatment timeline.', 'Emergency Medicine', 'intermediate', 45, 'published', 1);

SET @case_id = LAST_INSERT_ID();

INSERT INTO ct_events (case_id, event_order, event_time, title, content, event_type, is_interactive, requires_response, points) VALUES
(@case_id, 1, 'Day 1, 08:00', 'Patient Arrival', 'A 25-year-old male arrives at the emergency department complaining of abdominal pain that started 6 hours ago.', 'symptom', FALSE, FALSE, 0),
(@case_id, 2, 'Day 1, 08:15', 'Initial Assessment', 'Vital signs: BP 130/85, HR 95, Temp 38.2°C, RR 18. Patient appears uncomfortable, guarding abdomen.', 'symptom', FALSE, FALSE, 0),
(@case_id, 3, 'Day 1, 08:30', 'Location of Pain', 'Where would you expect maximum tenderness in appendicitis?', 'question', TRUE, TRUE, 10),
(@case_id, 4, 'Day 1, 09:00', 'Laboratory Results', 'WBC: 15,000/μL (elevated), CRP: 8 mg/dL (elevated)', 'diagnosis', FALSE, FALSE, 0),
(@case_id, 5, 'Day 1, 09:30', 'Imaging Decision', 'CT scan shows enlarged appendix with periappendiceal fat stranding. Diagnosis: Acute appendicitis.', 'diagnosis', FALSE, FALSE, 0),
(@case_id, 6, 'Day 1, 10:00', 'Treatment Plan', 'What is the most appropriate next step?', 'question', TRUE, TRUE, 15),
(@case_id, 7, 'Day 1, 14:00', 'Surgical Intervention', 'Laparoscopic appendectomy performed successfully. Inflamed appendix removed.', 'treatment', FALSE, FALSE, 0),
(@case_id, 8, 'Day 3, 08:00', 'Post-operative Follow-up', 'Patient recovering well. Pain controlled, tolerating diet. Discharged home.', 'outcome', FALSE, FALSE, 0);
