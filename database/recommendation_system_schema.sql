-- ============================================================================
-- Intelligent Recommendation System Schema
-- AI 기반 적분 문제 추천 시스템
-- MySQL 5.7 Compatible
-- ============================================================================

-- 학생 학습 프로필 테이블
CREATE TABLE IF NOT EXISTS mdl_student_learning_profile (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    module_id CHAR(36) NOT NULL,

    -- 전체 성과 지표
    overall_performance_score DECIMAL(5,2) DEFAULT 50.00 COMMENT '전체 성과 점수 (0-100)',
    learning_speed ENUM('slow', 'average', 'fast') DEFAULT 'average' COMMENT '학습 속도',
    consistency_score DECIMAL(5,2) DEFAULT 50.00 COMMENT '일관성 점수 (0-100)',

    -- 난이도별 성과
    difficulty_1_success_rate DECIMAL(5,2) DEFAULT 0.00,
    difficulty_2_success_rate DECIMAL(5,2) DEFAULT 0.00,
    difficulty_3_success_rate DECIMAL(5,2) DEFAULT 0.00,
    difficulty_4_success_rate DECIMAL(5,2) DEFAULT 0.00,
    difficulty_5_success_rate DECIMAL(5,2) DEFAULT 0.00,

    -- 현재 적정 난이도
    current_difficulty_level TINYINT(1) DEFAULT 1 COMMENT '현재 적정 난이도 (1-5)',
    recommended_difficulty_level TINYINT(1) DEFAULT 1 COMMENT '추천 난이도 (1-5)',

    -- 개념별 숙련도 (JSON)
    concept_mastery JSON COMMENT '{"개념명": 숙련도점수(0-100), ...}',
    weak_concepts JSON COMMENT '약점 개념 목록',
    strong_concepts JSON COMMENT '강점 개념 목록',

    -- 학습 패턴
    preferred_problem_types JSON COMMENT '선호하는 문제 유형',
    avg_time_per_problem INT DEFAULT 0 COMMENT '문제당 평균 시간 (초)',
    optimal_study_time INT DEFAULT 0 COMMENT '최적 학습 시간 (초)',

    -- 추천 이력
    last_recommended_problem_id CHAR(36) COMMENT '마지막 추천 문제 ID',
    last_recommendation_accepted BOOLEAN DEFAULT NULL COMMENT '마지막 추천 수락 여부',
    recommendation_acceptance_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT '추천 수락률 (%)',

    -- 학습 목표
    target_difficulty_level TINYINT(1) DEFAULT 3 COMMENT '목표 난이도',
    target_completion_date TIMESTAMP NULL COMMENT '목표 완료 날짜',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_student_module (student_id, module_id),
    INDEX idx_student (student_id),
    INDEX idx_module (module_id),
    INDEX idx_difficulty (current_difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 학습 프로필';

-- 추천 기록 테이블
CREATE TABLE IF NOT EXISTS mdl_recommendation_history (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    problem_id CHAR(36) NOT NULL,

    -- 추천 정보
    recommendation_type ENUM('difficulty_based', 'concept_based', 'mixed', 'review', 'challenge') NOT NULL,
    recommendation_reason TEXT COMMENT '추천 이유',
    recommendation_score DECIMAL(5,2) COMMENT '추천 점수 (0-100)',

    -- 추천 컨텍스트
    student_current_level TINYINT(1) COMMENT '추천 시점의 학생 레벨',
    problem_difficulty TINYINT(1) COMMENT '문제 난이도',
    expected_success_rate DECIMAL(5,2) COMMENT '예상 정답률 (%)',

    -- 추천 알고리즘 정보
    algorithm_version VARCHAR(20) DEFAULT '1.0',
    recommendation_factors JSON COMMENT '추천 결정 요인들',

    -- 결과
    was_accepted BOOLEAN DEFAULT FALSE COMMENT '추천 수락 여부',
    was_attempted BOOLEAN DEFAULT FALSE COMMENT '시도 여부',
    was_successful BOOLEAN DEFAULT NULL COMMENT '성공 여부',
    actual_time_spent INT DEFAULT 0 COMMENT '실제 소요 시간',

    -- 피드백
    student_feedback_rating TINYINT(1) COMMENT '학생 피드백 (1-5)',
    student_feedback_text TEXT COMMENT '학생 피드백 텍스트',

    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,

    PRIMARY KEY (id),
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_type (recommendation_type),
    INDEX idx_recommended_at (recommended_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='추천 기록';

-- 학습 경로 테이블
CREATE TABLE IF NOT EXISTS mdl_learning_path (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    module_id CHAR(36) NOT NULL,

    -- 경로 정보
    path_name VARCHAR(255) NOT NULL,
    path_type ENUM('auto_generated', 'teacher_defined', 'student_custom') DEFAULT 'auto_generated',

    -- 경로 구성
    problem_sequence JSON COMMENT '문제 순서 [problem_id1, problem_id2, ...]',
    current_position INT DEFAULT 0 COMMENT '현재 위치 (0-based)',
    total_problems INT DEFAULT 0,

    -- 진행 상황
    problems_completed INT DEFAULT 0,
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    estimated_completion_time INT COMMENT '예상 완료 시간 (분)',

    -- 적응형 조정
    is_adaptive BOOLEAN DEFAULT TRUE COMMENT '적응형 경로 여부',
    adjustment_count INT DEFAULT 0 COMMENT '경로 조정 횟수',
    last_adjusted_at TIMESTAMP NULL,

    -- 목표 및 상태
    learning_goal TEXT COMMENT '학습 목표',
    status ENUM('active', 'completed', 'paused', 'abandoned') DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,

    PRIMARY KEY (id),
    INDEX idx_student (student_id),
    INDEX idx_module (module_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 경로';

-- 개념 의존성 그래프
CREATE TABLE IF NOT EXISTS mdl_concept_dependencies (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,

    -- 개념 정보
    concept_name VARCHAR(255) NOT NULL,
    concept_category VARCHAR(100) COMMENT '개념 카테고리',

    -- 의존성
    prerequisite_concepts JSON COMMENT '선수 개념 목록',
    dependent_concepts JSON COMMENT '후속 개념 목록',

    -- 난이도 및 중요도
    difficulty_level TINYINT(1) DEFAULT 1 COMMENT '개념 난이도 (1-5)',
    importance_score DECIMAL(5,2) DEFAULT 50.00 COMMENT '중요도 (0-100)',

    -- 학습 추정치
    avg_mastery_time INT COMMENT '평균 숙달 시간 (분)',
    typical_problem_count INT COMMENT '전형적인 문제 수',

    -- 설명
    description TEXT COMMENT '개념 설명',
    learning_resources JSON COMMENT '학습 자료 링크',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_concept_name (concept_name),
    INDEX idx_category (concept_category),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='개념 의존성 그래프';

-- 추천 규칙 테이블
CREATE TABLE IF NOT EXISTS mdl_recommendation_rules (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,

    -- 규칙 정보
    rule_name VARCHAR(255) NOT NULL,
    rule_type ENUM('difficulty_progression', 'concept_mastery', 'time_based', 'performance_based') NOT NULL,
    priority INT DEFAULT 0 COMMENT '우선순위 (높을수록 우선)',

    -- 조건
    condition_json JSON COMMENT '규칙 조건',

    -- 액션
    action_type ENUM('recommend', 'skip', 'review', 'challenge', 'hint') NOT NULL,
    action_parameters JSON COMMENT '액션 파라미터',

    -- 가중치
    weight DECIMAL(5,2) DEFAULT 1.00 COMMENT '규칙 가중치',

    -- 활성화
    is_active BOOLEAN DEFAULT TRUE,
    applies_to_all_students BOOLEAN DEFAULT TRUE,
    specific_student_groups JSON COMMENT '특정 학생 그룹',

    -- 메타데이터
    description TEXT,
    created_by BIGINT(10) UNSIGNED COMMENT '생성자 (교사 ID)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_type (rule_type),
    INDEX idx_priority (priority),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='추천 규칙';

-- 추천 피드백 테이블
CREATE TABLE IF NOT EXISTS mdl_recommendation_feedback (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    recommendation_history_id BIGINT(10) UNSIGNED NOT NULL,
    student_id BIGINT(10) UNSIGNED NOT NULL,

    -- 피드백 유형
    feedback_type ENUM('too_easy', 'too_hard', 'just_right', 'not_interested', 'helpful', 'not_helpful') NOT NULL,

    -- 상세 피드백
    rating TINYINT(1) COMMENT '평점 (1-5)',
    difficulty_perception ENUM('much_easier', 'easier', 'appropriate', 'harder', 'much_harder') COMMENT '난이도 체감',

    -- 텍스트 피드백
    comment TEXT,

    -- 선호도
    would_like_similar BOOLEAN COMMENT '유사한 문제 선호 여부',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_recommendation (recommendation_history_id),
    INDEX idx_student (student_id),
    INDEX idx_type (feedback_type),
    FOREIGN KEY (recommendation_history_id) REFERENCES mdl_recommendation_history(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='추천 피드백';

-- 성과 예측 모델 테이블
CREATE TABLE IF NOT EXISTS mdl_performance_prediction (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id BIGINT(10) UNSIGNED NOT NULL,
    problem_id CHAR(36) NOT NULL,

    -- 예측 결과
    predicted_success_probability DECIMAL(5,2) COMMENT '성공 확률 예측 (%)',
    predicted_time_seconds INT COMMENT '예상 소요 시간 (초)',
    predicted_attempts INT DEFAULT 1 COMMENT '예상 시도 횟수',

    -- 예측 기반 정보
    prediction_model_version VARCHAR(20) DEFAULT '1.0',
    prediction_features JSON COMMENT '예측에 사용된 특성들',
    confidence_score DECIMAL(5,2) COMMENT '예측 신뢰도 (0-100)',

    -- 실제 결과 (검증용)
    actual_success BOOLEAN DEFAULT NULL,
    actual_time_seconds INT DEFAULT NULL,
    actual_attempts INT DEFAULT NULL,

    -- 예측 정확도
    prediction_error DECIMAL(5,2) COMMENT '예측 오차',

    predicted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actual_completed_at TIMESTAMP NULL,

    PRIMARY KEY (id),
    INDEX idx_student (student_id),
    INDEX idx_problem (problem_id),
    INDEX idx_probability (predicted_success_probability)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='성과 예측 모델';

-- ============================================================================
-- 샘플 데이터: 개념 의존성
-- ============================================================================

INSERT INTO mdl_concept_dependencies (concept_name, concept_category, prerequisite_concepts, dependent_concepts,
    difficulty_level, importance_score, avg_mastery_time, typical_problem_count, description)
VALUES
    ('기본 적분 공식', 'Fundamentals', '["미분의 역연산"]', '["치환적분", "부분적분"]', 1, 95.00, 120, 10,
     '거듭제곱, 지수, 삼각함수 등의 기본 적분 공식을 학습합니다.'),

    ('미적분학의 기본정리', 'Fundamentals', '["부정적분", "정적분의 정의"]', '["정적분의 응용"]', 2, 100.00, 180, 8,
     '미분과 적분의 관계를 이해하고 정적분 계산에 활용합니다.'),

    ('치환적분법', 'Techniques', '["기본 적분 공식", "합성함수 미분"]', '["복잡한 적분"]', 3, 85.00, 240, 15,
     'u = g(x) 형태로 치환하여 복잡한 적분을 간단하게 만듭니다.'),

    ('부분적분법', 'Techniques', '["기본 적분 공식", "곱의 미분법"]', '["복잡한 적분"]', 4, 80.00, 300, 12,
     '∫u dv = uv - ∫v du 공식을 활용하여 곱으로 된 함수를 적분합니다.'),

    ('정적분의 응용', 'Applications', '["미적분학의 기본정리"]', '["넓이", "부피", "물리적 응용"]', 3, 90.00, 200, 10,
     '정적분을 이용하여 실생활 문제를 해결합니다.');

-- ============================================================================
-- 샘플 데이터: 추천 규칙
-- ============================================================================

INSERT INTO mdl_recommendation_rules (rule_name, rule_type, priority, condition_json, action_type,
    action_parameters, weight, is_active, description)
VALUES
    ('초보자 단계적 진행', 'difficulty_progression', 100,
     '{"condition": "overall_performance_score < 60 AND current_difficulty_level <= 2"}',
     'recommend',
     '{"recommend_difficulty": "current_level", "avoid_skip": true}',
     1.50, TRUE,
     '초보 학생은 현재 레벨에서 충분한 연습 후 다음 단계로'),

    ('고급자 도전 과제', 'performance_based', 90,
     '{"condition": "overall_performance_score >= 80 AND consistency_score >= 75"}',
     'challenge',
     '{"recommend_difficulty": "current_level + 1", "challenge_bonus": 10}',
     1.30, TRUE,
     '고득점자에게 도전적인 문제 제공'),

    ('약점 개념 보강', 'concept_mastery', 95,
     '{"condition": "has_weak_concepts AND weak_concept_count >= 2"}',
     'review',
     '{"focus_on": "weak_concepts", "difficulty_adjustment": -1}',
     1.40, TRUE,
     '약점 개념이 있는 경우 복습 문제 우선 추천'),

    ('일관성 부족 복습', 'performance_based', 80,
     '{"condition": "consistency_score < 50"}',
     'review',
     '{"review_previous_problems": true, "max_difficulty": "current_level - 1"}',
     1.20, TRUE,
     '성적이 불안정한 학생에게 복습 문제 제공'),

    ('빠른 학습자 가속', 'difficulty_progression', 85,
     '{"condition": "learning_speed = \'fast\' AND success_rate >= 85"}',
     'recommend',
     '{"skip_intermediate": true, "recommend_difficulty": "current_level + 2"}',
     1.10, TRUE,
     '빠른 학습자에게 중간 단계 건너뛰기 허용');

-- ============================================================================
-- 인덱스 최적화
-- ============================================================================

-- 성능 최적화를 위한 복합 인덱스
CREATE INDEX idx_student_performance ON mdl_student_learning_profile(student_id, overall_performance_score);
CREATE INDEX idx_recommendation_student_time ON mdl_recommendation_history(student_id, recommended_at);
CREATE INDEX idx_path_student_status ON mdl_learning_path(student_id, status);
