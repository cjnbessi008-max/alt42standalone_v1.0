-- Next Term Vision - Standalone Web App Database Schema
-- MySQL 5.7+ Compatible with Recommendation System
-- Created: 2025-11-18

-- ============================================
-- 1. 사용자 관리 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    grade_level TINYINT DEFAULT 1 COMMENT '학년 (1-12)',
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    is_active TINYINT(1) DEFAULT 1,
    preferences JSON COMMENT '사용자 설정 (애니메이션 속도, 테마 등)',
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자 정보';

-- ============================================
-- 2. 문제 테이블 (확장)
-- ============================================

CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_type ENUM('arithmetic', 'geometric', 'fibonacci', 'pattern', 'custom') NOT NULL,
    sequence_data JSON NOT NULL COMMENT '수열 데이터',
    difficulty_level TINYINT NOT NULL COMMENT '난이도 1-10',
    correct_answer INT NOT NULL,
    hint_text VARCHAR(500),
    animation_type ENUM('slide', 'fade', 'bounce', 'grow') DEFAULT 'slide',

    -- 추천 시스템용 메타데이터
    concept_tags JSON COMMENT '["등차수열", "공차", "패턴인식"]',
    prerequisite_concepts JSON COMMENT '선수 학습 개념',
    learning_objectives JSON COMMENT '학습 목표',
    estimated_time INT DEFAULT 60 COMMENT '예상 소요 시간(초)',

    -- 통계
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    avg_time_seconds DECIMAL(10,2) DEFAULT 0,
    difficulty_rating DECIMAL(3,2) COMMENT '실제 난이도 (0-1)',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,

    INDEX idx_difficulty (difficulty_level),
    INDEX idx_type (problem_type),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='문제 정보 (추천 메타데이터 포함)';

-- ============================================
-- 3. 학생 응답 테이블 (확장)
-- ============================================

CREATE TABLE IF NOT EXISTS responses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    student_answer INT NOT NULL,
    is_correct TINYINT(1) NOT NULL,
    attempt_number TINYINT DEFAULT 1,
    time_spent_seconds INT,
    hint_used TINYINT(1) DEFAULT 0,

    -- 학습 분석용
    confidence_level TINYINT COMMENT '학생 자신감 (1-5)',
    struggle_indicators JSON COMMENT '어려움 지표 (오답 패턴, 소요시간 등)',

    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,

    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_submitted (submitted_at),
    INDEX idx_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 응답 기록';

