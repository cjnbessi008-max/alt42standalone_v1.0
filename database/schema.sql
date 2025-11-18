-- Hundred Art Database Schema
-- MySQL 5.7 Compatible

-- Drop tables if exist (for clean installation)
DROP TABLE IF EXISTS student_progress;
DROP TABLE IF EXISTS moodle_sync_log;
DROP TABLE IF EXISTS problems;
DROP TABLE IF EXISTS artworks;
DROP TABLE IF EXISTS students;

-- Artworks: 1-100 숫자의 아트워크 정의
CREATE TABLE artworks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number INT NOT NULL UNIQUE COMMENT '1-100 숫자',
    title VARCHAR(100) NOT NULL COMMENT '아트워크 제목',
    description TEXT COMMENT '아트워크 설명',
    svg_data LONGTEXT NOT NULL COMMENT 'SVG 벡터 데이터',
    color_scheme VARCHAR(50) DEFAULT 'default' COMMENT '색상 테마',
    difficulty_level TINYINT DEFAULT 1 COMMENT '난이도 (1-5)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CHECK (number BETWEEN 1 AND 100),
    CHECK (difficulty_level BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='숫자 아트워크 정의 테이블';

-- Students: 학생 정보
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL UNIQUE COMMENT 'Moodle 사용자 ID',
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    full_name VARCHAR(255),
    grade_level VARCHAR(20) COMMENT '학년',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user_id (moodle_user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 정보 테이블';

-- Problems: Moodle에서 가져온 문제들
CREATE TABLE problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL UNIQUE COMMENT 'Moodle 문제 ID',
    course_id INT COMMENT 'Moodle 코스 ID',
    quiz_id INT COMMENT 'Moodle 퀴즈 ID',
    question_text TEXT NOT NULL COMMENT '문제 텍스트',
    question_type VARCHAR(50) DEFAULT 'multiple_choice' COMMENT '문제 유형',
    correct_answer VARCHAR(255) COMMENT '정답',
    artwork_number INT COMMENT '연결된 아트워크 번호',
    difficulty INT DEFAULT 1 COMMENT '난이도',
    points DECIMAL(5,2) DEFAULT 1.00 COMMENT '배점',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성 상태',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (artwork_number) REFERENCES artworks(number) ON DELETE SET NULL,
    INDEX idx_moodle_question_id (moodle_question_id),
    INDEX idx_course_id (course_id),
    INDEX idx_artwork_number (artwork_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 문제 정보 테이블';

-- Student Progress: 학생 학습 진행 상황
CREATE TABLE student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    artwork_number INT NOT NULL,
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    user_answer VARCHAR(255) COMMENT '학생 답변',
    is_correct TINYINT(1) DEFAULT 0 COMMENT '정답 여부',
    time_spent_seconds INT COMMENT '소요 시간 (초)',
    score DECIMAL(5,2) COMMENT '획득 점수',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL COMMENT '완료 시각',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (artwork_number) REFERENCES artworks(number) ON DELETE CASCADE,
    INDEX idx_student_id (student_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_artwork_number (artwork_number),
    INDEX idx_attempted_at (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 학습 진행 상황 테이블';

-- Moodle Sync Log: Moodle 데이터 동기화 로그
CREATE TABLE moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL COMMENT '동기화 유형 (students, problems, etc)',
    status VARCHAR(20) NOT NULL COMMENT '상태 (success, failed, partial)',
    records_synced INT DEFAULT 0 COMMENT '동기화된 레코드 수',
    error_message TEXT COMMENT '에러 메시지',
    sync_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP NULL,
    INDEX idx_sync_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_sync_started_at (sync_started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 동기화 로그 테이블';

-- Insert sample artwork data (1-10 for demonstration)
INSERT INTO artworks (number, title, description, svg_data, color_scheme, difficulty_level) VALUES
(1, 'One - 시작', '하나의 점으로 시작하는 여정', '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#FF6B6B"/></svg>', 'warm', 1),
(2, 'Two - 균형', '두 개의 조화로운 형태', '<svg viewBox="0 0 100 100"><circle cx="30" cy="50" r="25" fill="#4ECDC4"/><circle cx="70" cy="50" r="25" fill="#4ECDC4"/></svg>', 'cool', 1),
(3, 'Three - 삼각', '세 점이 만드는 안정', '<svg viewBox="0 0 100 100"><polygon points="50,20 20,80 80,80" fill="#FFE66D"/></svg>', 'bright', 2),
(4, 'Four - 사각', '네 개의 면이 만드는 완전함', '<svg viewBox="0 0 100 100"><rect x="20" y="20" width="60" height="60" fill="#95E1D3"/></svg>', 'pastel', 2),
(5, 'Five - 오각', '다섯 개의 별', '<svg viewBox="0 0 100 100"><polygon points="50,10 61,40 92,40 67,60 78,90 50,70 22,90 33,60 8,40 39,40" fill="#F38181"/></svg>', 'warm', 3);
