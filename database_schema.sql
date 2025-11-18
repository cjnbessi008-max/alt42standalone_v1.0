-- =====================================================
-- Log Flow 데이터베이스 스키마
-- MySQL 5.7 이상
-- Moodle 3.7 호환
-- =====================================================

-- 사용 데이터베이스 선택 (Moodle DB 사용)
-- USE moodle;

-- =====================================================
-- 1. 학습 진행상황 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS mdl_logflow_progress (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id VARCHAR(100) NOT NULL COMMENT '문제 ID',
    progress_data TEXT COMMENT '진행상황 JSON 데이터',
    timestamp INT NOT NULL COMMENT 'Unix 타임스탬프',

    UNIQUE KEY unique_user_problem (user_id, problem_id),
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 진행상황 저장';

-- =====================================================
-- 2. 답안 제출 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS mdl_logflow_answers (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id VARCHAR(100) NOT NULL COMMENT '문제 ID',
    answer DECIMAL(10, 6) COMMENT '학생이 제출한 답',
    steps TEXT COMMENT '계산 단계 JSON 데이터',
    is_correct TINYINT(1) DEFAULT 0 COMMENT '정답 여부 (0: 오답, 1: 정답)',
    grade INT DEFAULT 0 COMMENT '점수 (0-100)',
    timestamp INT NOT NULL COMMENT 'Unix 타임스탬프',

    INDEX idx_user_problem (user_id, problem_id),
    INDEX idx_user (user_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='답안 제출 이력';

-- =====================================================
-- 3. 애니메이션 상호작용 로그 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS mdl_logflow_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '고유 ID',
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    problem_id VARCHAR(100) NOT NULL COMMENT '문제 ID',
    interaction_type VARCHAR(50) NOT NULL COMMENT '상호작용 타입 (play, pause, speed_change 등)',
    interaction_data TEXT COMMENT '상호작용 세부 데이터 JSON',
    timestamp INT NOT NULL COMMENT 'Unix 타임스탬프',

    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_type (interaction_type),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='애니메이션 상호작용 로그';

-- =====================================================
-- 4. 로그 문제 정보 테이블 (커스텀 문제용)
-- =====================================================

CREATE TABLE IF NOT EXISTS mdl_logflow_problems (
    id VARCHAR(100) PRIMARY KEY COMMENT '문제 ID',
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT COMMENT '문제 설명',
    base INT NOT NULL COMMENT '로그의 밑',
    value INT NOT NULL COMMENT '로그의 진수',
    correct_answer DECIMAL(10, 6) NOT NULL COMMENT '정답',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '난이도',
    category VARCHAR(100) DEFAULT 'logarithm' COMMENT '카테고리',
    created_by INT COMMENT '생성자 ID',
    created_at INT NOT NULL COMMENT '생성 시간',
    updated_at INT COMMENT '수정 시간',

    INDEX idx_difficulty (difficulty),
    INDEX idx_category (category),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='로그 문제 정보';

-- =====================================================
-- 5. 세션 정보 테이블
-- =====================================================

CREATE TABLE IF NOT EXISTS mdl_logflow_sessions (
    session_token VARCHAR(64) PRIMARY KEY COMMENT '세션 토큰',
    user_id INT COMMENT 'Moodle 사용자 ID',
    moodle_url VARCHAR(255) COMMENT 'Moodle 서버 URL',
    ws_token VARCHAR(64) COMMENT 'Moodle Web Service 토큰',
    created_at INT NOT NULL COMMENT '생성 시간',
    expires_at INT NOT NULL COMMENT '만료 시간',
    last_activity INT NOT NULL COMMENT '마지막 활동 시간',

    INDEX idx_user (user_id),
    INDEX idx_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='세션 관리';

-- =====================================================
-- 샘플 데이터 삽입
-- =====================================================

-- 샘플 문제들
INSERT INTO mdl_logflow_problems (id, title, description, base, value, correct_answer, difficulty, created_at) VALUES
('log_101', 'log₂(8)', '2를 몇 번 곱해야 8이 되나요?', 2, 8, 3.000000, 'easy', UNIX_TIMESTAMP()),
('log_102', 'log₃(27)', '3을 몇 번 곱해야 27이 되나요?', 3, 27, 3.000000, 'easy', UNIX_TIMESTAMP()),
('log_103', 'log₂(16)', '2를 몇 번 곱해야 16이 되나요?', 2, 16, 4.000000, 'easy', UNIX_TIMESTAMP()),
('log_104', 'log₅(125)', '5를 몇 번 곱해야 125가 되나요?', 5, 125, 3.000000, 'medium', UNIX_TIMESTAMP()),
('log_105', 'log₁₀(100)', '10을 몇 번 곱해야 100이 되나요?', 10, 100, 2.000000, 'easy', UNIX_TIMESTAMP()),
('log_106', 'log₂(32)', '2를 몇 번 곱해야 32가 되나요?', 2, 32, 5.000000, 'medium', UNIX_TIMESTAMP()),
('log_107', 'log₄(64)', '4를 몇 번 곱해야 64가 되나요?', 4, 64, 3.000000, 'medium', UNIX_TIMESTAMP()),
('log_108', 'log₂(5)', '2를 몇 번 곱해야 5가 되나요? (소수)', 2, 5, 2.321928, 'hard', UNIX_TIMESTAMP()),
('log_109', 'log₃(10)', '3을 몇 번 곱해야 10이 되나요? (소수)', 3, 10, 2.095903, 'hard', UNIX_TIMESTAMP()),
('log_110', 'log₁₀(1000)', '10을 몇 번 곱해야 1000이 되나요?', 10, 1000, 3.000000, 'easy', UNIX_TIMESTAMP());

-- =====================================================
-- 뷰 생성
-- =====================================================

-- 사용자별 학습 통계 뷰
CREATE OR REPLACE VIEW v_logflow_user_stats AS
SELECT
    user_id,
    COUNT(DISTINCT problem_id) as problems_attempted,
    SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers,
    ROUND(AVG(grade), 2) as average_grade,
    COUNT(*) as total_attempts,
    FROM_UNIXTIME(MAX(timestamp)) as last_attempt
FROM mdl_logflow_answers
GROUP BY user_id;

-- 문제별 통계 뷰
CREATE OR REPLACE VIEW v_logflow_problem_stats AS
SELECT
    a.problem_id,
    p.title,
    p.difficulty,
    COUNT(DISTINCT a.user_id) as unique_users,
    COUNT(*) as total_attempts,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    ROUND(AVG(a.grade), 2) as average_grade,
    ROUND(
        (SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) / COUNT(*)) * 100,
        2
    ) as success_rate
FROM mdl_logflow_answers a
LEFT JOIN mdl_logflow_problems p ON a.problem_id = p.id
GROUP BY a.problem_id, p.title, p.difficulty;

-- =====================================================
-- 인덱스 최적화 (필요시)
-- =====================================================

-- 복합 인덱스 추가
ALTER TABLE mdl_logflow_answers
ADD INDEX idx_user_timestamp (user_id, timestamp);

ALTER TABLE mdl_logflow_interactions
ADD INDEX idx_user_problem_timestamp (user_id, problem_id, timestamp);

-- =====================================================
-- 데이터 정리 프로시저 (오래된 세션 삭제)
-- =====================================================

DELIMITER $$

CREATE PROCEDURE sp_cleanup_expired_sessions()
BEGIN
    DELETE FROM mdl_logflow_sessions
    WHERE expires_at < UNIX_TIMESTAMP();

    SELECT ROW_COUNT() as deleted_sessions;
END$$

DELIMITER ;

-- =====================================================
-- 사용 예시
-- =====================================================

-- 세션 정리 실행
-- CALL sp_cleanup_expired_sessions();

-- 사용자 통계 조회
-- SELECT * FROM v_logflow_user_stats WHERE user_id = 1;

-- 문제 통계 조회
-- SELECT * FROM v_logflow_problem_stats ORDER BY success_rate DESC;

-- =====================================================
-- 권한 설정 (필요시)
-- =====================================================

-- GRANT SELECT, INSERT, UPDATE ON mdl_logflow_* TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;