-- ============================================
-- 4. 학습 진행 상황 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,

    -- 전체 통계
    total_problems INT DEFAULT 0,
    correct_answers INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    current_level TINYINT DEFAULT 1,
    experience_points INT DEFAULT 0,

    -- 문제 유형별 숙련도
    arithmetic_mastery DECIMAL(3,2) DEFAULT 0 COMMENT '0-1',
    geometric_mastery DECIMAL(3,2) DEFAULT 0,
    fibonacci_mastery DECIMAL(3,2) DEFAULT 0,
    pattern_mastery DECIMAL(3,2) DEFAULT 0,

    -- 학습 스타일 분석
    preferred_animation VARCHAR(20),
    avg_response_time INT,
    hint_usage_rate DECIMAL(3,2),

    -- 추천 시스템용
    skill_vector JSON COMMENT '스킬 벡터 (다차원 능력 분석)',
    learning_velocity DECIMAL(5,2) COMMENT '학습 속도',

    last_problem_id INT,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (last_problem_id) REFERENCES problems(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자별 학습 진행 상황';

-- ============================================
-- 5. 추천 로그 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS recommendation_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    problem_id INT NOT NULL,
    recommendation_score DECIMAL(5,4) COMMENT '추천 점수 (0-1)',
    recommendation_reason JSON COMMENT '추천 이유 (알고리즘별 가중치)',
    was_attempted TINYINT(1) DEFAULT 0,
    was_correct TINYINT(1) DEFAULT NULL,
    user_feedback TINYINT COMMENT '사용자 피드백 (1-5)',

    recommended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,

    INDEX idx_user_time (user_id, recommended_at),
    INDEX idx_score (recommendation_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='추천 알고리즘 로그';

-- ============================================
-- 6. 학습 세션 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS learning_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP NULL,
    problems_solved INT DEFAULT 0,
    correct_count INT DEFAULT 0,
    total_time_seconds INT DEFAULT 0,
    session_type ENUM('practice', 'test', 'challenge') DEFAULT 'practice',

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 세션 추적';

-- ============================================
-- 7. 개념 마스터리 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS concept_mastery (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    concept_name VARCHAR(100) NOT NULL COMMENT '개념 이름 (등차수열, 등비수열 등)',
    mastery_level DECIMAL(3,2) DEFAULT 0 COMMENT '숙련도 0-1',
    attempts INT DEFAULT 0,
    last_practiced TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY unique_user_concept (user_id, concept_name),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_mastery (mastery_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='개념별 숙련도 추적';

-- ============================================
-- 8. 유사 문제 매핑 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS similar_problems (
    problem_id_1 INT NOT NULL,
    problem_id_2 INT NOT NULL,
    similarity_score DECIMAL(3,2) NOT NULL COMMENT '유사도 0-1',
    similarity_type ENUM('concept', 'difficulty', 'pattern') DEFAULT 'concept',

    PRIMARY KEY (problem_id_1, problem_id_2),
    FOREIGN KEY (problem_id_1) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id_2) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_similarity (similarity_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='문제간 유사도 매핑';

-- ============================================
-- 샘플 데이터 삽입
-- ============================================

-- 관리자 계정 (비밀번호: admin123)
INSERT INTO users (username, email, password_hash, full_name, role) VALUES
('admin', 'admin@nextterm.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '관리자', 'admin'),
('teacher1', 'teacher@nextterm.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김선생', 'teacher');

-- 테스트 학생 계정 (비밀번호: student123)
INSERT INTO users (username, email, password_hash, full_name, grade_level) VALUES
('student1', 'student1@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '김학생', 5),
('student2', 'student2@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '이학생', 6),
('student3', 'student3@test.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '박학생', 7);

-- 문제 데이터 (메타데이터 포함)
INSERT INTO problems (problem_type, sequence_data, difficulty_level, correct_answer, hint_text, animation_type, concept_tags, prerequisite_concepts, learning_objectives, estimated_time) VALUES
-- 산술 수열 (레벨 1-3)
('arithmetic', '[2, 4, 6, 8, 10]', 1, 12, '각 항이 2씩 증가합니다.', 'slide',
 '["등차수열", "공차", "패턴인식"]', '["덧셈", "수의순서"]', '["공차 개념 이해", "다음 항 예측"]', 45),

('arithmetic', '[5, 10, 15, 20]', 2, 25, '5의 배수로 증가합니다.', 'slide',
 '["등차수열", "배수", "공차"]', '["곱셈", "등차수열기초"]', '["배수 패턴 인식"]', 50),

('arithmetic', '[1, 3, 5, 7, 9]', 1, 11, '홀수가 순서대로 나옵니다.', 'fade',
 '["등차수열", "홀수", "패턴"]', '["홀짝수구분"]', '["홀수 패턴 이해"]', 40),

('arithmetic', '[10, 20, 30, 40]', 2, 50, '10씩 증가하는 패턴입니다.', 'slide',
 '["등차수열", "10의배수"]', '["곱셈"]', '["큰 단위 공차 이해"]', 45),

('arithmetic', '[3, 6, 9, 12, 15]', 2, 18, '3의 배수입니다.', 'bounce',
 '["등차수열", "3의배수"]', '["구구단"]', '["3의 배수 패턴"]', 50),

-- 기하 수열 (레벨 4-6)
('geometric', '[2, 4, 8, 16]', 4, 32, '각 항이 2배씩 증가합니다.', 'grow',
 '["등비수열", "공비", "지수성장"]', '["곱셈", "거듭제곱"]', '["공비 개념 이해"]', 70),

('geometric', '[1, 3, 9, 27]', 5, 81, '3을 곱해가는 패턴입니다.', 'grow',
 '["등비수열", "3의거듭제곱"]', '["거듭제곱", "등비수열기초"]', '["지수 성장 이해"]', 80),

('geometric', '[5, 10, 20, 40]', 4, 80, '2배씩 커집니다.', 'grow',
 '["등비수열", "배수증가"]', '["곱셈"]', '["배수 성장 패턴"]', 65),

('geometric', '[1, 2, 4, 8, 16]', 5, 32, '2의 거듭제곱입니다.', 'grow',
 '["등비수열", "2의거듭제곱"]', '["거듭제곱"]', '["지수 함수 기초"]', 75),

-- 피보나치 수열 (레벨 6-8)
('fibonacci', '[1, 1, 2, 3, 5]', 6, 8, '앞의 두 수를 더한 값입니다.', 'bounce',
 '["피보나치", "재귀", "합"]', '["덧셈", "수열"]', '["피보나치 규칙 이해"]', 90),

('fibonacci', '[0, 1, 1, 2, 3, 5]', 7, 8, '피보나치 수열입니다.', 'fade',
 '["피보나치", "자연수열"]', '["덧셈", "피보나치기초"]', '["피보나치 확장"]', 95),

('fibonacci', '[2, 2, 4, 6, 10]', 7, 16, '변형된 피보나치입니다.', 'bounce',
 '["피보나치변형", "합"]', '["피보나치"]', '["변형 규칙 발견"]', 100),

-- 패턴 수열 (레벨 7-10)
('pattern', '[1, 2, 4, 7, 11]', 7, 16, '차이가 1, 2, 3, 4씩 증가합니다.', 'bounce',
 '["복합패턴", "가변공차", "고급수열"]', '["등차수열"]', '["가변 공차 이해"]', 110),

('pattern', '[2, 4, 8, 14, 22]', 8, 32, '차이가 2, 4, 6, 8씩 증가합니다.', 'grow',
 '["복합패턴", "이차함수"]', '["등차수열", "곱셈"]', '["이차 성장 패턴"]', 120),

('pattern', '[1, 4, 9, 16, 25]', 6, 36, '제곱수 패턴입니다 (1², 2², 3², ...).', 'slide',
 '["제곱수", "거듭제곱", "완전제곱"]', '["곱셈", "거듭제곱"]', '["제곱수 패턴 인식"]', 85),

('pattern', '[1, 1, 2, 3, 5, 8]', 8, 13, '피보나치이지만 긴 수열입니다.', 'fade',
 '["피보나치", "장기기억"]', '["피보나치"]', '["긴 패턴 추적"]', 105);

-- 사용자 진행 상황 초기화
INSERT INTO user_progress (user_id, current_level) VALUES
(3, 1), (4, 1), (5, 1);

-- ============================================
-- 뷰 생성 - 사용자 통계
-- ============================================

CREATE OR REPLACE VIEW user_statistics AS
SELECT
    u.id as user_id,
    u.username,
    u.full_name,
    up.total_problems,
    up.correct_answers,
    ROUND(CASE WHEN up.total_problems > 0 THEN (up.correct_answers / up.total_problems * 100) ELSE 0 END, 2) as accuracy_percentage,
    up.current_level,
    up.experience_points,
    up.arithmetic_mastery,
    up.geometric_mastery,
    up.fibonacci_mastery,
    up.pattern_mastery,
    up.last_active,
    COUNT(DISTINCT r.id) as total_attempts,
    AVG(r.time_spent_seconds) as avg_time_per_problem
FROM users u
LEFT JOIN user_progress up ON u.id = up.user_id
LEFT JOIN responses r ON u.id = r.user_id
WHERE u.role = 'student'
GROUP BY u.id;

-- ============================================
-- 뷰 생성 - 문제 난이도 분석
-- ============================================

CREATE OR REPLACE VIEW problem_difficulty_analysis AS
SELECT
    p.id,
    p.problem_type,
    p.difficulty_level,
    p.total_attempts,
    p.correct_attempts,
    CASE WHEN p.total_attempts > 0
         THEN ROUND(p.correct_attempts / p.total_attempts, 3)
         ELSE NULL
    END as actual_difficulty,
    p.avg_time_seconds,
    COUNT(DISTINCT r.user_id) as unique_students
FROM problems p
LEFT JOIN responses r ON p.id = r.problem_id
GROUP BY p.id;

-- ============================================
-- 저장 프로시저 - 추천 점수 계산
-- ============================================

DELIMITER //

CREATE PROCEDURE calculate_recommendation_score(
    IN p_user_id INT,
    IN p_problem_id INT,
    OUT recommendation_score DECIMAL(5,4)
)
BEGIN
    DECLARE user_level TINYINT;
    DECLARE problem_difficulty TINYINT;
    DECLARE user_mastery DECIMAL(3,2);
    DECLARE problem_type_str VARCHAR(20);

    -- 사용자 레벨 조회
    SELECT current_level INTO user_level
    FROM user_progress
    WHERE user_id = p_user_id;

    -- 문제 정보 조회
    SELECT difficulty_level, problem_type
    INTO problem_difficulty, problem_type_str
    FROM problems
    WHERE id = p_problem_id;

    -- 해당 유형의 숙련도 조회
    SET user_mastery = CASE problem_type_str
        WHEN 'arithmetic' THEN (SELECT arithmetic_mastery FROM user_progress WHERE user_id = p_user_id)
        WHEN 'geometric' THEN (SELECT geometric_mastery FROM user_progress WHERE user_id = p_user_id)
        WHEN 'fibonacci' THEN (SELECT fibonacci_mastery FROM user_progress WHERE user_id = p_user_id)
        WHEN 'pattern' THEN (SELECT pattern_mastery FROM user_progress WHERE user_id = p_user_id)
        ELSE 0
    END;

    -- 추천 점수 계산 (간단한 버전)
    -- 난이도 매칭 + 숙련도 고려
    SET recommendation_score =
        (1 - ABS(user_level - problem_difficulty) / 10) * 0.5 +  -- 난이도 매칭 50%
        (1 - user_mastery) * 0.3 +                                -- 미숙련 영역 30%
        RAND() * 0.2;                                              -- 랜덤성 20%

END //

DELIMITER ;

-- ============================================
-- 인덱스 최적화
-- ============================================

-- 복합 인덱스 추가
CREATE INDEX idx_user_problem_time ON responses(user_id, problem_id, submitted_at);
CREATE INDEX idx_problem_difficulty_type ON problems(difficulty_level, problem_type, is_active);
CREATE INDEX idx_user_mastery ON user_progress(user_id, arithmetic_mastery, geometric_mastery);

-- 전문 검색 인덱스 (개념 태그 검색용)
-- ALTER TABLE problems ADD FULLTEXT INDEX idx_concept_search (concept_tags);

-- ============================================
-- 트리거 - 문제 통계 자동 업데이트
-- ============================================

DELIMITER //

CREATE TRIGGER update_problem_stats_after_response
AFTER INSERT ON responses
FOR EACH ROW
BEGIN
    UPDATE problems
    SET total_attempts = total_attempts + 1,
        correct_attempts = correct_attempts + IF(NEW.is_correct = 1, 1, 0),
        avg_time_seconds = (avg_time_seconds * (total_attempts - 1) + NEW.time_spent_seconds) / total_attempts
    WHERE id = NEW.problem_id;
END //

DELIMITER ;

-- 데이터베이스 설정 완료
SELECT 'Next Term Vision Standalone Database Schema Created Successfully!' as status;
