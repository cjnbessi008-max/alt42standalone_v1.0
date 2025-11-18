-- ========================================
-- 미스터리 힌트 카드 데이터베이스 스키마
-- MySQL 5.7+ / Moodle 3.7+
-- ========================================

-- 1. 문제 테이블
CREATE TABLE IF NOT EXISTS mdl_mysterycard_problems (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL COMMENT 'JSON 형식의 문제 내용',
    settings TEXT NOT NULL COMMENT 'JSON 형식의 설정 (sequential, allowSkip, maxUnlocks)',
    difficulty TINYINT(1) DEFAULT 1 COMMENT '난이도 (1-5)',
    subject VARCHAR(50) DEFAULT 'mathematics',
    grade_level VARCHAR(20) DEFAULT 'elementary',
    created_by BIGINT(10) UNSIGNED NOT NULL,
    created_at BIGINT(10) UNSIGNED NOT NULL,
    updated_at BIGINT(10) UNSIGNED NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    PRIMARY KEY (id),
    KEY idx_course (course_id),
    KEY idx_created_by (created_by),
    KEY idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='미스터리 카드 문제';

-- 2. 힌트 테이블
CREATE TABLE IF NOT EXISTS mdl_mysterycard_hints (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    problem_id BIGINT(10) UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    hint_text TEXT NOT NULL,
    shape VARCHAR(10) DEFAULT '❓' COMMENT '이모지 또는 아이콘',
    shape_type VARCHAR(50) DEFAULT 'default' COMMENT 'pizza, numbers, visual, math, answer',
    sort_order INT(5) DEFAULT 0 COMMENT '표시 순서',
    created_at BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    KEY idx_problem (problem_id),
    KEY idx_sort (sort_order),
    FOREIGN KEY (problem_id) REFERENCES mdl_mysterycard_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='미스터리 카드 힌트';

-- 3. 학생 진행 상황 테이블
CREATE TABLE IF NOT EXISTS mdl_mysterycard_progress (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    problem_id BIGINT(10) UNSIGNED NOT NULL,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    progress_data TEXT NOT NULL COMMENT 'JSON 형식의 진행 상황 (unlockedCards, currentCard 등)',
    completed TINYINT(1) DEFAULT 0,
    score DECIMAL(5,2) DEFAULT NULL COMMENT '문제 점수',
    created_at BIGINT(10) UNSIGNED NOT NULL,
    updated_at BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_problem_user (problem_id, user_id),
    KEY idx_user (user_id),
    KEY idx_completed (completed),
    FOREIGN KEY (problem_id) REFERENCES mdl_mysterycard_problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES mdl_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 진행 상황';

-- 4. 힌트 사용 로그 테이블
CREATE TABLE IF NOT EXISTS mdl_mysterycard_hint_logs (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    problem_id BIGINT(10) UNSIGNED NOT NULL,
    hint_id BIGINT(10) UNSIGNED NOT NULL,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    used_at BIGINT(10) UNSIGNED NOT NULL,
    session_id VARCHAR(100) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY idx_problem (problem_id),
    KEY idx_hint (hint_id),
    KEY idx_user (user_id),
    KEY idx_used_at (used_at),
    FOREIGN KEY (problem_id) REFERENCES mdl_mysterycard_problems(id) ON DELETE CASCADE,
    FOREIGN KEY (hint_id) REFERENCES mdl_mysterycard_hints(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES mdl_user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='힌트 사용 로그';

-- 5. 분석 데이터 뷰 (읽기 전용)
CREATE OR REPLACE VIEW mdl_mysterycard_analytics AS
SELECT
    p.id AS problem_id,
    p.title AS problem_title,
    p.course_id,
    COUNT(DISTINCT pr.user_id) AS total_students,
    COUNT(DISTINCT CASE WHEN pr.completed = 1 THEN pr.user_id END) AS completed_students,
    AVG(pr.score) AS avg_score,
    COUNT(l.id) AS total_hint_views,
    AVG(JSON_LENGTH(pr.progress_data, '$.unlockedCards')) AS avg_hints_used
FROM mdl_mysterycard_problems p
LEFT JOIN mdl_mysterycard_progress pr ON p.id = pr.problem_id
LEFT JOIN mdl_mysterycard_hint_logs l ON p.id = l.problem_id
GROUP BY p.id, p.title, p.course_id;

-- ========================================
-- 샘플 데이터 삽입
-- ========================================

-- 샘플 문제 1: 분수 더하기
INSERT INTO mdl_mysterycard_problems (id, course_id, title, content, settings, difficulty, subject, grade_level, created_by, created_at, updated_at)
VALUES (
    1,
    1, -- course_id (실제 Moodle 코스 ID로 변경)
    '분수 더하기: 1/4 + 2/4',
    '{"question": "다음 분수를 더하세요: 1/4 + 2/4 = ?", "type": "fraction_addition", "numerator1": 1, "denominator1": 4, "numerator2": 2, "denominator2": 4, "answer": {"numerator": 3, "denominator": 4}}',
    '{"sequential": true, "allowSkip": false, "maxUnlocks": 5}',
    2, -- difficulty
    'mathematics',
    'elementary',
    2, -- created_by (교사 user_id)
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

-- 샘플 힌트들
INSERT INTO mdl_mysterycard_hints (problem_id, title, hint_text, shape, shape_type, sort_order, created_at) VALUES
(1, '힌트 1: 분수의 기본', '피자를 4조각으로 나누면, 각 조각은 1/4입니다.', '🍕', 'pizza', 1, UNIX_TIMESTAMP()),
(1, '힌트 2: 분모 확인', '두 분수의 분모가 같으면(4), 분자만 더하면 됩니다!', '🔢', 'numbers', 2, UNIX_TIMESTAMP()),
(1, '힌트 3: 시각화', '1조각(1/4) + 2조각(2/4) = 3조각(3/4)', '🎨', 'visual', 3, UNIX_TIMESTAMP()),
(1, '힌트 4: 계산 방법', '1 + 2 = 3이므로, 1/4 + 2/4 = 3/4입니다.', '➕', 'math', 4, UNIX_TIMESTAMP()),
(1, '힌트 5: 정답 확인', '정답: 3/4 (0.75 또는 75%와 같습니다)', '✅', 'answer', 5, UNIX_TIMESTAMP());

-- 샘플 문제 2: 곱셈
INSERT INTO mdl_mysterycard_problems (id, course_id, title, content, settings, difficulty, subject, grade_level, created_by, created_at, updated_at)
VALUES (
    2,
    1,
    '곱셈 구구단: 7 × 8',
    '{"question": "7 × 8 = ?", "type": "multiplication", "operand1": 7, "operand2": 8, "answer": 56}',
    '{"sequential": true, "allowSkip": false, "maxUnlocks": 4}',
    1,
    'mathematics',
    'elementary',
    2,
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);

INSERT INTO mdl_mysterycard_hints (problem_id, title, hint_text, shape, shape_type, sort_order, created_at) VALUES
(2, '힌트 1: 곱셈의 의미', '7 × 8은 7을 8번 더하는 것과 같습니다.', '🔢', 'numbers', 1, UNIX_TIMESTAMP()),
(2, '힌트 2: 단계별 계산', '7 × 8 = 7 × (5 + 3) = (7 × 5) + (7 × 3)', '➗', 'math', 2, UNIX_TIMESTAMP()),
(2, '힌트 3: 중간 결과', '35 + 21 = ?', '🧮', 'visual', 3, UNIX_TIMESTAMP()),
(2, '힌트 4: 정답', '7 × 8 = 56', '✅', 'answer', 4, UNIX_TIMESTAMP());

-- ========================================
-- 인덱스 최적화 (대용량 데이터 대비)
-- ========================================

-- 복합 인덱스
CREATE INDEX idx_progress_user_updated ON mdl_mysterycard_progress(user_id, updated_at);
CREATE INDEX idx_logs_problem_user ON mdl_mysterycard_hint_logs(problem_id, user_id);

-- 전문 검색 인덱스 (MySQL 5.7+)
-- ALTER TABLE mdl_mysterycard_problems ADD FULLTEXT INDEX ft_title_content (title, content);

-- ========================================
-- 권한 설정 (Moodle capabilities)
-- ========================================

-- 이것은 Moodle의 access.php에서 정의되어야 합니다.
-- 참고용 capability 목록:
-- - local/mysterycard:view          : 카드 보기
-- - local/mysterycard:create        : 문제 생성
-- - local/mysterycard:edit          : 문제 수정
-- - local/mysterycard:delete        : 문제 삭제
-- - local/mysterycard:viewanalytics : 분석 데이터 보기

-- ========================================
-- 유틸리티 쿼리들
-- ========================================

-- 학생별 힌트 사용 통계
-- SELECT
--     u.id AS user_id,
--     u.username,
--     COUNT(DISTINCT l.hint_id) AS hints_used,
--     COUNT(l.id) AS total_views,
--     MAX(l.used_at) AS last_used
-- FROM mdl_user u
-- JOIN mdl_mysterycard_hint_logs l ON u.id = l.user_id
-- WHERE l.problem_id = 1
-- GROUP BY u.id, u.username;

-- 문제별 평균 완료 시간
-- SELECT
--     p.id,
--     p.title,
--     AVG(pr.updated_at - pr.created_at) AS avg_completion_time_seconds
-- FROM mdl_mysterycard_problems p
-- JOIN mdl_mysterycard_progress pr ON p.id = pr.problem_id
-- WHERE pr.completed = 1
-- GROUP BY p.id, p.title;

-- 힌트별 사용 빈도
-- SELECT
--     h.id,
--     h.title,
--     h.sort_order,
--     COUNT(l.id) AS usage_count,
--     COUNT(DISTINCT l.user_id) AS unique_users
-- FROM mdl_mysterycard_hints h
-- LEFT JOIN mdl_mysterycard_hint_logs l ON h.id = l.hint_id
-- WHERE h.problem_id = 1
-- GROUP BY h.id, h.title, h.sort_order
-- ORDER BY h.sort_order;
