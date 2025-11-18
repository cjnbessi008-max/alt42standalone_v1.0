-- ALT42 Standalone v1.0 Database Schema
-- MySQL 5.7 호환
-- Moodle 3.7 연동용 넓이 학습 앱

CREATE DATABASE IF NOT EXISTS alt42_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE alt42_db;

-- 문제 정보 테이블 (Moodle에서 가져온 문제)
CREATE TABLE IF NOT EXISTS questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL COMMENT 'Moodle 문제 ID',
    moodle_course_id INT NOT NULL COMMENT 'Moodle 과정 ID',
    question_type VARCHAR(50) NOT NULL COMMENT '문제 유형 (area_calculation 등)',
    question_data JSON COMMENT '문제 데이터 (도형 정보, 조건 등)',
    correct_answer DECIMAL(10, 2) COMMENT '정답 (넓이 값)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_moodle_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moodle 문제 정보';

-- 학생 응답 테이블
CREATE TABLE IF NOT EXISTS student_responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    question_id INT NOT NULL COMMENT '문제 ID',
    user_answer DECIMAL(10, 2) COMMENT '사용자 답변',
    is_correct TINYINT(1) DEFAULT 0 COMMENT '정답 여부',
    area_completed TINYINT(1) DEFAULT 0 COMMENT '넓이 완성 여부',
    chime_played TINYINT(1) DEFAULT 0 COMMENT '종소리 재생 여부',
    attempt_count INT DEFAULT 1 COMMENT '시도 횟수',
    time_spent INT DEFAULT 0 COMMENT '소요 시간 (초)',
    completed_at TIMESTAMP NULL COMMENT '완료 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_question (question_id),
    INDEX idx_area_completed (area_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 응답 기록';

-- 도형 그리기 진행 상황 테이블
CREATE TABLE IF NOT EXISTS area_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    response_id INT NOT NULL COMMENT '응답 ID',
    shape_type VARCHAR(50) NOT NULL COMMENT '도형 유형 (rectangle, triangle, circle 등)',
    progress_data JSON COMMENT '진행 상황 데이터 (좌표, 크기 등)',
    completion_percentage INT DEFAULT 0 COMMENT '완성도 (%)',
    is_completed TINYINT(1) DEFAULT 0 COMMENT '완성 여부',
    completed_at TIMESTAMP NULL COMMENT '완성 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (response_id) REFERENCES student_responses(id) ON DELETE CASCADE,
    INDEX idx_response (response_id),
    INDEX idx_completed (is_completed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='넓이 그리기 진행 상황';

-- 앱 설정 테이블
CREATE TABLE IF NOT EXISTS app_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL COMMENT '설정 키',
    setting_value TEXT COMMENT '설정 값',
    description VARCHAR(255) COMMENT '설명',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='앱 설정';

-- 기본 설정 데이터 삽입
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
('chime_enabled', '1', 'Area Chime 사운드 활성화 여부'),
('chime_volume', '0.5', 'Area Chime 볼륨 (0.0 ~ 1.0)'),
('moodle_api_url', '', 'Moodle API URL'),
('moodle_api_token', '', 'Moodle API 토큰')
ON DUPLICATE KEY UPDATE setting_value=VALUES(setting_value);

-- 샘플 데이터 (테스트용)
INSERT INTO questions (moodle_question_id, moodle_course_id, question_type, question_data, correct_answer) VALUES
(1001, 10, 'area_rectangle',
 '{"shape": "rectangle", "width": 5, "height": 3, "unit": "cm"}',
 15.00),
(1002, 10, 'area_triangle',
 '{"shape": "triangle", "base": 6, "height": 4, "unit": "cm"}',
 12.00),
(1003, 10, 'area_circle',
 '{"shape": "circle", "radius": 5, "unit": "cm"}',
 78.54)
ON DUPLICATE KEY UPDATE question_data=VALUES(question_data);
