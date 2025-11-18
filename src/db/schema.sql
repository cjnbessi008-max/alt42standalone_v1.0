-- ========================================
-- Concept Avoidance Detection System
-- Database Schema for MySQL 5.7
-- ========================================

CREATE DATABASE IF NOT EXISTS concept_avoidance DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE concept_avoidance;

-- ========================================
-- 1. 개념 정의 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concept_code VARCHAR(50) UNIQUE NOT NULL COMMENT '개념 코드 (예: FRAC_ADD)',
    concept_name VARCHAR(200) NOT NULL COMMENT '개념 이름',
    concept_name_ko VARCHAR(200) COMMENT '한글 개념 이름',
    description TEXT COMMENT '개념 설명',
    parent_concept_id INT DEFAULT NULL COMMENT '상위 개념 ID',
    difficulty_level INT DEFAULT 1 COMMENT '난이도 (1-5)',
    subject VARCHAR(50) DEFAULT 'mathematics' COMMENT '과목',
    grade_level VARCHAR(20) COMMENT '학년',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_concept_id) REFERENCES concepts(id) ON DELETE SET NULL,
    INDEX idx_concept_code (concept_code),
    INDEX idx_subject_grade (subject, grade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학습 개념 정의';

-- ========================================
-- 2. Moodle 퀴즈-개념 매핑 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS concept_mappings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL COMMENT 'Moodle 문제 ID',
    concept_id INT NOT NULL COMMENT '개념 ID',
    weight DECIMAL(3,2) DEFAULT 1.00 COMMENT '개념 비중 (0.0-1.0)',
    is_primary BOOLEAN DEFAULT TRUE COMMENT '주요 개념 여부',
    mapping_source ENUM('manual', 'auto', 'ai') DEFAULT 'manual' COMMENT '매핑 방법',
    confidence_score DECIMAL(3,2) DEFAULT 1.00 COMMENT '신뢰도 (자동매핑시)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_mapping (moodle_question_id, concept_id),
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_concept (concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moodle 문제-개념 매핑';

-- ========================================
-- 3. 학생 분석 캐시 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS student_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 학생 ID',
    concept_id INT NOT NULL COMMENT '개념 ID',
    total_attempts INT DEFAULT 0 COMMENT '총 시도 횟수',
    correct_attempts INT DEFAULT 0 COMMENT '정답 횟수',
    incorrect_attempts INT DEFAULT 0 COMMENT '오답 횟수',
    skipped_attempts INT DEFAULT 0 COMMENT '건너뛴 횟수',
    avg_response_time DECIMAL(10,2) DEFAULT 0 COMMENT '평균 응답 시간(초)',
    min_response_time DECIMAL(10,2) DEFAULT 0 COMMENT '최소 응답 시간(초)',
    max_response_time DECIMAL(10,2) DEFAULT 0 COMMENT '최대 응답 시간(초)',
    accuracy_rate DECIMAL(5,2) DEFAULT 0 COMMENT '정답률 (%)',
    last_attempt_date TIMESTAMP NULL COMMENT '마지막 시도 일시',
    first_attempt_date TIMESTAMP NULL COMMENT '첫 시도 일시',
    analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '분석 일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_concept (moodle_user_id, concept_id),
    INDEX idx_user (moodle_user_id),
    INDEX idx_concept (concept_id),
    INDEX idx_accuracy (accuracy_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생별 개념 분석 데이터';

-- ========================================
-- 4. 개념 회피 패턴 감지 결과
-- ========================================
CREATE TABLE IF NOT EXISTS avoidance_patterns (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 학생 ID',
    concept_id INT NOT NULL COMMENT '회피된 개념 ID',
    avoidance_type ENUM('low_accuracy', 'quick_skip', 'pattern_avoid', 'time_abnormal', 'mixed') NOT NULL COMMENT '회피 유형',
    confidence_score DECIMAL(5,2) NOT NULL COMMENT '신뢰도 점수 (0-100)',
    evidence JSON COMMENT '증거 데이터 (JSON)',
    severity_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' COMMENT '심각도',
    detection_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '감지 일시',
    is_resolved BOOLEAN DEFAULT FALSE COMMENT '해결 여부',
    teacher_notified BOOLEAN DEFAULT FALSE COMMENT '교사 알림 여부',
    notes TEXT COMMENT '메모',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    INDEX idx_user (moodle_user_id),
    INDEX idx_concept (concept_id),
    INDEX idx_detection_date (detection_date),
    INDEX idx_severity (severity_level),
    INDEX idx_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='개념 회피 패턴 감지 결과';

-- ========================================
-- 5. Moodle 동기화 로그
-- ========================================
CREATE TABLE IF NOT EXISTS sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type ENUM('quiz_attempts', 'questions', 'users', 'full') NOT NULL COMMENT '동기화 유형',
    sync_status ENUM('started', 'success', 'failed', 'partial') NOT NULL COMMENT '동기화 상태',
    records_processed INT DEFAULT 0 COMMENT '처리된 레코드 수',
    records_failed INT DEFAULT 0 COMMENT '실패한 레코드 수',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '시작 시간',
    end_time TIMESTAMP NULL COMMENT '종료 시간',
    error_message TEXT COMMENT '에러 메시지',
    details JSON COMMENT '상세 정보 (JSON)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sync_type (sync_type),
    INDEX idx_sync_status (sync_status),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Moodle 동기화 로그';

-- ========================================
-- 6. 시스템 설정 테이블
-- ========================================
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL COMMENT '설정 키',
    setting_value TEXT COMMENT '설정 값',
    setting_type ENUM('string', 'integer', 'decimal', 'boolean', 'json') DEFAULT 'string' COMMENT '데이터 타입',
    description VARCHAR(500) COMMENT '설명',
    is_editable BOOLEAN DEFAULT TRUE COMMENT '편집 가능 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='시스템 설정';

-- ========================================
-- 7. 감지 알고리즘 설정
-- ========================================
CREATE TABLE IF NOT EXISTS detection_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rule_name VARCHAR(100) UNIQUE NOT NULL COMMENT '규칙 이름',
    rule_type ENUM('threshold', 'pattern', 'statistical', 'ml') NOT NULL COMMENT '규칙 타입',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    parameters JSON NOT NULL COMMENT '규칙 매개변수',
    priority INT DEFAULT 1 COMMENT '우선순위 (1-10)',
    description TEXT COMMENT '설명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_active (is_active),
    INDEX idx_priority (priority)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='감지 알고리즘 규칙';

-- ========================================
-- 초기 데이터 삽입
-- ========================================

-- 시스템 설정 초기값
INSERT INTO system_settings (setting_key, setting_value, setting_type, description, is_editable) VALUES
('moodle_db_host', 'localhost', 'string', 'Moodle 데이터베이스 호스트', TRUE),
('moodle_db_name', 'moodle', 'string', 'Moodle 데이터베이스 이름', TRUE),
('moodle_db_user', 'moodle_user', 'string', 'Moodle 데이터베이스 사용자', TRUE),
('moodle_db_password', '', 'string', 'Moodle 데이터베이스 비밀번호', TRUE),
('moodle_table_prefix', 'mdl_', 'string', 'Moodle 테이블 접두사', TRUE),
('sync_interval_minutes', '30', 'integer', '동기화 간격 (분)', TRUE),
('min_attempts_for_analysis', '3', 'integer', '분석 최소 시도 횟수', TRUE),
('accuracy_threshold_low', '40', 'decimal', '낮은 정답률 임계값 (%)', TRUE),
('accuracy_threshold_critical', '25', 'decimal', '매우 낮은 정답률 임계값 (%)', TRUE),
('quick_skip_time_seconds', '10', 'integer', '빠른 건너뛰기 판단 시간 (초)', TRUE),
('abnormal_time_multiplier', '3.0', 'decimal', '비정상 시간 배수', TRUE),
('confidence_threshold', '70', 'decimal', '회피 패턴 신뢰도 임계값 (%)', TRUE);

-- 감지 규칙 초기값
INSERT INTO detection_rules (rule_name, rule_type, is_active, parameters, priority, description) VALUES
('low_accuracy_rule', 'threshold', TRUE,
 '{"min_attempts": 3, "accuracy_threshold": 40, "severity_map": {"25": "critical", "40": "high", "55": "medium", "70": "low"}}',
 1, '낮은 정답률 기반 회피 감지'),

('quick_skip_rule', 'pattern', TRUE,
 '{"min_skips": 2, "skip_time_threshold": 10, "consecutive_threshold": 3}',
 2, '빠른 건너뛰기 패턴 감지'),

('time_abnormality_rule', 'statistical', TRUE,
 '{"min_attempts": 5, "z_score_threshold": 2.5, "multiplier": 3.0}',
 3, '비정상 응답 시간 감지'),

('repeated_failure_rule', 'pattern', TRUE,
 '{"consecutive_failures": 4, "failure_rate_threshold": 0.8, "window_size": 10}',
 4, '반복된 실패 패턴 감지'),

('avoidance_pattern_rule', 'pattern', TRUE,
 '{"similar_concept_comparison": true, "performance_gap_threshold": 30}',
 5, '특정 개념 회피 패턴 감지');

-- 샘플 개념 데이터
INSERT INTO concepts (concept_code, concept_name, concept_name_ko, description, difficulty_level, subject, grade_level) VALUES
('MATH_BASIC', 'Basic Mathematics', '기초 수학', '기본적인 수학 개념', 1, 'mathematics', 'elementary'),
('NUM_BASIC', 'Basic Numbers', '기초 수 개념', '수의 기본 개념과 연산', 1, 'mathematics', 'elementary'),
('ADD_SUB', 'Addition and Subtraction', '덧셈과 뺄셈', '기본 덧셈과 뺄셈', 1, 'mathematics', 'elementary'),
('MULT_DIV', 'Multiplication and Division', '곱셈과 나눗셈', '기본 곱셈과 나눗셈', 2, 'mathematics', 'elementary'),
('FRAC_BASIC', 'Basic Fractions', '기초 분수', '분수의 기본 개념', 2, 'mathematics', 'elementary'),
('FRAC_ADD', 'Fraction Addition', '분수 덧셈', '분수의 덧셈 연산', 3, 'mathematics', 'elementary'),
('FRAC_SUB', 'Fraction Subtraction', '분수 뺄셈', '분수의 뺄셈 연산', 3, 'mathematics', 'elementary'),
('FRAC_MULT', 'Fraction Multiplication', '분수 곱셈', '분수의 곱셈 연산', 3, 'mathematics', 'middle'),
('FRAC_DIV', 'Fraction Division', '분수 나눗셈', '분수의 나눗셈 연산', 4, 'mathematics', 'middle'),
('DECIMAL_BASIC', 'Basic Decimals', '기초 소수', '소수의 기본 개념', 2, 'mathematics', 'elementary'),
('PERCENT_BASIC', 'Basic Percentages', '기초 백분율', '백분율의 기본 개념', 3, 'mathematics', 'middle'),
('RATIO_PROP', 'Ratio and Proportion', '비율과 비례', '비율과 비례 개념', 3, 'mathematics', 'middle'),
('ALGEBRA_BASIC', 'Basic Algebra', '기초 대수', '대수의 기본 개념', 4, 'mathematics', 'middle'),
('EQUATION_LINEAR', 'Linear Equations', '일차방정식', '일차방정식 풀이', 4, 'mathematics', 'middle'),
('GEOMETRY_BASIC', 'Basic Geometry', '기초 기하', '기하의 기본 개념', 3, 'mathematics', 'middle');

-- 개념 계층 구조 설정 (parent_concept_id 업데이트)
UPDATE concepts SET parent_concept_id = (SELECT id FROM (SELECT * FROM concepts) AS c WHERE c.concept_code = 'MATH_BASIC') WHERE concept_code = 'NUM_BASIC';
UPDATE concepts SET parent_concept_id = (SELECT id FROM (SELECT * FROM concepts) AS c WHERE c.concept_code = 'NUM_BASIC') WHERE concept_code IN ('ADD_SUB', 'MULT_DIV');
UPDATE concepts SET parent_concept_id = (SELECT id FROM (SELECT * FROM concepts) AS c WHERE c.concept_code = 'NUM_BASIC') WHERE concept_code = 'FRAC_BASIC';
UPDATE concepts SET parent_concept_id = (SELECT id FROM (SELECT * FROM concepts) AS c WHERE c.concept_code = 'FRAC_BASIC') WHERE concept_code IN ('FRAC_ADD', 'FRAC_SUB', 'FRAC_MULT', 'FRAC_DIV');
UPDATE concepts SET parent_concept_id = (SELECT id FROM (SELECT * FROM concepts) AS c WHERE c.concept_code = 'NUM_BASIC') WHERE concept_code IN ('DECIMAL_BASIC', 'PERCENT_BASIC');
UPDATE concepts SET parent_concept_id = (SELECT id FROM (SELECT * FROM concepts) AS c WHERE c.concept_code = 'MATH_BASIC') WHERE concept_code IN ('ALGEBRA_BASIC', 'GEOMETRY_BASIC', 'RATIO_PROP');
UPDATE concepts SET parent_concept_id = (SELECT id FROM (SELECT * FROM concepts) AS c WHERE c.concept_code = 'ALGEBRA_BASIC') WHERE concept_code = 'EQUATION_LINEAR';

-- ========================================
-- 뷰: 개념 회피 대시보드용
-- ========================================
CREATE OR REPLACE VIEW v_avoidance_dashboard AS
SELECT
    ap.id,
    ap.moodle_user_id,
    ap.concept_id,
    c.concept_code,
    c.concept_name,
    c.concept_name_ko,
    ap.avoidance_type,
    ap.confidence_score,
    ap.severity_level,
    ap.detection_date,
    ap.is_resolved,
    ap.teacher_notified,
    sa.total_attempts,
    sa.accuracy_rate,
    sa.avg_response_time,
    ap.evidence
FROM avoidance_patterns ap
JOIN concepts c ON ap.concept_id = c.id
LEFT JOIN student_analysis sa ON ap.moodle_user_id = sa.moodle_user_id AND ap.concept_id = sa.concept_id
ORDER BY ap.detection_date DESC;

-- ========================================
-- 뷰: 학생별 개념 분석 요약
-- ========================================
CREATE OR REPLACE VIEW v_student_concept_summary AS
SELECT
    sa.moodle_user_id,
    c.concept_code,
    c.concept_name,
    c.concept_name_ko,
    c.difficulty_level,
    sa.total_attempts,
    sa.correct_attempts,
    sa.incorrect_attempts,
    sa.skipped_attempts,
    sa.accuracy_rate,
    sa.avg_response_time,
    CASE
        WHEN sa.accuracy_rate < 25 THEN 'critical'
        WHEN sa.accuracy_rate < 40 THEN 'high'
        WHEN sa.accuracy_rate < 55 THEN 'medium'
        WHEN sa.accuracy_rate < 70 THEN 'low'
        ELSE 'none'
    END AS risk_level,
    sa.last_attempt_date
FROM student_analysis sa
JOIN concepts c ON sa.concept_id = c.id
WHERE sa.total_attempts >= 3;

-- ========================================
-- 인덱스 추가 최적화
-- ========================================
ALTER TABLE avoidance_patterns ADD INDEX idx_user_concept_date (moodle_user_id, concept_id, detection_date);
ALTER TABLE student_analysis ADD INDEX idx_user_accuracy (moodle_user_id, accuracy_rate);

-- ========================================
-- 완료
-- ========================================
SELECT 'Database schema created successfully!' AS status;
