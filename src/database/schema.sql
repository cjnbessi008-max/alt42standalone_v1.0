-- Transform Scene Database Schema
-- MySQL 5.7 Compatible
-- Moodle 3.7 Integration

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS moodle_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE moodle_db;

-- 1. 문제 테이블 (transform_problems)
-- 함수 변환 문제 정보를 저장
CREATE TABLE IF NOT EXISTS transform_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    module_id INT,
    problem_type ENUM('translation', 'reflection', 'scaling', 'combination') NOT NULL DEFAULT 'translation',
    original_function VARCHAR(255) NOT NULL COMMENT '원본 함수 (예: x^2)',
    target_function VARCHAR(255) NOT NULL COMMENT '변환된 함수 (예: (x-2)^2+3)',
    transform_type VARCHAR(50) NOT NULL COMMENT '변환 타입',
    transform_params JSON COMMENT '변환 매개변수 (h, k, a, b 등)',
    difficulty ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    description TEXT COMMENT '문제 설명',
    hints JSON COMMENT '힌트 배열',
    correct_answer TEXT COMMENT '정답',
    max_attempts INT DEFAULT 3 COMMENT '최대 시도 횟수',
    time_limit INT DEFAULT 300 COMMENT '제한 시간(초)',
    points INT DEFAULT 10 COMMENT '배점',
    status ENUM('active', 'inactive', 'draft') NOT NULL DEFAULT 'active',
    created_by INT NOT NULL COMMENT '생성자 (교사 ID)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_course_id (course_id),
    INDEX idx_problem_type (problem_type),
    INDEX idx_difficulty (difficulty),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='함수 변환 문제 정보';

