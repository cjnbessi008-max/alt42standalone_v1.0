-- Boundary Gate Learning System
-- MySQL 5.7 Database Schema

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS boundary_gate
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE boundary_gate;

-- ========================================
-- 1. 문제 테이블 (problems)
-- ========================================
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT DEFAULT 0 COMMENT 'Moodle 코스 ID (0은 독립 문제)',
    quiz_id INT DEFAULT 0 COMMENT 'Moodle 퀴즈 ID',
    left_number INT NOT NULL COMMENT '왼쪽 숫자',
    right_number INT NOT NULL COMMENT '오른쪽 숫자',
    correct_answer ENUM('ge', 'le') NOT NULL COMMENT '정답 (ge: >=, le: <=)',
    description TEXT COMMENT '문제 설명',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'easy' COMMENT '난이도',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course (course_id),
    INDEX idx_difficulty (difficulty)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='부등호 문제 정보';

-- ========================================
-- 2. 학생 정보 테이블 (students)
-- ========================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT DEFAULT 0 COMMENT 'Moodle 사용자 ID',
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(200),
    email VARCHAR(200),
    grade_level VARCHAR(20) COMMENT '학년',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_user (moodle_user_id),
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 정보';

-- ========================================
-- 3. 학생 답안 테이블 (student_answers)
-- ========================================
CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    problem_id INT NOT NULL,
    answer ENUM('ge', 'le') NOT NULL COMMENT '학생이 선택한 답안',
    is_correct TINYINT(1) NOT NULL DEFAULT 0 COMMENT '정답 여부',
    time_spent INT DEFAULT 0 COMMENT '문제 풀이 시간 (초)',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 답안 기록';

-- ========================================
-- 4. 학생 진행 상황 테이블 (student_progress)
-- ========================================
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL UNIQUE,
    total_score INT DEFAULT 0 COMMENT '총 점수',
    problems_attempted INT DEFAULT 0 COMMENT '시도한 문제 수',
    problems_correct INT DEFAULT 0 COMMENT '맞춘 문제 수',
    current_level VARCHAR(20) DEFAULT 'beginner' COMMENT '현재 레벨',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_score (total_score),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 진행 상황 요약';

