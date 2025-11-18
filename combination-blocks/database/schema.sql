-- Combination Blocks Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7 integration

-- Table: combination_blocks
-- Stores the block problem definitions from Moodle
CREATE TABLE IF NOT EXISTS `combination_blocks` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `moodle_question_id` INT(11) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `target_combination` VARCHAR(100) NOT NULL COMMENT 'Target number or pattern to achieve',
  `difficulty_level` TINYINT(1) DEFAULT 1 COMMENT '1=Easy, 2=Medium, 3=Hard',
  `max_blocks` TINYINT(2) DEFAULT 10 COMMENT 'Maximum number of blocks allowed',
  `time_limit` INT(11) DEFAULT NULL COMMENT 'Time limit in seconds, NULL for no limit',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  INDEX `idx_moodle_question` (`moodle_question_id`),
  INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Main table for combination block problems';

-- Table: block_elements
-- Stores individual block elements that can be combined
CREATE TABLE IF NOT EXISTS `block_elements` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `combination_block_id` INT(11) NOT NULL,
  `element_type` VARCHAR(50) NOT NULL COMMENT 'number, operator, variable, etc.',
  `element_value` VARCHAR(100) NOT NULL,
  `display_text` VARCHAR(100) NOT NULL,
  `color_code` VARCHAR(7) DEFAULT '#3498db' COMMENT 'Hex color for visual display',
  `icon_url` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT(11) DEFAULT 0,
  `is_unlimited` TINYINT(1) DEFAULT 0 COMMENT 'Can be used unlimited times',
  `max_uses` INT(11) DEFAULT 1 COMMENT 'Max times this element can be used',
  PRIMARY KEY (`id`),
  FOREIGN KEY (`combination_block_id`) REFERENCES `combination_blocks`(`id`) ON DELETE CASCADE,
  INDEX `idx_combination_block` (`combination_block_id`),
  INDEX `idx_element_type` (`element_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Individual elements that make up blocks';

-- Table: student_attempts
-- Stores student attempts at solving combination blocks
CREATE TABLE IF NOT EXISTS `student_attempts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `combination_block_id` INT(11) NOT NULL,
  `moodle_user_id` INT(11) NOT NULL,
  `moodle_attempt_id` INT(11) DEFAULT NULL,
  `combination_data` JSON NOT NULL COMMENT 'JSON array of block IDs in order',
  `result_value` VARCHAR(100) DEFAULT NULL COMMENT 'Calculated result',
  `is_correct` TINYINT(1) DEFAULT 0,
  `time_spent` INT(11) DEFAULT NULL COMMENT 'Time spent in seconds',
  `score` DECIMAL(5,2) DEFAULT NULL,
  `feedback` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`combination_block_id`) REFERENCES `combination_blocks`(`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`moodle_user_id`),
  INDEX `idx_combination_block` (`combination_block_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student attempts and solutions';

-- Table: student_progress
-- Tracks overall progress per student per block
CREATE TABLE IF NOT EXISTS `student_progress` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `combination_block_id` INT(11) NOT NULL,
  `moodle_user_id` INT(11) NOT NULL,
  `attempts_count` INT(11) DEFAULT 0,
  `correct_attempts` INT(11) DEFAULT 0,
  `best_score` DECIMAL(5,2) DEFAULT NULL,
  `best_time` INT(11) DEFAULT NULL COMMENT 'Best time in seconds',
  `is_completed` TINYINT(1) DEFAULT 0,
  `first_attempt_at` TIMESTAMP NULL DEFAULT NULL,
  `last_attempt_at` TIMESTAMP NULL DEFAULT NULL,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_block` (`combination_block_id`, `moodle_user_id`),
  FOREIGN KEY (`combination_block_id`) REFERENCES `combination_blocks`(`id`) ON DELETE CASCADE,
  INDEX `idx_user` (`moodle_user_id`),
  INDEX `idx_completed` (`is_completed`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Overall student progress tracking';

-- Table: block_hints
-- Stores hints for combination blocks
CREATE TABLE IF NOT EXISTS `block_hints` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `combination_block_id` INT(11) NOT NULL,
  `hint_text` TEXT NOT NULL,
  `hint_level` TINYINT(1) DEFAULT 1 COMMENT '1=light hint, 2=medium, 3=strong hint',
  `sort_order` INT(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`combination_block_id`) REFERENCES `combination_blocks`(`id`) ON DELETE CASCADE,
  INDEX `idx_combination_block` (`combination_block_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Hints for helping students';

-- Table: block_solutions
-- Stores valid solutions for combination blocks
CREATE TABLE IF NOT EXISTS `block_solutions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `combination_block_id` INT(11) NOT NULL,
  `solution_data` JSON NOT NULL COMMENT 'JSON array of block IDs representing valid solution',
  `is_primary` TINYINT(1) DEFAULT 0 COMMENT 'Primary/recommended solution',
  `explanation` TEXT,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`combination_block_id`) REFERENCES `combination_blocks`(`id`) ON DELETE CASCADE,
  INDEX `idx_combination_block` (`combination_block_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Valid solutions for blocks';

-- Sample data for testing
INSERT INTO `combination_blocks` (`moodle_question_id`, `title`, `description`, `target_combination`, `difficulty_level`, `max_blocks`) VALUES
(1001, '숫자 10 만들기', '주어진 블록을 조합하여 10을 만드세요', '10', 1, 5),
(1002, '분수 1/2 만들기', '블록을 조합하여 1/2를 만드세요', '1/2', 2, 6);

-- Sample block elements for problem 1
INSERT INTO `block_elements` (`combination_block_id`, `element_type`, `element_value`, `display_text`, `color_code`, `is_unlimited`, `max_uses`) VALUES
(1, 'number', '5', '5', '#e74c3c', 1, 999),
(1, 'number', '3', '3', '#3498db', 1, 999),
(1, 'number', '2', '2', '#2ecc71', 1, 999),
(1, 'operator', '+', '+', '#f39c12', 1, 999),
(1, 'operator', '-', '-', '#9b59b6', 1, 999);

-- Sample hints
INSERT INTO `block_hints` (`combination_block_id`, `hint_text`, `hint_level`, `sort_order`) VALUES
(1, '5와 5를 더하면 어떻게 될까요?', 1, 1),
(1, '5 + 3 + 2 = ?', 2, 2),
(1, '정답: 5 + 5 또는 5 + 3 + 2', 3, 3);

-- Sample solution
INSERT INTO `block_solutions` (`combination_block_id`, `solution_data`, `is_primary`, `explanation`) VALUES
(1, '[1, 4, 1]', 1, '5 + 5 = 10'),
(1, '[1, 4, 2, 4, 3]', 0, '5 + 3 + 2 = 10');
