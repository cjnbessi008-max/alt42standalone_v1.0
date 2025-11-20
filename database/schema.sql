-- Math Concept Game System Database Schema
-- MySQL 5.7
-- Created: 2025-11-20

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS moodle_sync;
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS points_log;
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS student_cards;
DROP TABLE IF EXISTS concept_cards;
DROP TABLE IF EXISTS students;

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Students table
CREATE TABLE students (
    student_id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id INT UNIQUE, -- Link to Moodle user
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    grade_level INT, -- 1-6 for elementary
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Concept Cards Definition (12 games)
CREATE TABLE concept_cards (
    card_id INT PRIMARY KEY AUTO_INCREMENT,
    concept_name VARCHAR(50) NOT NULL UNIQUE, -- 'fractions', 'decimals', 'ratios', etc.
    spirit_name VARCHAR(100) NOT NULL, -- 'Frani the Slice Fairy'
    spirit_alias VARCHAR(100), -- Child-friendly description in Korean
    spirit_personality TEXT, -- Personality description for dialogue generation
    max_level INT DEFAULT 5,
    unlock_points_required INT DEFAULT 100,
    card_image_url VARCHAR(255),
    card_background_color VARCHAR(7) DEFAULT '#FFFFFF', -- Hex color
    description_text TEXT,
    game_folder VARCHAR(50), -- 'fractions', 'decimals', etc. (matches directory)
    display_order INT DEFAULT 0, -- Order in game selection menu
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_concept (concept_name),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student Card Collection (which cards students have collected)
CREATE TABLE student_cards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    card_id INT NOT NULL,
    current_level INT DEFAULT 1, -- 1-5 based on mastery
    acquired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP NULL,
    total_interactions INT DEFAULT 0, -- How many times played
    favorite BOOLEAN DEFAULT FALSE, -- Student can favorite cards
    FOREIGN KEY (card_id) REFERENCES concept_cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_card (student_id, card_id),
    INDEX idx_student_cards (student_id),
    INDEX idx_card_students (card_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Student Progress per Game (5-stage progression)
CREATE TABLE student_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    card_id INT NOT NULL,
    current_stage INT DEFAULT 1, -- Current unlocked stage (1-5)

    -- Individual stage completion
    stage_1_completed BOOLEAN DEFAULT FALSE, -- Sensation
    stage_1_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100
    stage_1_completed_at TIMESTAMP NULL,

    stage_2_completed BOOLEAN DEFAULT FALSE, -- Pattern Discovery
    stage_2_score DECIMAL(5,2) DEFAULT 0.00,
    stage_2_completed_at TIMESTAMP NULL,

    stage_3_completed BOOLEAN DEFAULT FALSE, -- Situational Response
    stage_3_score DECIMAL(5,2) DEFAULT 0.00,
    stage_3_completed_at TIMESTAMP NULL,

    stage_4_completed BOOLEAN DEFAULT FALSE, -- Simple Application
    stage_4_score DECIMAL(5,2) DEFAULT 0.00,
    stage_4_completed_at TIMESTAMP NULL,

    stage_5_completed BOOLEAN DEFAULT FALSE, -- Concept Card Acquired
    stage_5_score DECIMAL(5,2) DEFAULT 0.00,
    stage_5_completed_at TIMESTAMP NULL,

    total_points_earned INT DEFAULT 0,
    total_time_spent_seconds INT DEFAULT 0, -- Total time across all stages
    first_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_played_at TIMESTAMP NULL,

    FOREIGN KEY (card_id) REFERENCES concept_cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_game (student_id, card_id),
    INDEX idx_student_progress (student_id),
    INDEX idx_card_progress (card_id),
    INDEX idx_current_stage (student_id, current_stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Points Transaction Log (detailed points history)
CREATE TABLE points_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    card_id INT NOT NULL,
    points_earned INT NOT NULL, -- Can be negative for penalties (rare)
    stage_completed INT, -- 1-5, or NULL if just practice
    achievement_type VARCHAR(50), -- 'stage_completion', 'perfect_score', 'speed_bonus', 'retry_success'
    reason VARCHAR(255), -- 'Stage 2 completion', 'Perfect score bonus'
    session_id VARCHAR(64), -- Link to game session
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (card_id) REFERENCES concept_cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    INDEX idx_student_points (student_id, created_at),
    INDEX idx_card_points (card_id, created_at),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Game Sessions (for resuming and tracking active play)
CREATE TABLE game_sessions (
    session_id VARCHAR(64) PRIMARY KEY, -- UUID or hash
    student_id INT NOT NULL,
    card_id INT NOT NULL,
    current_stage INT NOT NULL, -- 1-5
    session_data JSON, -- Game-specific state (e.g., current problem, attempts)
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    device_info VARCHAR(255), -- Browser user agent
    FOREIGN KEY (card_id) REFERENCES concept_cards(card_id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    INDEX idx_student_sessions (student_id, is_completed),
    INDEX idx_active_sessions (is_completed, last_updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- MOODLE INTEGRATION
-- ============================================================================

-- Moodle Integration Sync (tracks triggering and completion)
CREATE TABLE moodle_sync (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    problem_type VARCHAR(50), -- Maps to concept_name (e.g., 'fractions')
    problem_id INT, -- Moodle question ID
    problem_url TEXT, -- Full URL to problem in Moodle
    game_triggered BOOLEAN DEFAULT FALSE,
    game_triggered_at TIMESTAMP NULL,
    session_id VARCHAR(64), -- Link to game_sessions
    completion_synced BOOLEAN DEFAULT FALSE,
    completion_score DECIMAL(5,2), -- Score sent back to Moodle
    synced_at TIMESTAMP NULL,
    sync_error TEXT, -- Error message if sync fails
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_problem_type (problem_type),
    INDEX idx_sync_status (completion_synced, created_at),
    INDEX idx_session_link (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- ANALYTICS & REPORTING (optional, for future dashboard)
-- ============================================================================

-- Daily Activity Summary (could be populated by scheduled job)
CREATE TABLE daily_activity (
    id INT PRIMARY KEY AUTO_INCREMENT,
    activity_date DATE NOT NULL,
    student_id INT NOT NULL,
    games_played INT DEFAULT 0,
    stages_completed INT DEFAULT 0,
    total_points_earned INT DEFAULT 0,
    total_time_spent_seconds INT DEFAULT 0,
    cards_unlocked INT DEFAULT 0,
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    UNIQUE KEY unique_daily_student (activity_date, student_id),
    INDEX idx_date_student (activity_date, student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- INITIAL DATA SEED
-- ============================================================================

-- Insert 12 Concept Cards
INSERT INTO concept_cards (concept_name, spirit_name, spirit_alias, spirit_personality, max_level, unlock_points_required, game_folder, display_order, card_background_color) VALUES
('fractions', 'Frani the Slice Fairy', '조각요정 프라니', 'Gentle and encouraging, loves fairness and equal sharing', 5, 100, 'fractions', 1, '#FFE5CC'),
('decimals', 'Coni the Coin Spirit', '동전정령 코니', 'Cheerful and energetic, loves shopping and money management', 5, 100, 'decimals', 2, '#FFE699'),
('ratios', 'Rio the Paint Spirit', '색물감 정령 리오', 'Artistic and creative, talks about beauty and balance', 5, 120, 'ratios', 3, '#CCDDFF'),
('geometry', 'Dimo the Shape Designer', '방 꾸미는 정령 디모', 'Organized and tidy, likes structure and spatial arrangement', 5, 120, 'geometry', 4, '#CCFFDD'),
('sequences', 'Roop the Rhythm Spirit', '리듬정령 루프', 'Musical and rhythmic, speaks in patterns and melodies', 5, 110, 'sequences', 5, '#FFCCEE'),
('division', 'Scoop the Ice Cream Ghost', '아이스크림 귀신 스쿱', 'Generous and caring, loves sharing and making everyone happy', 5, 100, 'division', 6, '#FFEEDD'),
('time', 'Timmy the Bus Spirit', '버스정령 티미', 'Punctual and helpful, always knows the schedule', 5, 100, 'time', 7, '#CCE5FF'),
('units', 'Packer the Backpack Spirit', '짐꾸리기 정령 팩커', 'Adventurous and practical, loves measuring and organizing', 5, 110, 'units', 8, '#DDFFCC'),
('probability', 'Fork the Choice Spirit', '선택정령 포크', 'Curious and questioning, explores all possibilities', 5, 130, 'probability', 9, '#FFDDCC'),
('graphs', 'Weathering the Temperature Spirit', '기온 정령 웨더링', 'Observant and thoughtful, notices patterns in nature', 5, 120, 'graphs', 10, '#E5CCFF'),
('wordproblems', 'Chatlin the Story Spirit', '스토리정령 챗린', 'Friendly and clarifying, breaks complex into simple', 5, 100, 'wordproblems', 11, '#FFFFCC'),
('logic', 'Order the Logic Spirit', '논리정령 오더', 'Wise and structured, loves organizing thoughts', 5, 130, 'logic', 12, '#FFCCDD');

-- Create sample student for testing
INSERT INTO students (moodle_user_id, username, full_name, grade_level, email) VALUES
(1001, 'test_student_1', '김민준', 3, 'minjun.kim@example.com'),
(1002, 'test_student_2', '이서연', 4, 'seoyeon.lee@example.com');

-- ============================================================================
-- VIEWS FOR CONVENIENT QUERIES
-- ============================================================================

-- View: Student Card Collection Summary
CREATE VIEW v_student_card_summary AS
SELECT
    s.student_id,
    s.full_name,
    s.grade_level,
    COUNT(sc.card_id) as total_cards_collected,
    SUM(sp.total_points_earned) as total_points,
    MAX(sc.last_interaction_at) as last_played_at
FROM students s
LEFT JOIN student_cards sc ON s.student_id = sc.student_id
LEFT JOIN student_progress sp ON s.student_id = sp.student_id
GROUP BY s.student_id, s.full_name, s.grade_level;

-- View: Game Completion Rates
CREATE VIEW v_game_completion_stats AS
SELECT
    cc.card_id,
    cc.concept_name,
    cc.spirit_name,
    COUNT(DISTINCT sp.student_id) as students_attempted,
    SUM(CASE WHEN sp.stage_1_completed THEN 1 ELSE 0 END) as stage_1_completions,
    SUM(CASE WHEN sp.stage_2_completed THEN 1 ELSE 0 END) as stage_2_completions,
    SUM(CASE WHEN sp.stage_3_completed THEN 1 ELSE 0 END) as stage_3_completions,
    SUM(CASE WHEN sp.stage_4_completed THEN 1 ELSE 0 END) as stage_4_completions,
    SUM(CASE WHEN sp.stage_5_completed THEN 1 ELSE 0 END) as stage_5_completions,
    AVG(sp.total_time_spent_seconds) as avg_time_spent_seconds
FROM concept_cards cc
LEFT JOIN student_progress sp ON cc.card_id = sp.card_id
GROUP BY cc.card_id, cc.concept_name, cc.spirit_name;

-- View: Recent Student Activity
CREATE VIEW v_recent_activity AS
SELECT
    pl.id,
    s.student_id,
    s.full_name,
    cc.spirit_name,
    pl.points_earned,
    pl.achievement_type,
    pl.reason,
    pl.created_at
FROM points_log pl
JOIN students s ON pl.student_id = s.student_id
JOIN concept_cards cc ON pl.card_id = cc.card_id
ORDER BY pl.created_at DESC
LIMIT 100;

-- ============================================================================
-- STORED PROCEDURES (Optional but useful)
-- ============================================================================

DELIMITER //

-- Procedure: Award points to student
CREATE PROCEDURE award_points(
    IN p_student_id INT,
    IN p_card_id INT,
    IN p_points INT,
    IN p_stage INT,
    IN p_achievement_type VARCHAR(50),
    IN p_reason VARCHAR(255),
    IN p_session_id VARCHAR(64)
)
BEGIN
    -- Insert points log
    INSERT INTO points_log (student_id, card_id, points_earned, stage_completed, achievement_type, reason, session_id)
    VALUES (p_student_id, p_card_id, p_points, p_stage, p_achievement_type, p_reason, p_session_id);

    -- Update total points in student_progress
    UPDATE student_progress
    SET total_points_earned = total_points_earned + p_points,
        last_played_at = NOW()
    WHERE student_id = p_student_id AND card_id = p_card_id;

    -- Check if card should be unlocked
    DECLARE points_threshold INT;
    SELECT unlock_points_required INTO points_threshold FROM concept_cards WHERE card_id = p_card_id;

    -- If student has enough points and doesn't have the card, create it
    INSERT IGNORE INTO student_cards (student_id, card_id, acquired_at)
    SELECT p_student_id, p_card_id, NOW()
    FROM student_progress
    WHERE student_id = p_student_id
      AND card_id = p_card_id
      AND total_points_earned >= points_threshold;
END//

-- Procedure: Complete a stage
CREATE PROCEDURE complete_stage(
    IN p_student_id INT,
    IN p_card_id INT,
    IN p_stage INT,
    IN p_score DECIMAL(5,2),
    IN p_time_spent INT
)
BEGIN
    -- Update the specific stage completion
    CASE p_stage
        WHEN 1 THEN
            UPDATE student_progress
            SET stage_1_completed = TRUE,
                stage_1_score = p_score,
                stage_1_completed_at = NOW(),
                current_stage = GREATEST(current_stage, 2),
                total_time_spent_seconds = total_time_spent_seconds + p_time_spent,
                last_played_at = NOW()
            WHERE student_id = p_student_id AND card_id = p_card_id;
        WHEN 2 THEN
            UPDATE student_progress
            SET stage_2_completed = TRUE,
                stage_2_score = p_score,
                stage_2_completed_at = NOW(),
                current_stage = GREATEST(current_stage, 3),
                total_time_spent_seconds = total_time_spent_seconds + p_time_spent,
                last_played_at = NOW()
            WHERE student_id = p_student_id AND card_id = p_card_id;
        WHEN 3 THEN
            UPDATE student_progress
            SET stage_3_completed = TRUE,
                stage_3_score = p_score,
                stage_3_completed_at = NOW(),
                current_stage = GREATEST(current_stage, 4),
                total_time_spent_seconds = total_time_spent_seconds + p_time_spent,
                last_played_at = NOW()
            WHERE student_id = p_student_id AND card_id = p_card_id;
        WHEN 4 THEN
            UPDATE student_progress
            SET stage_4_completed = TRUE,
                stage_4_score = p_score,
                stage_4_completed_at = NOW(),
                current_stage = GREATEST(current_stage, 5),
                total_time_spent_seconds = total_time_spent_seconds + p_time_spent,
                last_played_at = NOW()
            WHERE student_id = p_student_id AND card_id = p_card_id;
        WHEN 5 THEN
            UPDATE student_progress
            SET stage_5_completed = TRUE,
                stage_5_score = p_score,
                stage_5_completed_at = NOW(),
                total_time_spent_seconds = total_time_spent_seconds + p_time_spent,
                last_played_at = NOW()
            WHERE student_id = p_student_id AND card_id = p_card_id;
    END CASE;

    -- Award points based on score
    DECLARE points_to_award INT;
    SET points_to_award = FLOOR(p_score / 5); -- 1 point per 5% score

    CALL award_points(p_student_id, p_card_id, points_to_award, p_stage, 'stage_completion', CONCAT('Stage ', p_stage, ' completed'), NULL);
END//

DELIMITER ;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Additional composite indexes for common queries
CREATE INDEX idx_student_card_level ON student_cards(student_id, current_level);
CREATE INDEX idx_progress_stages ON student_progress(student_id, stage_1_completed, stage_2_completed, stage_3_completed, stage_4_completed, stage_5_completed);
CREATE INDEX idx_points_date_range ON points_log(student_id, created_at, points_earned);

-- ============================================================================
-- NOTES
-- ============================================================================

/*
USAGE NOTES:

1. To initialize a student's progress for a game:
   INSERT INTO student_progress (student_id, card_id, current_stage)
   VALUES (1, 1, 1);

2. To award points:
   CALL award_points(student_id, card_id, points, stage, 'achievement_type', 'reason', session_id);

3. To complete a stage:
   CALL complete_stage(student_id, card_id, stage_number, score, time_spent_seconds);

4. To get a student's card collection:
   SELECT * FROM v_student_card_summary WHERE student_id = ?;

5. To check game completion rates:
   SELECT * FROM v_game_completion_stats;

DEPLOYMENT:
mysql -u username -p database_name < schema.sql

BACKUP:
mysqldump -u username -p database_name > backup.sql

*/