-- ========================================
-- 5. 세션 로그 테이블 (session_logs)
-- ========================================
CREATE TABLE IF NOT EXISTS session_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    problems_solved INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_score INT DEFAULT 0,
    ip_address VARCHAR(45) COMMENT 'IP 주소',
    user_agent TEXT COMMENT '브라우저 정보',
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    INDEX idx_student_session (student_id, session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 세션 로그';

-- ========================================
-- 6. Moodle 동기화 로그 (moodle_sync_logs)
-- ========================================
CREATE TABLE IF NOT EXISTS moodle_sync_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('problems', 'students', 'scores') NOT NULL,
    status ENUM('success', 'failed', 'partial') NOT NULL,
    records_synced INT DEFAULT 0,
    error_message TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type (sync_type),
    INDEX idx_synced_at (synced_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 동기화 로그';

-- ========================================
-- 샘플 데이터 삽입
-- ========================================

-- 샘플 문제 삽입
INSERT INTO problems (left_number, right_number, correct_answer, description, difficulty) VALUES
(5, 3, 'ge', '5는 3보다 크거나 같습니까?', 'easy'),
(2, 7, 'le', '2는 7보다 작거나 같습니까?', 'easy'),
(10, 10, 'ge', '10은 10과 같거나 큽니까?', 'medium'),
(8, 4, 'ge', '8은 4보다 크거나 같습니까?', 'easy'),
(3, 9, 'le', '3은 9보다 작거나 같습니까?', 'easy'),
(15, 12, 'ge', '15는 12보다 크거나 같습니까?', 'medium'),
(6, 6, 'le', '6은 6과 같거나 작습니까?', 'medium'),
(20, 18, 'ge', '20은 18보다 크거나 같습니까?', 'hard'),
(1, 5, 'le', '1은 5보다 작거나 같습니까?', 'easy'),
(14, 9, 'ge', '14는 9보다 크거나 같습니까?', 'medium'),
(7, 11, 'le', '7은 11보다 작거나 같습니까?', 'medium'),
(25, 20, 'ge', '25는 20보다 크거나 같습니까?', 'hard'),
(4, 4, 'ge', '4는 4와 같거나 큽니까?', 'medium'),
(0, 3, 'le', '0은 3보다 작거나 같습니까?', 'easy'),
(30, 15, 'ge', '30은 15보다 크거나 같습니까?', 'hard');

-- 샘플 학생 삽입
INSERT INTO students (username, full_name, email, grade_level) VALUES
('student1', '김철수', 'student1@example.com', '3학년'),
('student2', '이영희', 'student2@example.com', '3학년'),
('student3', '박민수', 'student3@example.com', '4학년');

-- 샘플 진행 상황 삽입
INSERT INTO student_progress (student_id, total_score, problems_attempted, problems_correct, current_level)
SELECT id, 0, 0, 0, 'beginner' FROM students;

-- ========================================
-- 뷰 생성: 학생 통계
-- ========================================
CREATE OR REPLACE VIEW student_statistics AS
SELECT
    s.id,
    s.username,
    s.full_name,
    sp.total_score,
    sp.problems_attempted,
    sp.problems_correct,
    CASE
        WHEN sp.problems_attempted > 0
        THEN ROUND((sp.problems_correct / sp.problems_attempted) * 100, 2)
        ELSE 0
    END as accuracy_rate,
    sp.current_level,
    sp.last_activity
FROM students s
LEFT JOIN student_progress sp ON s.id = sp.student_id;

-- ========================================
-- 저장 프로시저: 답안 제출 및 점수 업데이트
-- ========================================
DELIMITER //

CREATE PROCEDURE submit_answer(
    IN p_student_id INT,
    IN p_problem_id INT,
    IN p_answer ENUM('ge', 'le'),
    IN p_time_spent INT,
    OUT p_is_correct TINYINT,
    OUT p_points_earned INT
)
BEGIN
    DECLARE v_correct_answer ENUM('ge', 'le');

    -- 정답 조회
    SELECT correct_answer INTO v_correct_answer
    FROM problems
    WHERE id = p_problem_id;

    -- 정답 여부 확인
    SET p_is_correct = IF(p_answer = v_correct_answer, 1, 0);
    SET p_points_earned = IF(p_is_correct = 1, 10, 0);

    -- 답안 기록
    INSERT INTO student_answers (student_id, problem_id, answer, is_correct, time_spent)
    VALUES (p_student_id, p_problem_id, p_answer, p_is_correct, p_time_spent);

    -- 진행 상황 업데이트
    UPDATE student_progress
    SET
        total_score = total_score + p_points_earned,
        problems_attempted = problems_attempted + 1,
        problems_correct = problems_correct + p_is_correct,
        last_activity = NOW()
    WHERE student_id = p_student_id;
END //

DELIMITER ;

-- ========================================
-- 트리거: 답안 제출 시 통계 업데이트
-- ========================================
DELIMITER //

CREATE TRIGGER after_answer_insert
AFTER INSERT ON student_answers
FOR EACH ROW
BEGIN
    -- 세션 로그 업데이트 (현재 활성 세션)
    UPDATE session_logs
    SET
        problems_solved = problems_solved + 1,
        correct_answers = correct_answers + IF(NEW.is_correct = 1, 1, 0),
        total_score = total_score + IF(NEW.is_correct = 1, 10, 0),
        session_end = NOW()
    WHERE student_id = NEW.student_id
        AND session_end IS NULL
    ORDER BY session_start DESC
    LIMIT 1;
END //

DELIMITER ;

-- ========================================
-- 인덱스 최적화
-- ========================================

-- 복합 인덱스: 학생별 최근 활동 조회 최적화
CREATE INDEX idx_student_recent ON student_answers(student_id, submitted_at DESC);

-- 복합 인덱스: 문제별 정답률 계산 최적화
CREATE INDEX idx_problem_correct ON student_answers(problem_id, is_correct);

-- ========================================
-- 권한 설정 (선택 사항)
-- ========================================
-- CREATE USER 'boundary_gate_user'@'localhost' IDENTIFIED BY 'secure_password';
-- GRANT SELECT, INSERT, UPDATE ON boundary_gate.* TO 'boundary_gate_user'@'localhost';
-- FLUSH PRIVILEGES;

-- ========================================
-- 완료 메시지
-- ========================================
SELECT 'Boundary Gate Database Schema Created Successfully!' as Status;
SELECT COUNT(*) as 'Sample Problems' FROM problems;
SELECT COUNT(*) as 'Sample Students' FROM students;
