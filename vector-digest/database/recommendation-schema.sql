-- Recommendation System Database Schema
-- Integrated with Vector Digest for personalized learning
-- Compatible with MySQL 5.7

-- ============================================================================
-- Student Learning Profile
-- ============================================================================
CREATE TABLE IF NOT EXISTS `mdl_recommend_student_profile` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `userid` BIGINT(10) UNSIGNED NOT NULL,
  `learning_style` VARCHAR(50) DEFAULT 'balanced' COMMENT 'visual, analytical, practical, balanced',
  `current_level` ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  `preferred_difficulty` DECIMAL(3,2) DEFAULT 0.50 COMMENT '0.0 (easiest) to 1.0 (hardest)',
  `study_pace` ENUM('slow', 'normal', 'fast') DEFAULT 'normal',
  `total_study_time` INT(10) UNSIGNED DEFAULT 0 COMMENT 'Total seconds spent studying',
  `total_problems_attempted` INT(10) UNSIGNED DEFAULT 0,
  `total_problems_correct` INT(10) UNSIGNED DEFAULT 0,
  `accuracy_rate` DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'Correct / Attempted',
  `average_problem_time` INT(10) UNSIGNED DEFAULT 0 COMMENT 'Average seconds per problem',
  `last_active` BIGINT(10) UNSIGNED DEFAULT 0,
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `timemodified` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mdl_recoStudProf_use_uix` (`userid`),
  KEY `mdl_recoStudProf_lev_ix` (`current_level`),
  KEY `mdl_recoStudProf_las_ix` (`last_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Student learning profiles for personalized recommendations';

