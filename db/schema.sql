-- Geo Spiral Database Schema for MySQL 5.7
-- Moodle 3.7 Integration

-- Table: Geometric Sequences
CREATE TABLE IF NOT EXISTS mdl_geospiral_sequences (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    sequence_type VARCHAR(50) NOT NULL DEFAULT 'geometric', -- geometric, arithmetic, fibonacci
    first_term DECIMAL(20, 6) NOT NULL,
    common_ratio DECIMAL(20, 6) DEFAULT NULL, -- for geometric sequences
    common_difference DECIMAL(20, 6) DEFAULT NULL, -- for arithmetic sequences
    num_terms INT(11) NOT NULL DEFAULT 10,
    spiral_type VARCHAR(50) NOT NULL DEFAULT 'logarithmic', -- logarithmic, archimedean, fibonacci
    created_by BIGINT(10) UNSIGNED NOT NULL,
    created_at BIGINT(10) UNSIGNED NOT NULL,
    updated_at BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_sequence_type (sequence_type),
    INDEX idx_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Student Progress
CREATE TABLE IF NOT EXISTS mdl_geospiral_progress (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    sequence_id BIGINT(10) UNSIGNED NOT NULL,
    course_id BIGINT(10) UNSIGNED NOT NULL,
    completion_status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, failed
    time_spent INT(11) DEFAULT 0, -- in seconds
    interaction_count INT(11) DEFAULT 0,
    last_interaction BIGINT(10) UNSIGNED,
    score DECIMAL(5, 2) DEFAULT NULL,
    created_at BIGINT(10) UNSIGNED NOT NULL,
    updated_at BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_sequence (user_id, sequence_id, course_id),
    INDEX idx_user_id (user_id),
    INDEX idx_sequence_id (sequence_id),
    INDEX idx_course_id (course_id),
    FOREIGN KEY (sequence_id) REFERENCES mdl_geospiral_sequences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Interaction History
CREATE TABLE IF NOT EXISTS mdl_geospiral_interactions (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT(10) UNSIGNED NOT NULL,
    sequence_id BIGINT(10) UNSIGNED NOT NULL,
    interaction_type VARCHAR(50) NOT NULL, -- view, zoom, rotate, tap, complete
    interaction_data TEXT, -- JSON data
    timestamp BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_user_id (user_id),
    INDEX idx_sequence_id (sequence_id),
    INDEX idx_timestamp (timestamp),
    FOREIGN KEY (sequence_id) REFERENCES mdl_geospiral_sequences(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: Configuration
CREATE TABLE IF NOT EXISTS mdl_geospiral_config (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT,
    description VARCHAR(255),
    updated_at BIGINT(10) UNSIGNED NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY unique_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default configuration
INSERT INTO mdl_geospiral_config (config_key, config_value, description, updated_at) VALUES
('phone_screen_width', '375', 'Virtual phone screen width in pixels', UNIX_TIMESTAMP()),
('phone_screen_height', '667', 'Virtual phone screen height in pixels', UNIX_TIMESTAMP()),
('phone_position', 'bottom-right', 'Position of virtual phone on screen', UNIX_TIMESTAMP()),
('spiral_animation_speed', '1000', 'Animation speed in milliseconds', UNIX_TIMESTAMP()),
('spiral_max_iterations', '100', 'Maximum spiral iterations', UNIX_TIMESTAMP()),
('default_spiral_type', 'logarithmic', 'Default spiral type', UNIX_TIMESTAMP());

-- Insert sample geometric sequences
INSERT INTO mdl_geospiral_sequences (name, description, sequence_type, first_term, common_ratio, num_terms, spiral_type, created_by, created_at, updated_at) VALUES
('Basic Geometric Sequence', '첫 항 2, 공비 2의 등비수열', 'geometric', 2.0, 2.0, 8, 'logarithmic', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('Golden Ratio Spiral', '황금비를 이용한 나선', 'geometric', 1.0, 1.618034, 12, 'logarithmic', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('Fibonacci Spiral', '피보나치 수열 나선', 'fibonacci', 1.0, NULL, 15, 'fibonacci', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
('Small Ratio Spiral', '공비 1.5의 나선', 'geometric', 1.0, 1.5, 10, 'logarithmic', 1, UNIX_TIMESTAMP(), UNIX_TIMESTAMP());
