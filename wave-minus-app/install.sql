-- Wave Minus 설치 SQL 스크립트
-- MySQL 5.7 / Moodle 3.7용

-- 1. 커스텀 답안 저장 테이블 생성
CREATE TABLE IF NOT EXISTS mdl_waveminus_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problemid INT NOT NULL COMMENT 'Moodle question ID',
    userid INT DEFAULT 0 COMMENT 'Moodle user ID',
    answer TEXT NOT NULL COMMENT 'User answer in JSON format',
    is_correct TINYINT(1) DEFAULT 0 COMMENT '1 if correct, 0 if incorrect',
    score DECIMAL(10,5) DEFAULT 0 COMMENT 'Score awarded',
    submitted_at VARCHAR(50) COMMENT 'Submission timestamp',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_problemid (problemid),
    INDEX idx_userid (userid),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Wave Minus student answer attempts';

-- 2. 샘플 문제 데이터 삽입 (테스트용)
-- 주의: 실제 Moodle 환경에서는 Moodle UI를 통해 문제를 생성해야 합니다.
-- 이 데이터는 독립 실행 테스트용입니다.

CREATE TABLE IF NOT EXISTS mdl_waveminus_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT 'Problem name',
    description TEXT COMMENT 'Problem description',
    set_a TEXT NOT NULL COMMENT 'Set A in JSON format',
    set_b TEXT NOT NULL COMMENT 'Set B in JSON format',
    difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Wave Minus problem bank';

-- 3. 샘플 문제 데이터 삽입
INSERT INTO mdl_waveminus_problems (name, description, set_a, set_b, difficulty_level) VALUES
('집합 차집합 - 기초 1', '작은 수의 집합으로 차집합 개념 익히기', '[1,2,3,4,5,6,7]', '[4,5,6,7,8,9,10]', 'easy'),
('집합 차집합 - 기초 2', '짝수와 홀수가 섞인 집합', '[2,4,6,8,10,12,14]', '[8,10,12,14,16,18,20]', 'easy'),
('집합 차집합 - 중급 1', '다양한 크기의 집합', '[1,3,5,7,9,11,13,15]', '[5,7,9,11,13,15,17,19]', 'medium'),
('집합 차집합 - 중급 2', '큰 수의 집합', '[10,20,30,40,50,60,70]', '[30,40,50,60,70,80,90]', 'medium'),
('집합 차집합 - 고급 1', '복잡한 교집합 패턴', '[2,3,5,7,11,13,17,19,23]', '[5,7,11,13,17,19,23,29,31]', 'hard'),
('집합 차집합 - 고급 2', '큰 집합 연산', '[1,2,4,8,16,32,64,128]', '[4,8,16,32,64,128,256,512]', 'hard');

-- 4. 성적 통계 뷰 생성
CREATE OR REPLACE VIEW mdl_waveminus_stats AS
SELECT
    p.id AS problem_id,
    p.name AS problem_name,
    p.difficulty_level,
    COUNT(a.id) AS total_attempts,
    SUM(a.is_correct) AS correct_attempts,
    ROUND(SUM(a.is_correct) * 100.0 / COUNT(a.id), 2) AS success_rate,
    AVG(a.score) AS avg_score,
    MIN(a.created_at) AS first_attempt,
    MAX(a.created_at) AS last_attempt
FROM mdl_waveminus_problems p
LEFT JOIN mdl_waveminus_attempts a ON p.id = a.problemid
GROUP BY p.id, p.name, p.difficulty_level;

-- 5. 사용자별 진도 뷰
CREATE OR REPLACE VIEW mdl_waveminus_user_progress AS
SELECT
    a.userid,
    COUNT(DISTINCT a.problemid) AS problems_attempted,
    SUM(a.is_correct) AS problems_solved,
    COUNT(a.id) AS total_attempts,
    ROUND(SUM(a.score), 2) AS total_score,
    ROUND(AVG(a.is_correct) * 100, 2) AS accuracy_rate,
    MIN(a.created_at) AS first_activity,
    MAX(a.created_at) AS last_activity
FROM mdl_waveminus_attempts a
GROUP BY a.userid;

-- 6. 인덱스 최적화 (성능 향상)
ALTER TABLE mdl_waveminus_attempts
    ADD INDEX idx_user_problem (userid, problemid),
    ADD INDEX idx_correct (is_correct),
    ADD INDEX idx_score (score);

-- 7. 저장 프로시저: 문제 랜덤 선택
DELIMITER //

CREATE PROCEDURE sp_get_random_problem(
    IN p_difficulty VARCHAR(20),
    IN p_exclude_attempted_by_user INT
)
BEGIN
    IF p_exclude_attempted_by_user > 0 THEN
        -- 사용자가 아직 풀지 않은 문제 중 랜덤 선택
        SELECT p.*
        FROM mdl_waveminus_problems p
        WHERE p.is_active = 1
          AND (p_difficulty IS NULL OR p.difficulty_level = p_difficulty)
          AND p.id NOT IN (
              SELECT DISTINCT problemid
              FROM mdl_waveminus_attempts
              WHERE userid = p_exclude_attempted_by_user
          )
        ORDER BY RAND()
        LIMIT 1;
    ELSE
        -- 모든 활성 문제 중 랜덤 선택
        SELECT p.*
        FROM mdl_waveminus_problems p
        WHERE p.is_active = 1
          AND (p_difficulty IS NULL OR p.difficulty_level = p_difficulty)
        ORDER BY RAND()
        LIMIT 1;
    END IF;
END //

DELIMITER ;

-- 8. 저장 프로시저: 사용자 통계 조회
DELIMITER //

CREATE PROCEDURE sp_get_user_stats(
    IN p_userid INT
)
BEGIN
    SELECT
        COUNT(DISTINCT problemid) AS problems_attempted,
        SUM(is_correct) AS problems_solved,
        COUNT(id) AS total_attempts,
        ROUND(SUM(score), 2) AS total_score,
        ROUND(AVG(is_correct) * 100, 2) AS accuracy_rate,
        MIN(created_at) AS first_activity,
        MAX(created_at) AS last_activity
    FROM mdl_waveminus_attempts
    WHERE userid = p_userid;

    -- 난이도별 통계
    SELECT
        p.difficulty_level,
        COUNT(DISTINCT a.problemid) AS attempted,
        SUM(a.is_correct) AS solved,
        ROUND(AVG(a.is_correct) * 100, 2) AS success_rate
    FROM mdl_waveminus_attempts a
    JOIN mdl_waveminus_problems p ON a.problemid = p.id
    WHERE a.userid = p_userid
    GROUP BY p.difficulty_level;
END //

DELIMITER ;

-- 9. 트리거: 답안 제출 시 타임스탬프 자동 기록
DELIMITER //

CREATE TRIGGER trg_waveminus_attempt_timestamp
BEFORE INSERT ON mdl_waveminus_attempts
FOR EACH ROW
BEGIN
    IF NEW.submitted_at IS NULL OR NEW.submitted_at = '' THEN
        SET NEW.submitted_at = NOW();
    END IF;
END //

DELIMITER ;

-- 10. 완료 메시지
SELECT 'Wave Minus 데이터베이스 설치 완료!' AS message;
SELECT '생성된 테이블:' AS info;
SHOW TABLES LIKE 'mdl_waveminus%';
