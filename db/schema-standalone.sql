-- Geo Spiral Standalone Database Schema
-- MySQL 5.7+

-- Drop existing tables if they exist
DROP TABLE IF EXISTS interactions;
DROP TABLE IF EXISTS progress;
DROP TABLE IF EXISTS sequences;
DROP TABLE IF EXISTS users;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'teacher', 'student', 'guest') DEFAULT 'student',
    level INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login DATETIME,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sequences table
CREATE TABLE sequences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_type ENUM('geometric', 'arithmetic', 'fibonacci', 'custom') DEFAULT 'geometric',
    first_term DECIMAL(20, 6) NOT NULL,
    common_ratio DECIMAL(20, 6),
    common_difference DECIMAL(20, 6),
    num_terms INT NOT NULL DEFAULT 10,
    spiral_type ENUM('logarithmic', 'archimedean', 'fibonacci') DEFAULT 'logarithmic',
    difficulty_level INT DEFAULT 1,
    tags JSON,
    created_by INT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sequence_type (sequence_type),
    INDEX idx_difficulty (difficulty_level),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Progress table
CREATE TABLE progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sequence_id INT NOT NULL,
    completion_status ENUM('not_started', 'in_progress', 'completed', 'failed') DEFAULT 'in_progress',
    time_spent INT DEFAULT 0,
    interaction_count INT DEFAULT 0,
    last_interaction DATETIME,
    score DECIMAL(5, 2),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_sequence (user_id, sequence_id),
    INDEX idx_user_id (user_id),
    INDEX idx_sequence_id (sequence_id),
    INDEX idx_status (completion_status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Interactions table
CREATE TABLE interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    sequence_id INT NOT NULL,
    interaction_type VARCHAR(50) NOT NULL,
    interaction_data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_sequence_id (sequence_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (sequence_id) REFERENCES sequences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, name, role, level) VALUES
('admin', 'admin@geospiral.com', '$2a$10$rGJZ8KZ8Z8Z8Z8Z8Z8Z8Z.Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8Z8', 'Administrator', 'admin', 5);

-- Insert sample sequences
INSERT INTO sequences (name, description, sequence_type, first_term, common_ratio, num_terms, spiral_type, difficulty_level, tags, created_by) VALUES
('기초 등비수열', '첫 항 2, 공비 2의 간단한 등비수열입니다. 수열의 기본을 이해할 수 있습니다.', 'geometric', 2.0, 2.0, 8, 'logarithmic', 1, '["beginner", "basic", "power-of-2"]', 1),
('황금비 나선', '황금비(1.618...)를 이용한 아름다운 나선입니다. 자연에서 볼 수 있는 패턴을 탐구합니다.', 'geometric', 1.0, 1.618034, 12, 'logarithmic', 2, '["golden-ratio", "nature", "beauty"]', 1),
('피보나치 나선', '유명한 피보나치 수열을 나선으로 시각화합니다. 1, 1, 2, 3, 5, 8...', 'fibonacci', 1.0, NULL, 15, 'fibonacci', 2, '["fibonacci", "nature", "classic"]', 1),
('작은 공비 나선', '공비 1.5의 완만한 나선입니다. 부드러운 증가를 관찰할 수 있습니다.', 'geometric', 1.0, 1.5, 10, 'logarithmic', 1, '["gentle", "smooth"]', 1),
('아르키메데스 나선', '선형 증가하는 아르키메데스 나선입니다. 일정한 간격의 패턴을 배웁니다.', 'geometric', 1.0, 1.3, 12, 'archimedean', 2, '["archimedean", "linear"]', 1),
('빠른 성장 나선', '공비 3의 급격한 성장을 보여주는 나선입니다. 지수 성장을 이해합니다.', 'geometric', 1.0, 3.0, 8, 'logarithmic', 3, '["exponential", "fast-growth"]', 1),
('소수 공비 나선', '√2(1.414...)를 공비로 하는 특별한 나선입니다.', 'geometric', 1.0, 1.41421, 10, 'logarithmic', 3, '["irrational", "square-root"]', 1),
('미세 증가 나선', '공비 1.1의 매우 완만한 나선입니다. 미세한 변화를 관찰합니다.', 'geometric', 1.0, 1.1, 20, 'logarithmic', 1, '["gentle", "subtle"]', 1),
('이진 나선', '공비 2의 이진 패턴 나선입니다. 컴퓨터 과학과의 연결을 탐구합니다.', 'geometric', 1.0, 2.0, 10, 'logarithmic', 2, '["binary", "computer-science"]', 1),
('큐브 성장 나선', '세제곱 패턴의 급격한 성장 나선입니다. 고급 수학 개념을 적용합니다.', 'geometric', 1.0, 2.5, 8, 'logarithmic', 4, '["advanced", "cubic"]', 1),
('역 피보나치', '피보나치 역순으로 표현한 독특한 나선입니다.', 'fibonacci', 1.0, NULL, 12, 'fibonacci', 3, '["reverse", "fibonacci"]', 1),
('자연 성장 e', '자연상수 e(2.718...)를 공비로 하는 나선입니다. 자연 성장의 본질을 탐구합니다.', 'geometric', 1.0, 2.71828, 9, 'logarithmic', 4, '["euler", "natural", "advanced"]', 1),
('완벽한 원형', '공비 1.2의 균형잡힌 원형 나선입니다.', 'geometric', 2.0, 1.2, 15, 'logarithmic', 2, '["balanced", "circular"]', 1),
('도전! 복잡한 나선', '공비 4의 매우 빠른 성장 나선입니다. 최고 난이도!', 'geometric', 0.5, 4.0, 7, 'logarithmic', 5, '["challenge", "extreme"]', 1),
('페르마 나선', '페르마 나선 패턴의 특별한 나선입니다. 고급 수학 개념을 적용합니다.', 'geometric', 1.0, 1.732, 11, 'archimedean', 4, '["fermat", "advanced"]', 1);

-- Insert sample progress for demonstration
-- (You would typically not pre-populate this, but useful for testing)

COMMIT;
