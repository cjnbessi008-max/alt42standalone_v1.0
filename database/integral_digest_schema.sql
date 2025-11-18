-- ============================================================================
-- Integral Digest Database Schema
-- MySQL 5.7 Compatible Schema for Moodle 3.7 Integration
-- ============================================================================

-- 적분 문제 요약 테이블 (Problem Digest/Summary)
CREATE TABLE IF NOT EXISTS mdl_integral_digest (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    problem_id CHAR(36) NOT NULL COMMENT 'UUID of the integral problem',
    module_id CHAR(36) NOT NULL COMMENT 'Reference to module',

    -- 문제 기본 정보 (Problem Overview)
    problem_title VARCHAR(255) NOT NULL,
    problem_type VARCHAR(50) NOT NULL COMMENT 'definite_integral, indefinite_integral, area, volume',
    difficulty_level TINYINT(1) UNSIGNED NOT NULL DEFAULT 1 COMMENT '1-5 난이도',

    -- 수학적 표현 (Mathematical Representation)
    integrand TEXT NOT NULL COMMENT '피적분함수 (e.g., x^2 + 2x + 1)',
    lower_bound VARCHAR(100) DEFAULT NULL COMMENT '적분 하한',
    upper_bound VARCHAR(100) DEFAULT NULL COMMENT '적분 상한',
    variable_of_integration VARCHAR(10) DEFAULT 'x' COMMENT '적분 변수',

    -- 개념 요약 (Concept Overview)
    concept_overview TEXT COMMENT '문제가 다루는 핵심 개념 설명',
    key_concepts JSON COMMENT '핵심 개념 배열 ["개념1", "개념2", ...]',
    learning_objectives JSON COMMENT '학습 목표 리스트',
    prerequisite_skills JSON COMMENT '선수 학습 개념',

    -- 솔루션 다이제스트 (Solution Digest)
    solution_steps JSON COMMENT '단계별 해법 [{step, action, formula, result}]',
    final_answer TEXT COMMENT '최종 정답',
    alternative_methods JSON COMMENT '대안적 풀이법',
    solution_explanation TEXT COMMENT '해법 설명',

    -- 시각화 정보 (Visualization Data)
    visual_type VARCHAR(50) DEFAULT 'graph' COMMENT 'graph, shaded_area, riemann_sum, etc.',
    graph_config JSON COMMENT '그래프 설정 {domain, range, features}',
    has_animation BOOLEAN DEFAULT FALSE COMMENT '애니메이션 포함 여부',

    -- 도전 분석 (Challenge Analysis)
    common_mistakes JSON COMMENT '흔한 실수 목록',
    difficulty_explanation TEXT COMMENT '난이도 설명',
    time_estimate_minutes INT DEFAULT 10 COMMENT '예상 소요 시간',

    -- 성과 통계 (Performance Stats)
    avg_attempts DECIMAL(4,2) DEFAULT 0.00 COMMENT '평균 시도 횟수',
    success_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '정답률 (%)',
    avg_time_seconds INT DEFAULT 0 COMMENT '평균 풀이 시간 (초)',
    total_attempts INT DEFAULT 0 COMMENT '총 시도 횟수',

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_problem (problem_id),
    INDEX idx_module (module_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_type (problem_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='적분 문제 요약 및 다이제스트';

-- 학생별 문제 진행 상황
CREATE TABLE IF NOT EXISTS mdl_student_integral_progress (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    problem_id CHAR(36) NOT NULL,
    digest_id BIGINT(10) UNSIGNED NOT NULL,

    -- 진행 상태
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' COMMENT 'not_started, in_progress, completed, mastered',
    current_step INT DEFAULT 0 COMMENT '현재 진행 중인 단계',
    total_steps INT DEFAULT 0 COMMENT '전체 단계 수',

    -- 학습 데이터
    attempts_count INT DEFAULT 0,
    hints_used JSON COMMENT '사용한 힌트 목록',
    time_spent_seconds INT DEFAULT 0,
    confidence_level TINYINT(1) COMMENT '1-5 학생 자신감 수준',

    -- 답안 정보
    last_answer TEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    partial_credit DECIMAL(5,2) DEFAULT 0.00 COMMENT '부분 점수 (0-100)',

    -- 피드백
    feedback_shown JSON COMMENT '표시된 피드백',
    next_recommended_step TEXT COMMENT '다음 권장 학습 단계',

    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_student_problem (student_id, problem_id),
    INDEX idx_student (student_id),
    INDEX idx_digest (digest_id),
    INDEX idx_status (status),
    FOREIGN KEY (digest_id) REFERENCES mdl_integral_digest(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생별 적분 문제 진행 상황';

-- 문제 요약 뷰 (Digest View) - 모바일 앱에서 사용
CREATE TABLE IF NOT EXISTS mdl_integral_digest_view (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    digest_id BIGINT(10) UNSIGNED NOT NULL,
    view_type VARCHAR(50) NOT NULL COMMENT 'summary, detailed, solution, stats',

    -- 렌더링 정보
    render_config JSON COMMENT '모바일 렌더링 설정',
    layout_template VARCHAR(100) COMMENT '사용할 레이아웃 템플릿',

    -- 컨텐츠
    title VARCHAR(255),
    summary_text TEXT COMMENT '요약 텍스트 (한국어 지원)',
    content_sections JSON COMMENT '섹션별 컨텐츠',

    -- 인터랙션
    interactive_elements JSON COMMENT '인터랙티브 요소 설정',
    navigation_options JSON COMMENT '네비게이션 옵션',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_digest (digest_id),
    INDEX idx_view_type (view_type),
    FOREIGN KEY (digest_id) REFERENCES mdl_integral_digest(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='모바일 앱용 문제 요약 뷰';

-- 모듈 메타데이터 (Module Metadata)
CREATE TABLE IF NOT EXISTS mdl_integral_modules (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL DEFAULT 'Mathematics',
    topic VARCHAR(100) NOT NULL DEFAULT 'Integrals',
    grade_level VARCHAR(20),
    teacher_id BIGINT(10) UNSIGNED,

    status ENUM('generating', 'active', 'archived') DEFAULT 'generating',

    -- AI 생성 데이터
    world_model LONGTEXT COMMENT 'JSON world model',
    generated_schema LONGTEXT COMMENT 'JSON schema definition',

    problems_count INT DEFAULT 0,
    version INT DEFAULT 1,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_teacher (teacher_id),
    INDEX idx_status (status),
    INDEX idx_topic (topic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='적분 문제 모듈';

-- 적분 문제 상세 정보
CREATE TABLE IF NOT EXISTS mdl_integral_problems (
    id CHAR(36) PRIMARY KEY,
    module_id CHAR(36) NOT NULL,
    digest_id BIGINT(10) UNSIGNED,

    problem_type VARCHAR(50) NOT NULL,
    difficulty_level TINYINT(1) UNSIGNED NOT NULL DEFAULT 1,

    -- 수학적 정의
    integrand LONGTEXT NOT NULL,
    lower_bound VARCHAR(255),
    upper_bound VARCHAR(255),
    variable_of_integration VARCHAR(10) DEFAULT 'x',

    -- 정답
    correct_answer LONGTEXT NOT NULL,
    solution_steps JSON,

    -- 입력 형식
    input_format VARCHAR(50) DEFAULT 'symbolic_entry' COMMENT 'symbolic, numeric, multiple_choice, step_by_step',
    tolerance_level DECIMAL(10,6) DEFAULT 0.001,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    INDEX idx_module (module_id),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_digest (digest_id),
    FOREIGN KEY (module_id) REFERENCES mdl_integral_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (digest_id) REFERENCES mdl_integral_digest(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='적분 문제 상세 정보';

-- 학생 답안 기록
CREATE TABLE IF NOT EXISTS mdl_student_attempts (
    id CHAR(36) PRIMARY KEY,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    problem_id CHAR(36) NOT NULL,

    submitted_answer LONGTEXT,
    is_correct BOOLEAN DEFAULT FALSE,
    confidence_level TINYINT(1),

    solution_path_taken JSON COMMENT '학생이 따른 풀이 경로',
    time_spent_seconds INT DEFAULT 0,
    attempts_count TINYINT DEFAULT 1,

    feedback_shown JSON COMMENT '표시된 힌트 및 피드백',

    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_attempted (attempted_at),
    FOREIGN KEY (problem_id) REFERENCES mdl_integral_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 답안 기록';

-- 샘플 데이터 삽입 (Example Data)
-- INSERT INTO mdl_integral_modules VALUES
-- (UUID(), '적분의 기초', 'Mathematics', 'Integrals', 'Grade 12', NULL, 'active', '{}', '{}', 0, 1, NOW(), NOW());

-- INSERT INTO mdl_integral_digest (problem_id, module_id, problem_title, problem_type, difficulty_level,
--     integrand, lower_bound, upper_bound, variable_of_integration,
--     concept_overview, key_concepts, solution_steps, final_answer, common_mistakes)
-- VALUES (
--     UUID(),
--     (SELECT id FROM mdl_integral_modules LIMIT 1),
--     '다항식의 정적분',
--     'definite_integral',
--     2,
--     'x^2 + 2x + 1',
--     '0',
--     '2',
--     'x',
--     '다항식 함수의 정적분을 계산하고 미적분학의 기본정리를 적용합니다.',
--     '["부정적분", "미적분학의 기본정리", "구간에서의 평가"]',
--     '[{"step": 1, "action": "부정적분 구하기", "formula": "F(x) = x^3/3 + x^2 + x + C"},
--       {"step": 2, "action": "상한에서 평가", "formula": "F(2) = 8/3 + 4 + 2"},
--       {"step": 3, "action": "하한에서 평가", "formula": "F(0) = 0"},
--       {"step": 4, "action": "차이 계산", "result": "8/3 + 6 = 26/3"}]',
--     '26/3',
--     '["부정적분 구할 때 계수 실수", "상한과 하한 순서 바꿈", "적분상수 C 처리 오류"]'
-- );
