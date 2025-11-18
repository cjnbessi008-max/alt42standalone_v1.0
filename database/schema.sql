-- Scale Sound 데이터베이스 스키마
-- MySQL 5.7

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS scale_sound
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE scale_sound;

-- 문제 테이블
CREATE TABLE IF NOT EXISTS problems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_id INT NULL COMMENT 'Moodle LMS 문제 ID',
  title VARCHAR(255) NOT NULL COMMENT '문제 제목',
  description TEXT COMMENT '문제 설명',
  original_shape JSON NOT NULL COMMENT '원본 도형 정보 (JSON)',
  scale_range_min DECIMAL(3, 2) DEFAULT 0.50 COMMENT '최소 배율',
  scale_range_max DECIMAL(3, 2) DEFAULT 3.00 COMMENT '최대 배율',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_id (moodle_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='수학 문제 테이블';

-- 학습 진행도 테이블
CREATE TABLE IF NOT EXISTS user_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT '사용자 ID',
  problem_id INT NOT NULL COMMENT '문제 ID',
  scale_value DECIMAL(3, 2) NOT NULL COMMENT '사용자가 설정한 배율',
  completed BOOLEAN DEFAULT FALSE COMMENT '완료 여부',
  score INT DEFAULT 0 COMMENT '점수 (0-100)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_problem_id (problem_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학습 진행도 테이블';

-- 사용자 테이블 (선택사항 - Moodle 사용자 정보 캐싱)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  moodle_user_id INT UNIQUE NOT NULL COMMENT 'Moodle 사용자 ID',
  username VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  full_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_moodle_user_id (moodle_user_id),
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='사용자 정보 캐시 테이블';

-- 시스템 설정 테이블
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='시스템 설정 테이블';