-- ============================================================================
-- Concept Mastery Tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS `mdl_recommend_concept_mastery` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `userid` BIGINT(10) UNSIGNED NOT NULL,
  `concept` VARCHAR(50) NOT NULL COMMENT 'basics, addition, products, components, unit_vectors, applications',
  `mastery_score` DECIMAL(5,4) DEFAULT 0.0000 COMMENT '0.0 (not learned) to 1.0 (mastered)',
  `confidence_score` DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'How confident we are in this assessment',
  `problems_attempted` INT(10) UNSIGNED DEFAULT 0,
  `problems_correct` INT(10) UNSIGNED DEFAULT 0,
  `last_practiced` BIGINT(10) UNSIGNED DEFAULT 0,
  `times_reviewed` INT(10) UNSIGNED DEFAULT 0 COMMENT 'How many times reviewed this concept',
  `digest_views` INT(10) UNSIGNED DEFAULT 0 COMMENT 'Times viewed digest for this concept',
  `marked_helpful` INT(10) UNSIGNED DEFAULT 0 COMMENT 'Times marked digest as helpful',
  `needs_review` TINYINT(1) DEFAULT 0 COMMENT 'Flag for concepts needing review',
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `timemodified` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mdl_recoConcMast_useCon_uix` (`userid`, `concept`),
  KEY `mdl_recoConcMast_mas_ix` (`mastery_score`),
  KEY `mdl_recoConcMast_nee_ix` (`needs_review`),
  KEY `mdl_recoConcMast_las_ix` (`last_practiced`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks student mastery level for each vector concept';

-- ============================================================================
-- Learning History (Problem Attempts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `mdl_recommend_learning_history` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `userid` BIGINT(10) UNSIGNED NOT NULL,
  `questionid` BIGINT(10) UNSIGNED NOT NULL,
  `quizid` BIGINT(10) UNSIGNED DEFAULT NULL,
  `courseid` BIGINT(10) UNSIGNED DEFAULT NULL,
  `concepts_involved` TEXT DEFAULT NULL COMMENT 'JSON array of concepts in this problem',
  `difficulty` DECIMAL(3,2) DEFAULT 0.50 COMMENT 'Problem difficulty 0.0 to 1.0',
  `is_correct` TINYINT(1) DEFAULT 0,
  `score` DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Score received (0-100)',
  `time_spent` INT(10) UNSIGNED DEFAULT 0 COMMENT 'Seconds spent on this problem',
  `attempts_count` INT(5) UNSIGNED DEFAULT 1 COMMENT 'Number of attempts',
  `hints_used` INT(5) UNSIGNED DEFAULT 0,
  `digest_viewed` TINYINT(1) DEFAULT 0 COMMENT 'Whether student viewed digest',
  `digest_helpful` TINYINT(1) DEFAULT NULL COMMENT '1=helpful, 0=not helpful, NULL=no feedback',
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mdl_recoLearHist_use_ix` (`userid`),
  KEY `mdl_recoLearHist_que_ix` (`questionid`),
  KEY `mdl_recoLearHist_cor_ix` (`is_correct`),
  KEY `mdl_recoLearHist_tim_ix` (`timecreated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Complete learning history of student problem attempts';

-- ============================================================================
-- Recommendation History
-- ============================================================================
CREATE TABLE IF NOT EXISTS `mdl_recommend_history` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `userid` BIGINT(10) UNSIGNED NOT NULL,
  `recommendation_type` VARCHAR(50) NOT NULL COMMENT 'next_topic, review, practice, challenge',
  `recommended_item_type` VARCHAR(50) NOT NULL COMMENT 'question, quiz, concept, resource',
  `recommended_item_id` BIGINT(10) UNSIGNED DEFAULT NULL,
  `target_concept` VARCHAR(50) DEFAULT NULL COMMENT 'Which concept this recommendation targets',
  `reasoning` TEXT DEFAULT NULL COMMENT 'Why this was recommended',
  `algorithm_used` VARCHAR(50) DEFAULT NULL COMMENT 'Which recommendation algorithm',
  `confidence` DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'Confidence in this recommendation',
  `priority` INT(5) DEFAULT 5 COMMENT 'Priority 1-10, higher = more important',
  `was_viewed` TINYINT(1) DEFAULT 0,
  `was_accepted` TINYINT(1) DEFAULT 0 COMMENT 'Did student follow the recommendation',
  `was_helpful` TINYINT(1) DEFAULT NULL COMMENT 'Student feedback',
  `completion_time` INT(10) UNSIGNED DEFAULT NULL COMMENT 'Time to complete if accepted',
  `result_score` DECIMAL(5,2) DEFAULT NULL COMMENT 'Score if completed',
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `time_accepted` BIGINT(10) UNSIGNED DEFAULT NULL,
  `time_completed` BIGINT(10) UNSIGNED DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `mdl_recoHist_use_ix` (`userid`),
  KEY `mdl_recoHist_typ_ix` (`recommendation_type`),
  KEY `mdl_recoHist_acc_ix` (`was_accepted`),
  KEY `mdl_recoHist_tim_ix` (`timecreated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='History of all recommendations made to students';

-- ============================================================================
-- Resource Metadata (Questions, Quizzes, Learning Materials)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `mdl_recommend_resource_meta` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `resource_type` VARCHAR(50) NOT NULL COMMENT 'question, quiz, video, article, exercise',
  `resource_id` BIGINT(10) UNSIGNED NOT NULL,
  `title` VARCHAR(255) DEFAULT NULL,
  `concepts` TEXT DEFAULT NULL COMMENT 'JSON array of concepts covered',
  `difficulty` DECIMAL(3,2) DEFAULT 0.50 COMMENT '0.0 (easy) to 1.0 (hard)',
  `estimated_time` INT(10) UNSIGNED DEFAULT 0 COMMENT 'Estimated seconds to complete',
  `prerequisites` TEXT DEFAULT NULL COMMENT 'JSON array of prerequisite concepts',
  `tags` TEXT DEFAULT NULL COMMENT 'JSON array of tags',
  `quality_score` DECIMAL(5,4) DEFAULT 0.5000 COMMENT 'Quality rating 0-1',
  `popularity_score` DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'Based on usage',
  `success_rate` DECIMAL(5,4) DEFAULT 0.0000 COMMENT 'Average student success rate',
  `average_rating` DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Student ratings 0-5',
  `times_attempted` INT(10) UNSIGNED DEFAULT 0,
  `times_completed` INT(10) UNSIGNED DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `timemodified` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mdl_recoResoMeta_typId_uix` (`resource_type`, `resource_id`),
  KEY `mdl_recoResoMeta_dif_ix` (`difficulty`),
  KEY `mdl_recoResoMeta_qua_ix` (`quality_score`),
  KEY `mdl_recoResoMeta_pop_ix` (`popularity_score`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Metadata about learning resources for recommendation engine';

-- ============================================================================
-- Learning Path Templates
-- ============================================================================
CREATE TABLE IF NOT EXISTS `mdl_recommend_learning_path` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `path_name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `target_level` ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  `concepts_sequence` TEXT NOT NULL COMMENT 'JSON array of concepts in order',
  `estimated_duration` INT(10) UNSIGNED DEFAULT 0 COMMENT 'Estimated seconds',
  `is_default` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `success_rate` DECIMAL(5,4) DEFAULT 0.0000,
  `times_completed` INT(10) UNSIGNED DEFAULT 0,
  `created_by` BIGINT(10) UNSIGNED DEFAULT NULL,
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `timemodified` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mdl_recoLearPath_tar_ix` (`target_level`),
  KEY `mdl_recoLearPath_def_ix` (`is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Predefined learning paths for systematic concept mastery';

-- ============================================================================
-- Student Learning Path Progress
-- ============================================================================
CREATE TABLE IF NOT EXISTS `mdl_recommend_path_progress` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `userid` BIGINT(10) UNSIGNED NOT NULL,
  `path_id` BIGINT(10) UNSIGNED NOT NULL,
  `current_concept_index` INT(5) UNSIGNED DEFAULT 0,
  `concepts_completed` TEXT DEFAULT NULL COMMENT 'JSON array of completed concept indices',
  `overall_progress` DECIMAL(5,4) DEFAULT 0.0000 COMMENT '0.0 to 1.0',
  `started_at` BIGINT(10) UNSIGNED NOT NULL,
  `last_activity` BIGINT(10) UNSIGNED NOT NULL,
  `completed_at` BIGINT(10) UNSIGNED DEFAULT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mdl_recoPathProg_usePat_uix` (`userid`, `path_id`),
  KEY `mdl_recoPathProg_act_ix` (`is_active`),
  KEY `mdl_recoPathProg_las_ix` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks individual student progress through learning paths';

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

-- Composite indexes for common queries
CREATE INDEX mdl_recoConcMast_useNee_ix ON mdl_recommend_concept_mastery(userid, needs_review);
CREATE INDEX mdl_recoLearHist_useCor_ix ON mdl_recommend_learning_history(userid, is_correct);
CREATE INDEX mdl_recoHist_useTyp_ix ON mdl_recommend_history(userid, recommendation_type);

-- ============================================================================
-- Sample Data: Default Learning Paths
-- ============================================================================

-- Beginner Path: Vector Fundamentals
INSERT INTO `mdl_recommend_learning_path`
  (`path_name`, `description`, `target_level`, `concepts_sequence`, `estimated_duration`,
   `is_default`, `is_active`, `timecreated`, `timemodified`)
VALUES
  ('벡터 기초 완성',
   '벡터의 기본 개념부터 단계적으로 학습하는 초보자용 경로',
   'beginner',
   '["basics", "components", "addition", "unit_vectors"]',
   7200, -- 2 hours
   1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- Intermediate Path: Vector Operations
INSERT INTO `mdl_recommend_learning_path`
  (`path_name`, `description`, `target_level`, `concepts_sequence`, `estimated_duration`,
   `is_default`, `is_active`, `timecreated`, `timemodified`)
VALUES
  ('벡터 연산 마스터',
   '벡터의 다양한 연산을 학습하는 중급 경로',
   'intermediate',
   '["addition", "products", "components", "applications"]',
   10800, -- 3 hours
   1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- Advanced Path: Vector Applications
INSERT INTO `mdl_recommend_learning_path`
  (`path_name`, `description`, `target_level`, `concepts_sequence`, `estimated_duration`,
   `is_default`, `is_active`, `timecreated`, `timemodified`)
VALUES
  ('벡터 응용 심화',
   '물리학 및 공학에서의 벡터 응용을 다루는 고급 경로',
   'advanced',
   '["applications", "products", "components", "unit_vectors"]',
   14400, -- 4 hours
   1, 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

-- ============================================================================
-- Views for Easy Querying
-- ============================================================================

-- Student Overview (current status and recommendations needed)
CREATE OR REPLACE VIEW v_student_recommendation_overview AS
SELECT
    sp.userid,
    sp.current_level,
    sp.accuracy_rate,
    sp.total_problems_attempted,
    COUNT(DISTINCT cm.concept) as concepts_studied,
    AVG(cm.mastery_score) as average_mastery,
    SUM(CASE WHEN cm.needs_review = 1 THEN 1 ELSE 0 END) as concepts_needing_review,
    MAX(sp.last_active) as last_active
FROM mdl_recommend_student_profile sp
LEFT JOIN mdl_recommend_concept_mastery cm ON sp.userid = cm.userid
GROUP BY sp.userid;

-- Recent Learning Activity
CREATE OR REPLACE VIEW v_recent_learning_activity AS
SELECT
    lh.userid,
    lh.questionid,
    lh.concepts_involved,
    lh.is_correct,
    lh.time_spent,
    lh.digest_viewed,
    lh.timecreated
FROM mdl_recommend_learning_history lh
WHERE lh.timecreated > (UNIX_TIMESTAMP() - 604800) -- Last 7 days
ORDER BY lh.timecreated DESC;
