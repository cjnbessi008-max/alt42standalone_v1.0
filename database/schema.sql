-- Angle Light Database Schema
-- MySQL 5.7
-- Character Set: utf8mb4 (이모지 및 다국어 지원)

CREATE DATABASE IF NOT EXISTS angle_light CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE angle_light;

-- 학생 정보 테이블
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE COMMENT 'Moodle 사용자 ID',
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 정보';

-- 문제 테이블
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT COMMENT '문제 설명',
    moodle_course_id INT COMMENT 'Moodle 코스 ID',
    moodle_quiz_id INT COMMENT 'Moodle 퀴즈 ID',

    -- 벡터 1 정보
    vector1_x DECIMAL(10, 6) NOT NULL DEFAULT 1.000000 COMMENT '벡터1 X 좌표',
    vector1_y DECIMAL(10, 6) NOT NULL DEFAULT 0.000000 COMMENT '벡터1 Y 좌표',

    -- 벡터 2 정보
    vector2_x DECIMAL(10, 6) NOT NULL DEFAULT 0.707107 COMMENT '벡터2 X 좌표',
    vector2_y DECIMAL(10, 6) NOT NULL DEFAULT 0.707107 COMMENT '벡터2 Y 좌표',

    -- 정답 정보
    target_angle DECIMAL(10, 6) NOT NULL COMMENT '목표 각도 (도 단위)',
    tolerance DECIMAL(5, 2) NOT NULL DEFAULT 2.00 COMMENT '허용 오차 (도 단위)',

    -- 난이도 및 설정
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '난이도',
    max_attempts INT DEFAULT 3 COMMENT '최대 시도 횟수',
    time_limit INT DEFAULT 300 COMMENT '제한 시간 (초)',

    -- 메타데이터
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_moodle_course (moodle_course_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='벡터 각도 문제';

-- 학습 진행 기록 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,

    -- 시도 정보
    attempt_number INT NOT NULL DEFAULT 1 COMMENT '시도 횟수',
    submitted_angle DECIMAL(10, 6) COMMENT '제출한 각도',
    angle_error DECIMAL(10, 6) COMMENT '각도 오차',

    -- 결과 정보
    is_correct BOOLEAN DEFAULT FALSE COMMENT '정답 여부',
    score DECIMAL(5, 2) DEFAULT 0.00 COMMENT '점수 (0-100)',
    time_spent INT COMMENT '소요 시간 (초)',

    -- 빛 감도 정보 (시각화 관련)
    light_intensity DECIMAL(5, 2) COMMENT '빛 밝기 (0-100)',

    -- 메타데이터
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    synced_to_moodle BOOLEAN DEFAULT FALSE COMMENT 'Moodle 동기화 여부',
    synced_at TIMESTAMP NULL,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,

    INDEX idx_student_problem (student_id, problem_id),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_sync_status (synced_to_moodle)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 학습 진행 기록';

-- 세션 정보 테이블
CREATE TABLE IF NOT EXISTS sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_token VARCHAR(64) NOT NULL UNIQUE,
    moodle_session_id VARCHAR(255) COMMENT 'Moodle 세션 ID',

    ip_address VARCHAR(45),
    user_agent TEXT,

    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,

    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,

    INDEX idx_token (session_token),
    INDEX idx_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 세션';

-- 샘플 데이터 삽입

-- 샘플 학생 (테스트용)
INSERT INTO students (moodle_user_id, username, email, full_name) VALUES
(1001, 'student1', 'student1@kaist.ac.kr', '김철수'),
(1002, 'student2', 'student2@kaist.ac.kr', '이영희'),
(1003, 'student3', 'student3@kaist.ac.kr', '박민수');

-- 샘플 문제
INSERT INTO problems (
    title, description,
    vector1_x, vector1_y,
    vector2_x, vector2_y,
    target_angle, tolerance, difficulty
) VALUES
(
    '벡터 각도 기초 1 - 45도',
    '두 벡터 사이의 각도를 45도로 맞춰보세요. 각도가 정확할수록 빛이 밝게 표시됩니다.',
    1.000000, 0.000000,
    0.707107, 0.707107,
    45.000000, 2.00, 'easy'
),
(
    '벡터 각도 기초 2 - 90도',
    '두 벡터가 직각(90도)을 이루도록 조정하세요.',
    1.000000, 0.000000,
    0.000000, 1.000000,
    90.000000, 2.00, 'easy'
),
(
    '벡터 각도 중급 1 - 60도',
    '60도 각도를 만들어보세요. 정밀한 조작이 필요합니다.',
    1.000000, 0.000000,
    0.500000, 0.866025,
    60.000000, 1.50, 'medium'
),
(
    '벡터 각도 중급 2 - 120도',
    '120도의 둔각을 형성하세요.',
    1.000000, 0.000000,
    -0.500000, 0.866025,
    120.000000, 1.50, 'medium'
),
(
    '벡터 각도 고급 1 - 30도',
    '30도의 예각을 정확하게 만드세요. 허용 오차가 매우 작습니다.',
    1.000000, 0.000000,
    0.866025, 0.500000,
    30.000000, 1.00, 'hard'
);

-- 샘플 진행 기록
INSERT INTO student_progress (
    student_id, problem_id, attempt_number,
    submitted_angle, angle_error, is_correct, score,
    time_spent, light_intensity
) VALUES
(1, 1, 1, 45.50, 0.50, TRUE, 98.00, 45, 98.00),
(1, 2, 1, 91.20, 1.20, TRUE, 96.00, 60, 96.00),
(2, 1, 1, 48.00, 3.00, FALSE, 0.00, 120, 40.00),
(2, 1, 2, 45.80, 0.80, TRUE, 95.00, 90, 95.00);

-- 뷰: 학생별 통계
CREATE OR REPLACE VIEW student_statistics AS
SELECT
    s.id AS student_id,
    s.username,
    s.full_name,
    COUNT(DISTINCT sp.problem_id) AS problems_attempted,
    SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) AS problems_solved,
    AVG(sp.score) AS average_score,
    AVG(sp.time_spent) AS average_time,
    AVG(sp.light_intensity) AS average_light_intensity
FROM students s
LEFT JOIN student_progress sp ON s.id = sp.student_id
GROUP BY s.id, s.username, s.full_name;

-- 뷰: 문제별 통계
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    p.id AS problem_id,
    p.title,
    p.difficulty,
    p.target_angle,
    COUNT(DISTINCT sp.student_id) AS students_attempted,
    AVG(sp.attempt_number) AS average_attempts,
    SUM(CASE WHEN sp.is_correct THEN 1 ELSE 0 END) AS total_solved,
    AVG(sp.score) AS average_score,
    AVG(sp.angle_error) AS average_error
FROM problems p
LEFT JOIN student_progress sp ON p.id = sp.problem_id
GROUP BY p.id, p.title, p.difficulty, p.target_angle;
