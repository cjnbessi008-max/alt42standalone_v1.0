-- Instant Speed Ball - Database Schema
-- MySQL 5.7 Compatible

-- 문제 정보 테이블
CREATE TABLE IF NOT EXISTS `isb_problems` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL COMMENT '문제 제목',
  `description` TEXT COMMENT '문제 설명',
  `initial_position` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '초기 위치 (m)',
  `initial_velocity` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '초기 속도 (m/s)',
  `acceleration` DECIMAL(10,2) NOT NULL DEFAULT -9.8 COMMENT '가속도 (m/s²), 기본값은 중력',
  `simulation_duration` DECIMAL(10,2) NOT NULL DEFAULT 10.00 COMMENT '시뮬레이션 시간 (초)',
  `question_type` ENUM('velocity_at_time', 'position_at_time', 'free_observation') NOT NULL DEFAULT 'free_observation' COMMENT '질문 유형',
  `question_time` DECIMAL(10,2) NULL COMMENT '질문 시점 (초)',
  `correct_answer` DECIMAL(10,2) NULL COMMENT '정답',
  `tolerance` DECIMAL(10,2) DEFAULT 0.1 COMMENT '오차 허용 범위',
  `difficulty_level` TINYINT(1) DEFAULT 1 COMMENT '난이도 (1-5)',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_difficulty` (`difficulty_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='순간속도 문제 정보';

-- 학생 답안 기록 테이블
CREATE TABLE IF NOT EXISTS `isb_student_attempts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `problem_id` INT(11) NOT NULL,
  `student_id` INT(11) NOT NULL COMMENT 'Moodle 사용자 ID',
  `student_answer` DECIMAL(10,2) NULL COMMENT '학생 답안',
  `is_correct` TINYINT(1) DEFAULT 0 COMMENT '정답 여부',
  `time_spent` INT(11) NULL COMMENT '소요 시간 (초)',
  `attempt_count` INT(11) DEFAULT 1 COMMENT '시도 횟수',
  `attempted_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_problem` (`problem_id`),
  KEY `idx_student` (`student_id`),
  CONSTRAINT `fk_problem` FOREIGN KEY (`problem_id`) REFERENCES `isb_problems` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 답안 기록';

-- 샘플 문제 데이터 삽입
INSERT INTO `isb_problems`
  (`title`, `description`, `initial_position`, `initial_velocity`, `acceleration`, `simulation_duration`, `question_type`, `question_time`, `correct_answer`, `difficulty_level`)
VALUES
  ('자유낙하 - 기본', '높이 100m에서 공을 가만히 놓았을 때, 2초 후의 순간속도는?', 100.00, 0.00, -9.8, 10.00, 'velocity_at_time', 2.00, -19.60, 1),
  ('위로 던진 공', '지면에서 공을 20m/s의 속도로 위로 던졌을 때, 1초 후의 순간속도는?', 0.00, 20.00, -9.8, 10.00, 'velocity_at_time', 1.00, 10.20, 2),
  ('최고점에서의 속도', '지면에서 공을 15m/s의 속도로 위로 던졌을 때, 최고점(1.53초)에서의 순간속도는?', 0.00, 15.00, -9.8, 5.00, 'velocity_at_time', 1.53, 0.00, 3),
  ('아래로 던진 공', '높이 50m에서 공을 10m/s의 속도로 아래로 던졌을 때, 1초 후의 순간속도는?', 50.00, -10.00, -9.8, 5.00, 'velocity_at_time', 1.00, -19.80, 2),
  ('자유 관찰', '공의 운동을 관찰하고 순간변화율의 개념을 이해하세요.', 80.00, 5.00, -9.8, 10.00, 'free_observation', NULL, NULL, 1);
