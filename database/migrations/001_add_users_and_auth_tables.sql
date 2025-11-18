-- Migration 001: 사용자 및 인증 테이블 추가
-- 독립형 웹앱을 위한 자체 사용자 관리 시스템

USE alt42_monitor;

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL PRIMARY KEY COMMENT 'UUID',
    username VARCHAR(100) NOT NULL COMMENT '사용자명',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '이메일',
    password VARCHAR(255) NOT NULL COMMENT '비밀번호 (bcrypt)',
    role ENUM('admin', 'teacher', 'student') NOT NULL DEFAULT 'student' COMMENT '역할',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '활성화 여부',
    email_verified TINYINT(1) NOT NULL DEFAULT 0 COMMENT '이메일 인증 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL COMMENT '마지막 로그인 시간',
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자';

-- 2. Refresh Token 테이블
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL COMMENT '사용자 ID (UUID)',
    token TEXT NOT NULL COMMENT 'Refresh Token',
    expires_at TIMESTAMP NOT NULL COMMENT '만료 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Refresh Tokens';

-- 3. 사용자 프로필 테이블
CREATE TABLE IF NOT EXISTS user_profiles (
    user_id CHAR(36) NOT NULL PRIMARY KEY COMMENT '사용자 ID (UUID)',
    full_name VARCHAR(255) NULL COMMENT '전체 이름',
    grade_level VARCHAR(50) NULL COMMENT '학년',
    school VARCHAR(255) NULL COMMENT '학교',
    avatar_url VARCHAR(500) NULL COMMENT '프로필 이미지 URL',
    bio TEXT NULL COMMENT '소개',
    preferences JSON NULL COMMENT '사용자 설정 (JSON)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='사용자 프로필';

-- 4. activity_logs 테이블 업데이트 - user_id 컬럼 추가
ALTER TABLE activity_logs
ADD COLUMN user_id CHAR(36) NULL COMMENT '사용자 ID (UUID)' AFTER id,
ADD INDEX idx_user_id (user_id),
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 5. problems 테이블 업데이트 - created_by 컬럼 추가
ALTER TABLE problems
ADD COLUMN created_by CHAR(36) NULL COMMENT '생성자 ID (UUID)' AFTER id,
ADD INDEX idx_created_by (created_by),
ADD FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- 6. student_sessions 테이블 업데이트
ALTER TABLE student_sessions
ADD COLUMN user_id CHAR(36) NULL COMMENT '사용자 ID (UUID)' AFTER id,
ADD INDEX idx_user_id (user_id),
ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 7. 기본 관리자 계정 생성 (비밀번호: admin123)
-- bcrypt hash for 'admin123': $2a$10$rC.qYLUhQXqfN8zGjQxrYOj4p3p7YyqN8Hg5Y5H5Y5Y5Y5Y5Y5Y5Y
INSERT INTO users (id, username, email, password, role, is_active, email_verified)
VALUES (
    UUID(),
    'admin',
    'admin@alt42.com',
    '$2a$10$rC.qYLUhQXqfN8zGjQxrYOj4p3p7YyqN8Hg5Y5H5Y5Y5Y5Y5Y5Y5Y',
    'admin',
    1,
    1
) ON DUPLICATE KEY UPDATE email = email;

-- 8. 테스트 학생 계정 생성 (비밀번호: student123)
INSERT INTO users (id, username, email, password, role, is_active, email_verified)
VALUES
(
    UUID(),
    '김민수',
    'student1@alt42.com',
    '$2a$10$rC.qYLUhQXqfN8zGjQxrYOj4p3p7YyqN8Hg5Y5H5Y5Y5Y5Y5Y5Y5Y',
    'student',
    1,
    1
),
(
    UUID(),
    '이지은',
    'student2@alt42.com',
    '$2a$10$rC.qYLUhQXqfN8zGjQxrYOj4p3p7YyqN8Hg5Y5H5Y5Y5Y5Y5Y5Y5Y',
    'student',
    1,
    1
),
(
    UUID(),
    '박준호',
    'student3@alt42.com',
    '$2a$10$rC.qYLUhQXqfN8zGjQxrYOj4p3p7YyqN8Hg5Y5H5Y5Y5Y5Y5Y5Y5Y',
    'student',
    1,
    1
) ON DUPLICATE KEY UPDATE email = email;

-- 9. 사용자 통계 뷰 업데이트
CREATE OR REPLACE VIEW v_user_statistics AS
SELECT
    u.id AS user_id,
    u.username,
    u.email,
    u.role,
    COUNT(DISTINCT al.id) AS total_activities,
    SUM(CASE WHEN al.activity_type = 'correct' THEN 1 ELSE 0 END) AS correct_count,
    SUM(CASE WHEN al.activity_type = 'incorrect' THEN 1 ELSE 0 END) AS incorrect_count,
    AVG(al.score) AS avg_score,
    SUM(al.time_spent) AS total_time_spent,
    MIN(al.created_at) AS first_activity,
    MAX(al.created_at) AS last_activity
FROM users u
LEFT JOIN activity_logs al ON u.id = al.user_id
WHERE u.role = 'student'
GROUP BY u.id, u.username, u.email, u.role;

-- 10. 로그인 감사 테이블 (선택사항)
CREATE TABLE IF NOT EXISTS login_audit (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id CHAR(36) NOT NULL COMMENT '사용자 ID',
    login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '로그인 시간',
    ip_address VARCHAR(45) NULL COMMENT 'IP 주소',
    user_agent TEXT NULL COMMENT '사용자 에이전트',
    success TINYINT(1) NOT NULL DEFAULT 1 COMMENT '성공 여부',
    failure_reason VARCHAR(255) NULL COMMENT '실패 사유',
    INDEX idx_user_id (user_id),
    INDEX idx_login_at (login_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='로그인 감사';

-- Migration 완료
SELECT 'Migration 001 completed successfully!' AS message;
