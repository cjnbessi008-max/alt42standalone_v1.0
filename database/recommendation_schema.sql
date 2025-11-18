-- Recommendation System Schema Extension
-- AI-based Adaptive Learning & Question Recommendation
-- MySQL 5.7 Compatible

-- Student learning profiles
CREATE TABLE IF NOT EXISTS `student_profiles` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `moodle_user_id` INT(11) NOT NULL UNIQUE,
    `current_skill_level` DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Skill level 1.00-5.00',
    `preferred_difficulty` TINYINT(1) DEFAULT 2 COMMENT 'Preferred difficulty 1-5',
    `learning_pace` VARCHAR(20) DEFAULT 'medium' COMMENT 'slow, medium, fast',
    `total_questions_attempted` INT(11) DEFAULT 0,
    `total_correct_answers` INT(11) DEFAULT 0,
    `overall_accuracy_rate` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentage',
    `average_time_per_question` DECIMAL(8,2) DEFAULT 0.00 COMMENT 'Seconds',
    `strongest_shape_type` VARCHAR(50) DEFAULT NULL,
    `weakest_shape_type` VARCHAR(50) DEFAULT NULL,
    `last_activity_date` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`moodle_user_id`),
    KEY `idx_skill_level` (`current_skill_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning analytics tracking
CREATE TABLE IF NOT EXISTS `learning_analytics` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `student_profile_id` INT(11) NOT NULL,
    `moodle_user_id` INT(11) NOT NULL,
    `session_id` INT(11) NOT NULL,
    `question_id` INT(11) NOT NULL,
    `difficulty_level` TINYINT(1) NOT NULL,
    `shape_type` VARCHAR(50) NOT NULL,
    `was_correct` TINYINT(1) NOT NULL,
    `time_spent_seconds` INT(11) NOT NULL,
    `hints_used` TINYINT(2) DEFAULT 0,
    `dot_placement_efficiency` DECIMAL(5,2) DEFAULT NULL COMMENT 'Accuracy of dot placement',
    `attempt_number` TINYINT(2) DEFAULT 1,
    `confidence_score` DECIMAL(3,2) DEFAULT NULL COMMENT 'Student self-reported confidence',
    `analyzed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_student_profile` (`student_profile_id`),
    KEY `idx_user_id` (`moodle_user_id`),
    KEY `idx_question_id` (`question_id`),
    KEY `idx_difficulty` (`difficulty_level`),
    KEY `idx_shape_type` (`shape_type`),
    CONSTRAINT `fk_analytics_profile` FOREIGN KEY (`student_profile_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_analytics_session` FOREIGN KEY (`session_id`) REFERENCES `sessions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_analytics_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Question recommendations history
CREATE TABLE IF NOT EXISTS `question_recommendations` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `student_profile_id` INT(11) NOT NULL,
    `moodle_user_id` INT(11) NOT NULL,
    `question_id` INT(11) NOT NULL,
    `recommended_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `recommendation_reason` VARCHAR(100) DEFAULT NULL COMMENT 'Why this question was recommended',
    `recommendation_algorithm` VARCHAR(50) DEFAULT 'adaptive' COMMENT 'Algorithm used',
    `predicted_success_rate` DECIMAL(5,2) DEFAULT NULL COMMENT 'Predicted probability of success',
    `actual_success` TINYINT(1) DEFAULT NULL COMMENT 'Was student successful?',
    `was_presented` TINYINT(1) DEFAULT 1,
    `was_attempted` TINYINT(1) DEFAULT 0,
    `feedback_score` TINYINT(1) DEFAULT NULL COMMENT 'Student feedback 1-5',
    PRIMARY KEY (`id`),
    KEY `idx_student_profile` (`student_profile_id`),
    KEY `idx_user_id` (`moodle_user_id`),
    KEY `idx_question_id` (`question_id`),
    KEY `idx_recommended_at` (`recommended_at`),
    CONSTRAINT `fk_recommendations_profile` FOREIGN KEY (`student_profile_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_recommendations_question` FOREIGN KEY (`question_id`) REFERENCES `questions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Skill progression tracking
CREATE TABLE IF NOT EXISTS `skill_progression` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `student_profile_id` INT(11) NOT NULL,
    `moodle_user_id` INT(11) NOT NULL,
    `skill_name` VARCHAR(100) NOT NULL COMMENT 'e.g., rectangle_area, circle_area',
    `proficiency_level` DECIMAL(3,2) DEFAULT 1.00 COMMENT 'Skill level 1.00-5.00',
    `questions_attempted` INT(11) DEFAULT 0,
    `questions_mastered` INT(11) DEFAULT 0,
    `last_practiced` TIMESTAMP NULL DEFAULT NULL,
    `mastery_date` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_student_skill` (`student_profile_id`, `skill_name`),
    KEY `idx_user_id` (`moodle_user_id`),
    KEY `idx_skill_name` (`skill_name`),
    KEY `idx_proficiency` (`proficiency_level`),
    CONSTRAINT `fk_progression_profile` FOREIGN KEY (`student_profile_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collaborative filtering - Similar students
CREATE TABLE IF NOT EXISTS `student_similarity` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `student_profile_id` INT(11) NOT NULL,
    `similar_student_profile_id` INT(11) NOT NULL,
    `similarity_score` DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'Cosine similarity 0-1',
    `calculated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_similarity_pair` (`student_profile_id`, `similar_student_profile_id`),
    KEY `idx_similarity_score` (`similarity_score`),
    CONSTRAINT `fk_similarity_student1` FOREIGN KEY (`student_profile_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_similarity_student2` FOREIGN KEY (`similar_student_profile_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Learning goals and achievements
CREATE TABLE IF NOT EXISTS `learning_goals` (
    `id` INT(11) NOT NULL AUTO_INCREMENT,
    `student_profile_id` INT(11) NOT NULL,
    `goal_type` VARCHAR(50) NOT NULL COMMENT 'mastery, accuracy, speed, etc',
    `target_value` DECIMAL(10,2) NOT NULL,
    `current_value` DECIMAL(10,2) DEFAULT 0.00,
    `deadline` DATE DEFAULT NULL,
    `is_achieved` TINYINT(1) DEFAULT 0,
    `achieved_at` TIMESTAMP NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_student_profile` (`student_profile_id`),
    KEY `idx_goal_type` (`goal_type`),
    CONSTRAINT `fk_goals_profile` FOREIGN KEY (`student_profile_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for testing
INSERT INTO `student_profiles` (`moodle_user_id`, `current_skill_level`, `preferred_difficulty`) VALUES
(2, 2.5, 3),
(3, 1.8, 2),
(4, 3.2, 4);

-- Create indexes for performance
CREATE INDEX idx_analytics_date ON learning_analytics(analyzed_at);
CREATE INDEX idx_profile_activity ON student_profiles(last_activity_date);
CREATE INDEX idx_recommendations_presented ON question_recommendations(was_presented, was_attempted);

-- Views for quick analytics
CREATE OR REPLACE VIEW v_student_performance_summary AS
SELECT
    sp.id as profile_id,
    sp.moodle_user_id,
    sp.current_skill_level,
    sp.overall_accuracy_rate,
    sp.total_questions_attempted,
    sp.total_correct_answers,
    COUNT(DISTINCT la.shape_type) as shapes_practiced,
    AVG(la.time_spent_seconds) as avg_time,
    MAX(la.difficulty_level) as max_difficulty_attempted
FROM student_profiles sp
LEFT JOIN learning_analytics la ON sp.id = la.student_profile_id
GROUP BY sp.id;

-- Stored procedure for updating student profile
DELIMITER $$
CREATE PROCEDURE update_student_profile(
    IN p_user_id INT,
    IN p_question_id INT,
    IN p_was_correct TINYINT,
    IN p_time_spent INT,
    IN p_difficulty TINYINT,
    IN p_shape_type VARCHAR(50)
)
BEGIN
    DECLARE v_profile_id INT;
    DECLARE v_total_attempted INT;
    DECLARE v_total_correct INT;
    DECLARE v_new_skill_level DECIMAL(3,2);

    -- Get or create profile
    SELECT id INTO v_profile_id FROM student_profiles WHERE moodle_user_id = p_user_id;

    IF v_profile_id IS NULL THEN
        INSERT INTO student_profiles (moodle_user_id) VALUES (p_user_id);
        SET v_profile_id = LAST_INSERT_ID();
    END IF;

    -- Update counters
    UPDATE student_profiles
    SET
        total_questions_attempted = total_questions_attempted + 1,
        total_correct_answers = total_correct_answers + p_was_correct,
        last_activity_date = NOW()
    WHERE id = v_profile_id;

    -- Get updated values
    SELECT total_questions_attempted, total_correct_answers
    INTO v_total_attempted, v_total_correct
    FROM student_profiles
    WHERE id = v_profile_id;

    -- Calculate new accuracy rate
    UPDATE student_profiles
    SET overall_accuracy_rate = (v_total_correct * 100.0 / v_total_attempted)
    WHERE id = v_profile_id;

    -- Adjust skill level based on performance
    IF p_was_correct = 1 AND p_difficulty >= (SELECT current_skill_level FROM student_profiles WHERE id = v_profile_id) THEN
        UPDATE student_profiles
        SET current_skill_level = LEAST(5.0, current_skill_level + 0.1)
        WHERE id = v_profile_id;
    ELSEIF p_was_correct = 0 THEN
        UPDATE student_profiles
        SET current_skill_level = GREATEST(1.0, current_skill_level - 0.05)
        WHERE id = v_profile_id;
    END IF;

    -- Insert into learning analytics
    INSERT INTO learning_analytics (
        student_profile_id,
        moodle_user_id,
        session_id,
        question_id,
        difficulty_level,
        shape_type,
        was_correct,
        time_spent_seconds
    )
    SELECT
        v_profile_id,
        p_user_id,
        s.id,
        p_question_id,
        p_difficulty,
        p_shape_type,
        p_was_correct,
        p_time_spent
    FROM sessions s
    WHERE s.moodle_user_id = p_user_id
    AND s.is_active = 1
    ORDER BY s.started_at DESC
    LIMIT 1;

END$$
DELIMITER ;

-- Function to get recommended difficulty for student
DELIMITER $$
CREATE FUNCTION get_recommended_difficulty(p_user_id INT)
RETURNS TINYINT
DETERMINISTIC
BEGIN
    DECLARE v_skill_level DECIMAL(3,2);
    DECLARE v_accuracy DECIMAL(5,2);
    DECLARE v_recommended_difficulty TINYINT;

    SELECT current_skill_level, overall_accuracy_rate
    INTO v_skill_level, v_accuracy
    FROM student_profiles
    WHERE moodle_user_id = p_user_id;

    -- If no profile, return medium difficulty
    IF v_skill_level IS NULL THEN
        RETURN 2;
    END IF;

    -- Calculate recommended difficulty based on skill and accuracy
    IF v_accuracy >= 80 THEN
        -- Student is doing well, increase difficulty
        SET v_recommended_difficulty = LEAST(5, CEIL(v_skill_level) + 1);
    ELSEIF v_accuracy >= 60 THEN
        -- Student is average, maintain current level
        SET v_recommended_difficulty = ROUND(v_skill_level);
    ELSE
        -- Student is struggling, decrease difficulty
        SET v_recommended_difficulty = GREATEST(1, FLOOR(v_skill_level) - 1);
    END IF;

    RETURN v_recommended_difficulty;
END$$
DELIMITER ;
