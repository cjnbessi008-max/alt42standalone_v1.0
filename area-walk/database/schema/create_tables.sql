-- Area Walk Database Schema
-- MySQL 5.7+
-- Character Set: utf8mb4
-- Collation: utf8mb4_unicode_ci

-- Drop tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS area_walk_attempts;
DROP TABLE IF EXISTS area_walk_progress;
DROP TABLE IF EXISTS area_walk_problems;
DROP TABLE IF EXISTS area_walk_functions;

-- ============================================================================
-- Table: area_walk_functions
-- Description: 함수 라이브러리 (문제에서 사용할 수 있는 함수들)
-- ============================================================================
CREATE TABLE area_walk_functions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '함수명 (예: Linear, Quadratic)',
    expression VARCHAR(255) NOT NULL COMMENT '수학 표현식 (예: x^2)',
    latex_notation VARCHAR(255) COMMENT 'LaTeX 표기법 (예: x^{2})',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    category VARCHAR(50) COMMENT '카테고리 (polynomial, trigonometric, exponential)',
    visualization_color VARCHAR(7) DEFAULT '#3498db' COMMENT '그래프 색상 (HEX)',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_category (category),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='적분 문제에 사용되는 함수 라이브러리';

-- ============================================================================
-- Table: area_walk_problems
-- Description: 적분 문제 정보
-- ============================================================================
CREATE TABLE area_walk_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL COMMENT 'Moodle 문제 ID',
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT COMMENT '문제 설명',
    function_id INT DEFAULT NULL COMMENT '함수 라이브러리 참조 (NULL이면 custom)',
    function_expr VARCHAR(255) NOT NULL COMMENT '적분할 함수 표현식 (예: x^2)',
    lower_bound DECIMAL(10,4) NOT NULL COMMENT '적분 하한',
    upper_bound DECIMAL(10,4) NOT NULL COMMENT '적분 상한',
    correct_answer DECIMAL(10,4) NOT NULL COMMENT '정답 (적분값)',
    tolerance DECIMAL(10,4) DEFAULT 0.01 COMMENT '오차 허용 범위',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',

    -- 시각화 설정
    character_sprite VARCHAR(255) DEFAULT 'default.png' COMMENT '캐릭터 이미지 파일명',
    background_image VARCHAR(255) DEFAULT 'default_bg.png' COMMENT '배경 이미지 파일명',
    graph_color VARCHAR(7) DEFAULT '#3498db' COMMENT '그래프 선 색상',
    area_color VARCHAR(7) DEFAULT 'rgba(52, 152, 219, 0.3)' COMMENT '적분 영역 색상',

    -- 힌트 및 피드백
    hint_1 TEXT COMMENT '힌트 1',
    hint_2 TEXT COMMENT '힌트 2',
    hint_3 TEXT COMMENT '힌트 3',
    success_message VARCHAR(255) DEFAULT '정답입니다!' COMMENT '정답 메시지',
    failure_message VARCHAR(255) DEFAULT '다시 시도해보세요.' COMMENT '오답 메시지',

    -- 메타데이터
    max_attempts INT DEFAULT 3 COMMENT '최대 시도 횟수 (0=무제한)',
    time_limit_seconds INT DEFAULT 0 COMMENT '제한 시간 (0=무제한)',
    is_active TINYINT(1) DEFAULT 1 COMMENT '활성화 여부',
    created_by INT COMMENT 'Moodle 교사 ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (function_id) REFERENCES area_walk_functions(id) ON DELETE SET NULL,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Area Walk 적분 문제 정보';

