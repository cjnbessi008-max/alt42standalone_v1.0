-- Ratio Alive 데이터베이스 초기화 스크립트
-- MySQL 5.7 / Moodle 3.7

-- ========================================
-- 테이블 생성
-- ========================================

-- 문제 테이블
CREATE TABLE IF NOT EXISTS ratio_alive_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NULL COMMENT 'Moodle 질문 ID (NULL이면 독립 실행형)',
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    topic VARCHAR(100) DEFAULT '비율과 비례' COMMENT '주제',
    description TEXT COMMENT '문제 설명',
    difficulty VARCHAR(50) DEFAULT '중급' COMMENT '난이도: 초급, 중급, 고급',
    instructions TEXT COMMENT '학습 지시사항',
    initial_shape VARCHAR(50) DEFAULT 'triangle' COMMENT '초기 도형: triangle, rectangle, pentagon',
    initial_ratio VARCHAR(20) DEFAULT '3:4' COMMENT '초기 비율',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성 시간',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정 시간',
    INDEX idx_moodle_qid (moodle_question_id),
    INDEX idx_difficulty (difficulty),
    INDEX idx_topic (topic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Ratio Alive 문제 정보';

-- 답안 테이블
CREATE TABLE IF NOT EXISTS ratio_alive_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL COMMENT '문제 ID',
    user_id INT NOT NULL COMMENT '사용자 ID (Moodle user ID)',
    session_id VARCHAR(100) COMMENT '세션 ID',
    answer TEXT NOT NULL COMMENT '학생 답안',
    current_ratio VARCHAR(20) COMMENT '답안 제출 시의 비율 설정',
    current_shape VARCHAR(50) COMMENT '답안 제출 시의 도형',
    score DECIMAL(5,2) DEFAULT NULL COMMENT '점수 (0-10)',
    feedback TEXT COMMENT '자동 생성된 피드백',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '제출 시간',
    INDEX idx_problem (problem_id),
    INDEX idx_user (user_id),
    INDEX idx_session (session_id),
    INDEX idx_submitted (submitted_at),
    FOREIGN KEY (problem_id) REFERENCES ratio_alive_problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='학생 답안 및 평가';

-- 세션 로그 테이블 (학습 분석용)
CREATE TABLE IF NOT EXISTS ratio_alive_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT '사용자 ID',
    problem_id INT NOT NULL COMMENT '문제 ID',
    session_id VARCHAR(100) NOT NULL COMMENT '세션 ID',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '시작 시간',
    end_time TIMESTAMP NULL COMMENT '종료 시간',
    interactions JSON COMMENT '인터랙션 데이터 (클릭, 비율 변경 등)',
    total_time_seconds INT DEFAULT 0 COMMENT '총 소요 시간(초)',
    INDEX idx_user (user_id),
    INDEX idx_problem (problem_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='세션 로그';

-- ========================================
-- 샘플 데이터 삽입
-- ========================================

-- 샘플 문제 1: 삼각형 비율
INSERT INTO ratio_alive_problems
(moodle_question_id, title, topic, description, difficulty, instructions, initial_shape, initial_ratio)
VALUES
(
    NULL,
    '삼각형의 비율 이해하기',
    '비율과 비례',
    '삼각형의 밑변과 높이의 비율을 관찰하고, 크기가 변해도 비율은 일정함을 이해합니다.',
    '초급',
    '1. 삼각형을 선택하세요.\n2. 재생 버튼을 눌러 애니메이션을 관찰하세요.\n3. 비율을 변경하면서 도형의 변화를 확인하세요.\n4. 관찰한 내용을 자신의 말로 설명하세요.',
    'triangle',
    '3:4'
);

-- 샘플 문제 2: 직사각형 비율
INSERT INTO ratio_alive_problems
(moodle_question_id, title, topic, description, difficulty, instructions, initial_shape, initial_ratio)
VALUES
(
    NULL,
    '직사각형의 가로세로 비율',
    '비율과 비례',
    '직사각형의 가로와 세로의 비율이 유지되는 것을 관찰합니다. 황금비(1:1.618)에 가까운 비율도 시도해보세요.',
    '중급',
    '1. 직사각형을 선택하세요.\n2. 비율을 5:8로 설정하세요 (황금비에 가까움).\n3. 애니메이션을 관찰하세요.\n4. 비율이 일정하게 유지되는 이유를 설명하세요.',
    'rectangle',
    '5:8'
);

-- 샘플 문제 3: 오각형 비율
INSERT INTO ratio_alive_problems
(moodle_question_id, title, topic, description, difficulty, instructions, initial_shape, initial_ratio)
VALUES
(
    NULL,
    '정오각형과 비율',
    '비율과 비례',
    '정오각형의 크기가 변할 때 각 변의 길이 비율을 관찰합니다.',
    '고급',
    '1. 오각형을 선택하세요.\n2. 다양한 비율을 시도해보세요.\n3. 속도를 조절하면서 관찰하세요.\n4. 정다각형에서 비율의 의미를 설명하세요.',
    'pentagon',
    '1:1'
);

-- 샘플 문제 4: 비율 비교
INSERT INTO ratio_alive_problems
(moodle_question_id, title, topic, description, difficulty, instructions, initial_shape, initial_ratio)
VALUES
(
    NULL,
    '서로 다른 비율 비교하기',
    '비율과 비례',
    '3:4 비율과 2:3 비율을 비교하고, 백분율로 환산하여 차이를 이해합니다.',
    '중급',
    '1. 먼저 3:4 비율로 설정하고 관찰하세요.\n2. 그 다음 2:3 비율로 변경하세요.\n3. 두 비율의 백분율을 비교하세요.\n4. 두 비율의 차이를 설명하세요.',
    'triangle',
    '3:4'
);

-- 샘플 문제 5: 실생활 비율
INSERT INTO ratio_alive_problems
(moodle_question_id, title, topic, description, difficulty, instructions, initial_shape, initial_ratio)
VALUES
(
    NULL,
    '실생활 속 비율 찾기',
    '비율과 비례',
    'A4 용지의 가로세로 비율(1:1.414)을 탐구합니다. 왜 이런 비율을 사용할까요?',
    '고급',
    '1. 직사각형을 선택하세요.\n2. 비율을 7:10으로 설정하세요 (A4 용지 비율에 가까움).\n3. 이 비율의 특별한 점을 생각해보세요.\n4. 실생활에서 이런 비율을 사용하는 이유를 설명하세요.',
    'rectangle',
    '7:10'
);

-- ========================================
-- 뷰 생성 (통계 및 분석용)
-- ========================================

-- 문제별 답안 통계 뷰
CREATE OR REPLACE VIEW v_problem_statistics AS
SELECT
    p.id AS problem_id,
    p.title,
    p.difficulty,
    COUNT(a.id) AS total_answers,
    AVG(a.score) AS avg_score,
    MAX(a.score) AS max_score,
    MIN(a.score) AS min_score,
    COUNT(DISTINCT a.user_id) AS unique_users
FROM ratio_alive_problems p
LEFT JOIN ratio_alive_answers a ON p.id = a.problem_id
GROUP BY p.id, p.title, p.difficulty;

-- 사용자별 학습 진도 뷰
CREATE OR REPLACE VIEW v_user_progress AS
SELECT
    a.user_id,
    COUNT(DISTINCT a.problem_id) AS problems_attempted,
    COUNT(a.id) AS total_submissions,
    AVG(a.score) AS avg_score,
    MAX(a.submitted_at) AS last_activity
FROM ratio_alive_answers a
GROUP BY a.user_id;

-- ========================================
-- 샘플 답안 데이터 (테스트용)
-- ========================================

-- 사용자 1의 답안들
INSERT INTO ratio_alive_answers
(problem_id, user_id, session_id, answer, current_ratio, current_shape, score, feedback)
VALUES
(1, 1, 'test_session_1', '삼각형의 크기가 커지거나 작아져도 밑변과 높이의 비율은 3:4로 일정하게 유지됩니다.', '3:4', 'triangle', 9.0, '훌륭합니다! 비율의 불변성을 정확히 이해하셨네요.'),
(2, 1, 'test_session_2', '직사각형이 커져도 가로와 세로의 비율 5:8은 변하지 않습니다.', '5:8', 'rectangle', 8.0, '좋습니다! 비율에 대한 이해가 있습니다.'),
(3, 1, 'test_session_3', '오각형의 반지름이 증가해도 비율은 동일합니다.', '1:1', 'pentagon', 7.0, '좋습니다! 비율에 대한 이해가 있습니다.');

-- ========================================
-- 인덱스 최적화
-- ========================================

-- 복합 인덱스 추가 (성능 향상)
ALTER TABLE ratio_alive_answers
ADD INDEX idx_user_problem (user_id, problem_id);

ALTER TABLE ratio_alive_answers
ADD INDEX idx_score (score);

-- ========================================
-- 트리거 생성
-- ========================================

-- 답안 제출 시 세션 종료 시간 자동 업데이트
DELIMITER //
CREATE TRIGGER trg_update_session_end
AFTER INSERT ON ratio_alive_answers
FOR EACH ROW
BEGIN
    UPDATE ratio_alive_sessions
    SET end_time = NEW.submitted_at,
        total_time_seconds = TIMESTAMPDIFF(SECOND, start_time, NEW.submitted_at)
    WHERE session_id = NEW.session_id
      AND problem_id = NEW.problem_id
      AND end_time IS NULL;
END//
DELIMITER ;

-- ========================================
-- 완료 메시지
-- ========================================

SELECT 'Ratio Alive 데이터베이스 초기화 완료!' AS message;
SELECT COUNT(*) AS total_problems FROM ratio_alive_problems;
SELECT COUNT(*) AS total_answers FROM ratio_alive_answers;
