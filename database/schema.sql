-- Explosion Count Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7

-- 문제 정보 테이블
CREATE TABLE IF NOT EXISTS `explosion_problems` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `moodle_question_id` INT(11) DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `initial_count` INT(11) DEFAULT 1,
  `max_count` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_moodle_question` (`moodle_question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 경우의 수 증가 단계 테이블
CREATE TABLE IF NOT EXISTS `explosion_steps` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `problem_id` INT(11) NOT NULL,
  `step_number` INT(11) NOT NULL,
  `step_name` VARCHAR(255) NOT NULL,
  `multiplier` DECIMAL(10,2) NOT NULL DEFAULT 1.00,
  `count_increase` INT(11) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_problem` (`problem_id`),
  CONSTRAINT `fk_steps_problem` FOREIGN KEY (`problem_id`)
    REFERENCES `explosion_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사용자 세션 테이블
CREATE TABLE IF NOT EXISTS `explosion_sessions` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `moodle_user_id` INT(11) DEFAULT NULL,
  `problem_id` INT(11) NOT NULL,
  `current_step` INT(11) DEFAULT 0,
  `current_count` INT(11) DEFAULT 1,
  `max_count_reached` INT(11) DEFAULT 1,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `completed_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_problem` (`moodle_user_id`, `problem_id`),
  KEY `idx_problem` (`problem_id`),
  CONSTRAINT `fk_sessions_problem` FOREIGN KEY (`problem_id`)
    REFERENCES `explosion_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 애니메이션 설정 테이블
CREATE TABLE IF NOT EXISTS `explosion_animations` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `problem_id` INT(11) NOT NULL,
  `animation_type` ENUM('fire', 'spark', 'burst', 'wave') DEFAULT 'fire',
  `color_scheme` VARCHAR(50) DEFAULT 'red-orange',
  `speed` DECIMAL(3,2) DEFAULT 1.00,
  `intensity` DECIMAL(3,2) DEFAULT 1.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_problem_unique` (`problem_id`),
  CONSTRAINT `fk_animations_problem` FOREIGN KEY (`problem_id`)
    REFERENCES `explosion_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 샘플 데이터 삽입
INSERT INTO `explosion_problems` (`id`, `title`, `description`, `initial_count`, `max_count`) VALUES
(1, '조합 문제: 피자 토핑 선택', '5가지 토핑 중에서 선택할 수 있는 경우의 수', 1, 32),
(2, '순열 문제: 자리 배치', '5명을 한 줄로 세우는 경우의 수', 1, 120),
(3, '확률 문제: 주사위 던지기', '주사위를 여러 번 던질 때의 경우의 수', 1, 7776);

INSERT INTO `explosion_steps` (`problem_id`, `step_number`, `step_name`, `multiplier`, `count_increase`) VALUES
(1, 1, '첫 번째 토핑 선택', 2.00, 2),
(1, 2, '두 번째 토핑 선택', 2.00, 4),
(1, 3, '세 번째 토핑 선택', 2.00, 8),
(1, 4, '네 번째 토핑 선택', 2.00, 16),
(1, 5, '다섯 번째 토핑 선택', 2.00, 32),
(2, 1, '첫 번째 자리', 5.00, 5),
(2, 2, '두 번째 자리', 4.00, 20),
(2, 3, '세 번째 자리', 3.00, 60),
(2, 4, '네 번째 자리', 2.00, 120),
(3, 1, '첫 번째 던지기', 6.00, 6),
(3, 2, '두 번째 던지기', 6.00, 36),
(3, 3, '세 번째 던지기', 6.00, 216),
(3, 4, '네 번째 던지기', 6.00, 1296),
(3, 5, '다섯 번째 던지기', 6.00, 7776);

INSERT INTO `explosion_animations` (`problem_id`, `animation_type`, `color_scheme`, `speed`, `intensity`) VALUES
(1, 'fire', 'red-orange', 1.00, 1.20),
(2, 'burst', 'blue-purple', 1.50, 1.50),
(3, 'spark', 'yellow-white', 0.80, 1.00);
