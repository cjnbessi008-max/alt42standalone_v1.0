-- 3D 도형 학습 앱을 위한 Moodle 데이터베이스 테이블
-- MySQL 5.7 호환

-- 1. 3D 도형 문제 메타데이터 테이블
CREATE TABLE IF NOT EXISTS mdl_question_3dshape_metadata (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    shape_type VARCHAR(50) NOT NULL COMMENT '도형 타입 (cube, cylinder, sphere, pyramid, cone)',
    shape_dimensions TEXT NOT NULL COMMENT '도형 크기 정보 (JSON 형식)',
    shape_color VARCHAR(7) NOT NULL DEFAULT '#4CAF50' COMMENT '도형 색상 (HEX)',
    answer_type VARCHAR(50) NOT NULL COMMENT '답변 타입 (numeric, multiple_choice, observation)',
    correct_answer TEXT COMMENT '정답 (타입에 따라 다름)',
    difficulty_level TINYINT(1) DEFAULT 1 COMMENT '난이도 (1-5)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY questionid (questionid),
    KEY shape_type (shape_type),
    KEY difficulty_level (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='3D 도형 문제 메타데이터';

-- 2. 학생 응답 기록 테이블
CREATE TABLE IF NOT EXISTS mdl_question_attempts (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    userid BIGINT(10) UNSIGNED NOT NULL,
    answer TEXT NOT NULL COMMENT '학생 답변 (JSON 형식)',
    is_correct TINYINT(1) DEFAULT 0 COMMENT '정답 여부',
    time_spent INT(10) UNSIGNED COMMENT '소요 시간 (초)',
    inner_view_used TINYINT(1) DEFAULT 0 COMMENT 'Inner View 모드 사용 여부',
    transparency_level TINYINT(3) UNSIGNED COMMENT '사용한 투명도 레벨 (0-100)',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY questionid (questionid),
    KEY userid (userid),
    KEY submitted_at (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 응답 기록';

-- 3. Inner View Mode 사용 로그 테이블
CREATE TABLE IF NOT EXISTS mdl_3dshape_innerview_logs (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    attemptid BIGINT(10) UNSIGNED NOT NULL,
    userid BIGINT(10) UNSIGNED NOT NULL,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    action VARCHAR(50) NOT NULL COMMENT '액션 (activate, deactivate, transparency_change)',
    transparency_value TINYINT(3) UNSIGNED COMMENT '투명도 값 (0-100)',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY attemptid (attemptid),
    KEY userid (userid),
    KEY questionid (questionid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Inner View Mode 사용 로그';

-- 4. 학습 분석 통계 테이블
CREATE TABLE IF NOT EXISTS mdl_3dshape_analytics (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    userid BIGINT(10) UNSIGNED NOT NULL,
    shape_type VARCHAR(50) NOT NULL,
    total_attempts INT(10) UNSIGNED DEFAULT 0,
    correct_attempts INT(10) UNSIGNED DEFAULT 0,
    avg_time_spent DECIMAL(10,2) COMMENT '평균 소요 시간 (초)',
    inner_view_usage_rate DECIMAL(5,2) COMMENT 'Inner View 사용률 (%)',
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY user_shape (userid, shape_type),
    KEY userid (userid),
    KEY shape_type (shape_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='3D 도형 학습 분석 통계';

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO mdl_question_3dshape_metadata
(questionid, shape_type, shape_dimensions, shape_color, answer_type, correct_answer, difficulty_level)
VALUES
(1, 'cube', '{"size": 5}', '#4CAF50', 'numeric', '125', 2),
(2, 'cylinder', '{"radius": 3, "height": 8}', '#2196F3', 'observation', NULL, 3),
(3, 'sphere', '{"radius": 4}', '#FF9800', 'numeric', '201.06', 3),
(4, 'pyramid', '{"baseSize": 4, "height": 6}', '#E91E63', 'multiple_choice', '5', 2),
(5, 'cone', '{"radius": 3, "height": 7}', '#9C27B0', 'numeric', '65.97', 4);

-- 뷰 생성: 문제별 통계
CREATE OR REPLACE VIEW mdl_3dshape_question_stats AS
SELECT
    q.id AS questionid,
    qm.shape_type,
    qm.difficulty_level,
    COUNT(qa.id) AS total_attempts,
    SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) AS correct_attempts,
    ROUND(AVG(qa.time_spent), 2) AS avg_time_spent,
    ROUND(SUM(CASE WHEN qa.inner_view_used = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(qa.id), 2) AS inner_view_usage_rate
FROM mdl_question q
JOIN mdl_question_3dshape_metadata qm ON q.id = qm.questionid
LEFT JOIN mdl_question_attempts qa ON q.id = qa.questionid
WHERE q.qtype = '3dshape'
GROUP BY q.id, qm.shape_type, qm.difficulty_level;

-- 인덱스 최적화
ALTER TABLE mdl_question_3dshape_metadata ADD INDEX idx_shape_difficulty (shape_type, difficulty_level);
ALTER TABLE mdl_question_attempts ADD INDEX idx_user_correct (userid, is_correct);
ALTER TABLE mdl_3dshape_innerview_logs ADD INDEX idx_user_question_time (userid, questionid, timestamp);

-- 저장 프로시저: 학습 분석 업데이트
DELIMITER //

CREATE PROCEDURE update_3dshape_analytics(
    IN p_userid BIGINT,
    IN p_questionid BIGINT,
    IN p_is_correct TINYINT,
    IN p_time_spent INT,
    IN p_inner_view_used TINYINT
)
BEGIN
    DECLARE v_shape_type VARCHAR(50);

    -- 도형 타입 가져오기
    SELECT shape_type INTO v_shape_type
    FROM mdl_question_3dshape_metadata
    WHERE questionid = p_questionid;

    -- 통계 업데이트 (INSERT ... ON DUPLICATE KEY UPDATE)
    INSERT INTO mdl_3dshape_analytics
        (userid, shape_type, total_attempts, correct_attempts, avg_time_spent, inner_view_usage_rate, last_attempt_at)
    VALUES
        (p_userid, v_shape_type, 1, p_is_correct, p_time_spent,
         IF(p_inner_view_used = 1, 100.0, 0.0), NOW())
    ON DUPLICATE KEY UPDATE
        total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + p_is_correct,
        avg_time_spent = ((avg_time_spent * total_attempts) + p_time_spent) / (total_attempts + 1),
        inner_view_usage_rate = ((inner_view_usage_rate * total_attempts) + IF(p_inner_view_used = 1, 100.0, 0.0)) / (total_attempts + 1),
        last_attempt_at = NOW();
END //

DELIMITER ;

-- 권한 설정 (실제 환경에 맞게 조정)
-- GRANT SELECT, INSERT, UPDATE ON moodle.mdl_question_3dshape_metadata TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON moodle.mdl_question_attempts TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT ON moodle.mdl_3dshape_innerview_logs TO 'moodle_user'@'localhost';
-- GRANT SELECT ON moodle.mdl_3dshape_question_stats TO 'moodle_user'@'localhost';