-- ============================================================================
-- Table: area_walk_attempts
-- Description: 학생의 문제 풀이 시도 기록
-- ============================================================================
CREATE TABLE area_walk_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL COMMENT '문제 ID',
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',

    -- 답안 정보
    user_answer DECIMAL(10,4) NOT NULL COMMENT '학생이 입력한 답',
    is_correct TINYINT(1) NOT NULL COMMENT '정답 여부',
    error_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT '오차율 (%)',
    score DECIMAL(5,2) DEFAULT 0.00 COMMENT '점수 (0-100)',

    -- 시도 정보
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    time_spent_seconds INT DEFAULT 0 COMMENT '소요 시간 (초)',
    hint_used TINYINT(1) DEFAULT 0 COMMENT '힌트 사용 여부',
    hints_viewed TEXT COMMENT '본 힌트 목록 (JSON: ["hint_1", "hint_2"])',

    -- 인터랙션 데이터
    session_data JSON COMMENT '세션 상세 데이터',
    /*
    session_data 구조 예시:
    {
        "interactions": 5,           // 총 인터랙션 수
        "replays": 2,                 // 애니메이션 재생 횟수
        "zoom_used": true,            // 줌 기능 사용 여부
        "character_moves": 3,         // 캐릭터 이동 시뮬레이션 횟수
        "calculation_method": "numerical", // 계산 방법
        "input_history": [2.5, 2.66, 2.667] // 입력 히스토리
    }
    */

    -- 메타데이터
    ip_address VARCHAR(45) COMMENT '접속 IP',
    user_agent TEXT COMMENT '브라우저 정보',
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES area_walk_problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_problem_correct (problem_id, is_correct),
    INDEX idx_attempted_at (attempted_at),
    INDEX idx_user_attempted (user_id, attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학생의 문제 풀이 시도 기록';

-- ============================================================================
-- Table: area_walk_progress
-- Description: 학생의 학습 진도 추적
-- ============================================================================
CREATE TABLE area_walk_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id INT NOT NULL COMMENT '문제 ID',

    -- 진도 정보
    status ENUM('not_started', 'in_progress', 'completed', 'mastered') DEFAULT 'not_started',
    completion_percentage DECIMAL(5,2) DEFAULT 0.00 COMMENT '완료율 (0-100)',

    -- 성적 정보
    best_score DECIMAL(5,2) DEFAULT 0.00 COMMENT '최고 점수',
    average_score DECIMAL(5,2) DEFAULT 0.00 COMMENT '평균 점수',
    total_attempts INT DEFAULT 0 COMMENT '총 시도 횟수',
    successful_attempts INT DEFAULT 0 COMMENT '성공 횟수',

    -- 시간 정보
    total_time_spent_seconds INT DEFAULT 0 COMMENT '총 소요 시간',
    average_time_per_attempt INT DEFAULT 0 COMMENT '시도당 평균 시간',

    -- 학습 패턴
    hints_usage_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '힌트 사용률 (%)',
    improvement_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '점수 향상률 (%)',

    -- 메타데이터
    first_accessed_at TIMESTAMP NULL COMMENT '최초 접근 시간',
    last_accessed_at TIMESTAMP NULL COMMENT '마지막 접근 시간',
    completed_at TIMESTAMP NULL COMMENT '완료 시간',
    mastered_at TIMESTAMP NULL COMMENT '숙달 시간 (연속 3회 정답 시)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (problem_id) REFERENCES area_walk_problems(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_user_status (user_id, status),
    INDEX idx_status (status),
    INDEX idx_completion (completion_percentage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학생의 학습 진도 및 성적 추적';

-- ============================================================================
-- Create Views for Analytics
-- ============================================================================

-- View: 문제별 통계
CREATE OR REPLACE VIEW area_walk_problem_stats AS
SELECT
    p.id AS problem_id,
    p.title,
    p.difficulty_level,
    COUNT(DISTINCT a.user_id) AS total_students,
    COUNT(a.id) AS total_attempts,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts,
    ROUND(AVG(a.score), 2) AS average_score,
    ROUND(AVG(a.time_spent_seconds), 0) AS average_time_seconds,
    ROUND(SUM(CASE WHEN a.hint_used = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(a.id), 2) AS hint_usage_rate
FROM area_walk_problems p
LEFT JOIN area_walk_attempts a ON p.id = a.problem_id
GROUP BY p.id, p.title, p.difficulty_level;

-- View: 학생별 통계
CREATE OR REPLACE VIEW area_walk_student_stats AS
SELECT
    pr.user_id,
    COUNT(DISTINCT pr.problem_id) AS total_problems,
    SUM(CASE WHEN pr.status = 'completed' THEN 1 ELSE 0 END) AS completed_problems,
    SUM(CASE WHEN pr.status = 'mastered' THEN 1 ELSE 0 END) AS mastered_problems,
    ROUND(AVG(pr.best_score), 2) AS average_best_score,
    SUM(pr.total_time_spent_seconds) AS total_time_spent,
    ROUND(AVG(pr.hints_usage_rate), 2) AS average_hint_usage
FROM area_walk_progress pr
GROUP BY pr.user_id;

-- ============================================================================
-- Insert Triggers for Auto-updating Progress
-- ============================================================================

DELIMITER $$

-- Trigger: 시도 후 진도 자동 업데이트
CREATE TRIGGER after_attempt_insert
AFTER INSERT ON area_walk_attempts
FOR EACH ROW
BEGIN
    -- 진도 테이블에 레코드가 없으면 생성
    INSERT INTO area_walk_progress (user_id, problem_id, first_accessed_at)
    VALUES (NEW.user_id, NEW.problem_id, NEW.attempted_at)
    ON DUPLICATE KEY UPDATE user_id = user_id; -- No-op if exists

    -- 통계 업데이트
    UPDATE area_walk_progress
    SET
        total_attempts = total_attempts + 1,
        successful_attempts = successful_attempts + (CASE WHEN NEW.is_correct = 1 THEN 1 ELSE 0 END),
        best_score = GREATEST(best_score, NEW.score),
        total_time_spent_seconds = total_time_spent_seconds + NEW.time_spent_seconds,
        last_accessed_at = NEW.attempted_at,
        status = CASE
            WHEN NEW.is_correct = 1 THEN 'completed'
            ELSE 'in_progress'
        END,
        completion_percentage = CASE
            WHEN NEW.is_correct = 1 THEN 100.00
            ELSE (successful_attempts + (CASE WHEN NEW.is_correct = 1 THEN 1 ELSE 0 END)) * 100.0 / (total_attempts + 1)
        END,
        completed_at = CASE
            WHEN NEW.is_correct = 1 AND completed_at IS NULL THEN NEW.attempted_at
            ELSE completed_at
        END
    WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id;

    -- 평균 점수 계산
    UPDATE area_walk_progress pr
    SET average_score = (
        SELECT AVG(a.score)
        FROM area_walk_attempts a
        WHERE a.user_id = NEW.user_id AND a.problem_id = NEW.problem_id
    ),
    average_time_per_attempt = (
        SELECT AVG(a.time_spent_seconds)
        FROM area_walk_attempts a
        WHERE a.user_id = NEW.user_id AND a.problem_id = NEW.problem_id
    ),
    hints_usage_rate = (
        SELECT (SUM(CASE WHEN a.hint_used = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*))
        FROM area_walk_attempts a
        WHERE a.user_id = NEW.user_id AND a.problem_id = NEW.problem_id
    )
    WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id;
END$$

DELIMITER ;

-- ============================================================================
-- Indexes for Performance Optimization
-- ============================================================================

-- 복합 인덱스: 자주 조회되는 조합
CREATE INDEX idx_problem_user_time ON area_walk_attempts(problem_id, user_id, attempted_at);
CREATE INDEX idx_user_status_score ON area_walk_progress(user_id, status, best_score);

-- 전문 검색 인덱스 (선택적)
-- ALTER TABLE area_walk_problems ADD FULLTEXT INDEX ft_title_description (title, description);

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

ALTER TABLE area_walk_functions
    COMMENT = '적분 문제에 사용되는 함수 라이브러리. 재사용 가능한 함수들을 미리 정의.';

ALTER TABLE area_walk_problems
    COMMENT = 'Moodle과 연동되는 Area Walk 적분 문제. 함수, 적분 범위, 시각화 설정 포함.';

ALTER TABLE area_walk_attempts
    COMMENT = '학생의 각 문제 풀이 시도를 상세히 기록. 학습 분석의 기초 데이터.';

ALTER TABLE area_walk_progress
    COMMENT = '학생별 문제별 학습 진도와 성적 요약. 대시보드와 리포트에 사용.';

-- ============================================================================
-- Grant Permissions (Adjust as needed)
-- ============================================================================

-- 애플리케이션 사용자 생성 및 권한 부여
-- CREATE USER 'area_walk_app'@'localhost' IDENTIFIED BY 'secure_password_here';
-- GRANT SELECT, INSERT, UPDATE ON area_walk_functions TO 'area_walk_app'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON area_walk_problems TO 'area_walk_app'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON area_walk_attempts TO 'area_walk_app'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON area_walk_progress TO 'area_walk_app'@'localhost';
-- FLUSH PRIVILEGES;

-- ============================================================================
-- Schema Version Info
-- ============================================================================

CREATE TABLE IF NOT EXISTS area_walk_schema_version (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO area_walk_schema_version (version, description)
VALUES ('1.0.0', 'Initial schema creation with 4 core tables, views, and triggers');

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