-- 2. 학생 답안 테이블 (transform_answers)
-- 학생들의 답안 및 제출 기록
CREATE TABLE IF NOT EXISTS transform_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT '학생 ID (Moodle user ID)',
    problem_id INT NOT NULL COMMENT '문제 ID',
    answer_data JSON NOT NULL COMMENT '답안 데이터',
    is_correct TINYINT(1) NOT NULL DEFAULT 0 COMMENT '정답 여부',
    attempt_number INT NOT NULL DEFAULT 1 COMMENT '시도 번호',
    time_spent INT COMMENT '소요 시간(초)',
    score DECIMAL(5,2) DEFAULT 0.00 COMMENT '획득 점수',
    feedback TEXT COMMENT '피드백',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_id (student_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_is_correct (is_correct),
    INDEX idx_submitted_at (submitted_at),
    INDEX idx_student_problem (student_id, problem_id),

    FOREIGN KEY (problem_id) REFERENCES transform_problems(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학생 답안 및 제출 기록';

-- 3. 학생 진행 상황 테이블 (transform_progress)
-- 학생별 코스/모듈 진행 상황 추적
CREATE TABLE IF NOT EXISTS transform_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    module_id INT,
    total_problems INT DEFAULT 0 COMMENT '전체 문제 수',
    completed_problems INT DEFAULT 0 COMMENT '완료한 문제 수',
    correct_answers INT DEFAULT 0 COMMENT '정답 수',
    total_attempts INT DEFAULT 0 COMMENT '전체 시도 횟수',
    total_time_spent INT DEFAULT 0 COMMENT '총 소요 시간(초)',
    accuracy_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '정확도 (%)',
    last_activity_at TIMESTAMP NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    UNIQUE KEY unique_student_course (student_id, course_id, module_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_accuracy_rate (accuracy_rate),
    INDEX idx_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학생별 진행 상황 추적';

-- 4. 변환 타입 메타데이터 테이블 (transform_types)
-- 변환 타입별 메타정보
CREATE TABLE IF NOT EXISTS transform_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type_code VARCHAR(50) NOT NULL UNIQUE COMMENT '변환 타입 코드',
    type_name_ko VARCHAR(100) NOT NULL COMMENT '한국어 이름',
    type_name_en VARCHAR(100) NOT NULL COMMENT '영어 이름',
    description TEXT COMMENT '설명',
    formula_template VARCHAR(255) COMMENT '수식 템플릿',
    difficulty_level ENUM('easy', 'medium', 'hard') NOT NULL DEFAULT 'medium',
    order_index INT DEFAULT 0 COMMENT '표시 순서',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_type_code (type_code),
    INDEX idx_order_index (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='변환 타입 메타데이터';

-- 5. 세션 로그 테이블 (transform_sessions)
-- 사용자 세션 및 활동 로그
CREATE TABLE IF NOT EXISTS transform_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    course_id INT,
    problem_id INT,
    action_type ENUM('start', 'view', 'submit', 'complete', 'exit') NOT NULL,
    action_data JSON COMMENT '활동 데이터',
    ip_address VARCHAR(45) COMMENT 'IP 주소',
    user_agent TEXT COMMENT 'User Agent',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_id (student_id),
    INDEX idx_session_id (session_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='사용자 세션 및 활동 로그';

-- 초기 데이터 삽입

-- 변환 타입 메타데이터
INSERT INTO transform_types (type_code, type_name_ko, type_name_en, description, formula_template, difficulty_level, order_index) VALUES
('translation_horizontal', '수평 이동', 'Horizontal Translation', 'f(x) → f(x - h): 그래프를 x축 방향으로 h만큼 이동', 'f(x - h)', 'easy', 1),
('translation_vertical', '수직 이동', 'Vertical Translation', 'f(x) → f(x) + k: 그래프를 y축 방향으로 k만큼 이동', 'f(x) + k', 'easy', 2),
('translation_combined', '평행 이동', 'Combined Translation', 'f(x) → f(x - h) + k: 그래프를 (h, k)만큼 평행이동', 'f(x - h) + k', 'medium', 3),
('reflection_x', 'x축 대칭', 'Reflection over x-axis', 'f(x) → -f(x): x축에 대해 대칭이동', '-f(x)', 'easy', 4),
('reflection_y', 'y축 대칭', 'Reflection over y-axis', 'f(x) → f(-x): y축에 대해 대칭이동', 'f(-x)', 'easy', 5),
('reflection_origin', '원점 대칭', 'Reflection over origin', 'f(x) → -f(-x): 원점에 대해 대칭이동', '-f(-x)', 'medium', 6),
('scaling_vertical', '수직 확대/축소', 'Vertical Scaling', 'f(x) → a·f(x): y축 방향으로 a배 확대/축소', 'a * f(x)', 'medium', 7),
('scaling_horizontal', '수평 확대/축소', 'Horizontal Scaling', 'f(x) → f(b·x): x축 방향으로 1/b배 확대/축소', 'f(b * x)', 'medium', 8),
('combination', '복합 변환', 'Combination', '여러 변환의 조합', 'a * f(b * x - h) + k', 'hard', 9);

-- 샘플 문제 데이터
INSERT INTO transform_problems (
    course_id, problem_type, original_function, target_function,
    transform_type, transform_params, difficulty, description, hints,
    correct_answer, created_by
) VALUES
-- 문제 1: 수평 이동
(1, 'translation', 'x^2', '(x-2)^2', 'translation_horizontal',
'{"h": 2, "direction": "right"}', 'easy',
'함수 f(x) = x²를 오른쪽으로 2만큼 이동시킨 그래프를 그리세요.',
'["평행이동 공식: f(x-h)는 오른쪽으로 h만큼 이동", "h = 2를 적용하면 f(x-2) = (x-2)²"]',
'(x-2)^2', 1),

-- 문제 2: 수직 이동
(1, 'translation', 'x^2', 'x^2+3', 'translation_vertical',
'{"k": 3, "direction": "up"}', 'easy',
'함수 f(x) = x²를 위로 3만큼 이동시킨 그래프를 그리세요.',
'["평행이동 공식: f(x)+k는 위로 k만큼 이동", "k = 3을 적용하면 f(x)+3 = x²+3"]',
'x^2+3', 1),

-- 문제 3: 평행 이동
(1, 'translation', 'x^2', '(x-1)^2+2', 'translation_combined',
'{"h": 1, "k": 2}', 'medium',
'함수 f(x) = x²를 오른쪽으로 1, 위로 2만큼 이동시킨 그래프를 그리세요.',
'["평행이동 공식: f(x-h)+k", "h = 1, k = 2를 적용"]',
'(x-1)^2+2', 1),

-- 문제 4: x축 대칭
(1, 'reflection', 'x^2', '-x^2', 'reflection_x',
'{"axis": "x"}', 'easy',
'함수 f(x) = x²를 x축에 대해 대칭이동시킨 그래프를 그리세요.',
'["x축 대칭 공식: -f(x)", "f(x) = x²이므로 -f(x) = -x²"]',
'-x^2', 1),

-- 문제 5: y축 대칭
(1, 'reflection', 'x^2', 'x^2', 'reflection_y',
'{"axis": "y"}', 'easy',
'함수 f(x) = x²를 y축에 대해 대칭이동시킨 그래프를 그리세요.',
'["y축 대칭 공식: f(-x)", "f(x) = x²은 우함수이므로 f(-x) = f(x)"]',
'x^2', 1),

-- 문제 6: 수직 확대
(1, 'scaling', 'x^2', '2*x^2', 'scaling_vertical',
'{"a": 2}', 'medium',
'함수 f(x) = x²를 y축 방향으로 2배 확대한 그래프를 그리세요.',
'["수직 확대 공식: a·f(x)", "a = 2를 적용하면 2·f(x) = 2x²"]',
'2*x^2', 1),

-- 문제 7: 복합 변환
(1, 'combination', 'x^2', '2*(x-1)^2+3', 'combination',
'{"a": 2, "h": 1, "k": 3}', 'hard',
'함수 f(x) = x²에 여러 변환을 적용한 그래프를 그리세요: 오른쪽 1, 위 3, y축 방향 2배',
'["변환 순서: 평행이동 → 확대/축소", "최종 형태: a·f(x-h)+k = 2(x-1)²+3"]',
'2*(x-1)^2+3', 1);

-- 뷰: 학생별 통계
CREATE OR REPLACE VIEW student_statistics AS
SELECT
    p.student_id,
    COUNT(DISTINCT p.problem_id) as problems_attempted,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_count,
    AVG(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 100 as accuracy_rate,
    AVG(a.time_spent) as avg_time_spent,
    SUM(a.score) as total_score,
    MAX(a.submitted_at) as last_activity
FROM transform_progress p
LEFT JOIN transform_answers a ON p.student_id = a.student_id
GROUP BY p.student_id;

-- 뷰: 문제별 통계
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    p.id as problem_id,
    p.problem_type,
    p.difficulty,
    COUNT(a.id) as total_attempts,
    SUM(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) as correct_attempts,
    AVG(CASE WHEN a.is_correct = 1 THEN 1 ELSE 0 END) * 100 as success_rate,
    AVG(a.time_spent) as avg_time_spent,
    COUNT(DISTINCT a.student_id) as unique_students
FROM transform_problems p
LEFT JOIN transform_answers a ON p.id = a.problem_id
WHERE p.status = 'active'
GROUP BY p.id, p.problem_type, p.difficulty;

-- 권한 설정 (선택사항)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON moodle_db.* TO 'moodle_user'@'localhost';
-- FLUSH PRIVILEGES;
