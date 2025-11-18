-- Vector Digest Database Schema
-- Compatible with MySQL 5.7
-- Prefix: mdl_ (Moodle standard)

-- Table for storing vector digests
CREATE TABLE IF NOT EXISTS `mdl_vector_digest` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `questionid` BIGINT(10) UNSIGNED NOT NULL,
  `courseid` BIGINT(10) UNSIGNED DEFAULT NULL,
  `quizid` BIGINT(10) UNSIGNED DEFAULT NULL,
  `digest_line1` VARCHAR(200) NOT NULL,
  `digest_line2` VARCHAR(200) NOT NULL,
  `digest_line3` VARCHAR(200) NOT NULL,
  `vector_concepts` TEXT DEFAULT NULL COMMENT 'JSON array of detected vector concepts',
  `confidence_score` DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Confidence in vector detection (0-1)',
  `language` VARCHAR(5) DEFAULT 'en' COMMENT 'ko for Korean, en for English',
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `timemodified` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mdl_vectdige_que_uix` (`questionid`),
  KEY `mdl_vectdige_cou_ix` (`courseid`),
  KEY `mdl_vectdige_qui_ix` (`quizid`),
  KEY `mdl_vectdige_tim_ix` (`timecreated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores 3-line vector concept summaries for questions';

-- Table for caching question analysis
CREATE TABLE IF NOT EXISTS `mdl_vector_digest_cache` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `questionid` BIGINT(10) UNSIGNED NOT NULL,
  `question_text` LONGTEXT NOT NULL,
  `has_vector_content` TINYINT(1) DEFAULT 0,
  `extracted_keywords` TEXT DEFAULT NULL COMMENT 'Comma-separated vector keywords found',
  `analysis_data` LONGTEXT DEFAULT NULL COMMENT 'JSON data from analysis',
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  `timeexpires` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mdl_vectdigecach_que_uix` (`questionid`),
  KEY `mdl_vectdigecach_exp_ix` (`timeexpires`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Cache for vector content analysis';

-- Table for tracking user interactions with vector digest
CREATE TABLE IF NOT EXISTS `mdl_vector_digest_log` (
  `id` BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `userid` BIGINT(10) UNSIGNED NOT NULL,
  `questionid` BIGINT(10) UNSIGNED NOT NULL,
  `digestid` BIGINT(10) UNSIGNED NOT NULL,
  `action` VARCHAR(50) NOT NULL COMMENT 'viewed, expanded, helpful, not_helpful',
  `duration` INT(10) UNSIGNED DEFAULT NULL COMMENT 'Time spent viewing in seconds',
  `timecreated` BIGINT(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`id`),
  KEY `mdl_vectdigelog_use_ix` (`userid`),
  KEY `mdl_vectdigelog_que_ix` (`questionid`),
  KEY `mdl_vectdigelog_dig_ix` (`digestid`),
  KEY `mdl_vectdigelog_tim_ix` (`timecreated`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Logs user interactions with vector digests';

-- Sample indexes for performance
CREATE INDEX mdl_vectdige_conf_ix ON mdl_vector_digest(confidence_score);
CREATE INDEX mdl_vectdige_lang_ix ON mdl_vector_digest(language);

-- Initial data: Example vector digest
INSERT INTO `mdl_vector_digest`
  (`questionid`, `courseid`, `quizid`, `digest_line1`, `digest_line2`, `digest_line3`,
   `vector_concepts`, `confidence_score`, `language`, `timecreated`, `timemodified`)
VALUES
  (1, 1, 1,
   '벡터는 크기와 방향을 모두 가진 물리량입니다.',
   '두 벡터의 합은 평행사변형 법칙 또는 삼각형 법칙으로 구합니다.',
   '내적은 스칼라, 외적은 벡터 결과를 생성합니다.',
   '["vector basics", "vector addition", "dot product", "cross product"]',
   0.95, 'ko', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
