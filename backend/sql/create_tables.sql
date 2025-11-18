-- Property Shake 이벤트 로그 테이블 생성
-- MySQL 5.7용 SQL 스크립트

CREATE TABLE IF NOT EXISTS mdl_property_shake_logs (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    userid BIGINT(10) UNSIGNED NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_data LONGTEXT,
    timecreated DATETIME NOT NULL,
    PRIMARY KEY (id),
    KEY idx_questionid (questionid),
    KEY idx_userid (userid),
    KEY idx_event_type (event_type),
    KEY idx_timecreated (timecreated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Property Shake 이벤트 로그';

-- 인덱스 추가로 쿼리 성능 최적화
CREATE INDEX idx_question_user ON mdl_property_shake_logs(questionid, userid);
CREATE INDEX idx_event_time ON mdl_property_shake_logs(event_type, timecreated);

-- 문제 확장 정보 테이블 (그래프 관련 메타데이터 저장)
CREATE TABLE IF NOT EXISTS mdl_question_graph_metadata (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    questionid BIGINT(10) UNSIGNED NOT NULL,
    equation VARCHAR(255) NOT NULL,
    domain_min DECIMAL(10, 2) DEFAULT -10.00,
    domain_max DECIMAL(10, 2) DEFAULT 10.00,
    range_min DECIMAL(10, 2) DEFAULT NULL,
    range_max DECIMAL(10, 2) DEFAULT NULL,
    has_extrema TINYINT(1) DEFAULT 0,
    has_inflection TINYINT(1) DEFAULT 0,
    timecreated DATETIME NOT NULL,
    timemodified DATETIME NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_questionid (questionid),
    KEY idx_equation (equation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='그래프 문제 메타데이터';

-- 샘플 데이터 삽입
INSERT INTO mdl_question_graph_metadata
(questionid, equation, domain_min, domain_max, has_extrema, has_inflection, timecreated, timemodified)
VALUES
(1, 'x^2 - 4*x + 3', -2.00, 6.00, 1, 0, NOW(), NOW()),
(2, 'x^3 - 3*x^2 + 2', -2.00, 4.00, 1, 1, NOW(), NOW()),
(3, 'sin(x)', -6.28, 6.28, 1, 1, NOW(), NOW());

-- 통계 뷰 생성
CREATE OR REPLACE VIEW v_property_shake_stats AS
SELECT
    questionid,
    event_type,
    COUNT(*) as event_count,
    COUNT(DISTINCT userid) as unique_users,
    DATE(timecreated) as event_date
FROM
    mdl_property_shake_logs
GROUP BY
    questionid, event_type, DATE(timecreated)
ORDER BY
    event_date DESC;

-- 사용자 활동 요약 뷰
CREATE OR REPLACE VIEW v_user_activity_summary AS
SELECT
    l.userid,
    COUNT(*) as total_events,
    COUNT(DISTINCT l.questionid) as problems_attempted,
    COUNT(CASE WHEN l.event_type = 'extremum' THEN 1 END) as extrema_found,
    COUNT(CASE WHEN l.event_type = 'inflection' THEN 1 END) as inflections_found,
    MIN(l.timecreated) as first_activity,
    MAX(l.timecreated) as last_activity
FROM
    mdl_property_shake_logs l
GROUP BY
    l.userid;
