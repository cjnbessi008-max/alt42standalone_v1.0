-- 1문장 핵심 요약 시스템 데이터베이스 스키마
-- MySQL 5.7 호환

-- 데이터베이스 생성
CREATE DATABASE IF NOT EXISTS summary_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE summary_system;

-- 1. 사용자 요약 테이블
CREATE TABLE summaries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    moodle_course_id INT NOT NULL COMMENT 'Moodle 코스 ID',
    moodle_activity_id INT NOT NULL COMMENT 'Moodle 활동 ID (퀴즈, 과제 등)',
    activity_type VARCHAR(50) NOT NULL COMMENT '활동 유형 (quiz, assign, lesson 등)',
    activity_name VARCHAR(255) NOT NULL COMMENT '활동 이름',
    summary_text TEXT NOT NULL COMMENT '학습자가 작성한 1문장 핵심 요약',
    word_count INT DEFAULT 0 COMMENT '요약문 단어 수',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

    INDEX idx_user (moodle_user_id),
    INDEX idx_course (moodle_course_id),
    INDEX idx_activity (moodle_activity_id),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학습자 작성 1문장 핵심 요약';

-- 2. AI 피드백 테이블
CREATE TABLE ai_feedback (
    id INT AUTO_INCREMENT PRIMARY KEY,
    summary_id INT NOT NULL COMMENT '요약 ID',
    feedback_text TEXT COMMENT 'AI 피드백 내용',
    clarity_score DECIMAL(3,2) DEFAULT NULL COMMENT '명확성 점수 (0.00~1.00)',
    relevance_score DECIMAL(3,2) DEFAULT NULL COMMENT '관련성 점수 (0.00~1.00)',
    completeness_score DECIMAL(3,2) DEFAULT NULL COMMENT '완성도 점수 (0.00~1.00)',
    overall_score DECIMAL(3,2) DEFAULT NULL COMMENT '전체 점수 (0.00~1.00)',
    suggestions TEXT COMMENT 'AI 개선 제안',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',

    FOREIGN KEY (summary_id) REFERENCES summaries(id) ON DELETE CASCADE,
    INDEX idx_summary (summary_id),
    INDEX idx_score (overall_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='AI 생성 피드백';

-- 3. 교사 댓글 테이블
CREATE TABLE teacher_comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    summary_id INT NOT NULL COMMENT '요약 ID',
    teacher_id INT NOT NULL COMMENT 'Moodle 교사 ID',
    comment_text TEXT NOT NULL COMMENT '교사 댓글',
    rating INT DEFAULT NULL COMMENT '평가 점수 (1~5)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '작성일시',

    FOREIGN KEY (summary_id) REFERENCES summaries(id) ON DELETE CASCADE,
    INDEX idx_summary (summary_id),
    INDEX idx_teacher (teacher_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='교사 댓글 및 평가';

-- 4. 시스템 설정 테이블
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE COMMENT '설정 키',
    setting_value TEXT COMMENT '설정 값',
    description VARCHAR(255) COMMENT '설명',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',

    UNIQUE KEY uk_setting_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='시스템 설정';

-- 5. 활동 로그 테이블
CREATE TABLE activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    action VARCHAR(50) NOT NULL COMMENT '액션 타입 (view, submit, update, delete)',
    target_type VARCHAR(50) COMMENT '대상 타입 (summary, feedback, comment)',
    target_id INT COMMENT '대상 ID',
    ip_address VARCHAR(45) COMMENT 'IP 주소',
    user_agent TEXT COMMENT '사용자 에이전트',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '발생일시',

    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='활동 로그';

-- 초기 설정 데이터 삽입
INSERT INTO settings (setting_key, setting_value, description) VALUES
('moodle_url', 'https://your-moodle-site.com', 'Moodle 사이트 URL'),
('moodle_token', '', 'Moodle Web Services 토큰'),
('ai_enabled', '1', 'AI 피드백 활성화 (1: 활성, 0: 비활성)'),
('claude_api_key', '', 'Claude API 키'),
('max_summary_length', '200', '최대 요약문 길이 (글자 수)'),
('min_summary_length', '10', '최소 요약문 길이 (글자 수)'),
('feedback_language', 'ko', '피드백 언어 (ko: 한국어, en: 영어)');

-- 샘플 데이터 (개발/테스트용)
INSERT INTO summaries (moodle_user_id, moodle_course_id, moodle_activity_id, activity_type, activity_name, summary_text, word_count) VALUES
(1, 101, 1001, 'quiz', '분수의 이해 퀴즈', '분수는 전체를 똑같이 나눈 것 중 일부를 나타내는 수입니다.', 18),
(2, 101, 1001, 'quiz', '분수의 이해 퀴즈', '분수는 나눗셈을 표현하는 방법이고 분자와 분모로 구성됩니다.', 19),
(1, 101, 1002, 'quiz', '분수의 덧셈', '분모가 같은 분수끼리 더할 때는 분자만 더하면 됩니다.', 17);
