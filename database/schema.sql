-- ALT42 Trap Shadow Database Schema
-- Compatible with MySQL 5.7
-- Extends Moodle 3.7 database

-- Create trap points table
CREATE TABLE IF NOT EXISTS alt42_trap_points (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  trap_type ENUM('text', 'number', 'diagram', 'option') NOT NULL,
  position_x DECIMAL(5,2) NOT NULL COMMENT 'X coordinate as percentage (0-100)',
  position_y DECIMAL(5,2) NOT NULL COMMENT 'Y coordinate as percentage (0-100)',
  position_width DECIMAL(5,2) NOT NULL COMMENT 'Width as percentage (0-100)',
  position_height DECIMAL(5,2) NOT NULL COMMENT 'Height as percentage (0-100)',
  severity ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  description TEXT COMMENT 'Description of the trap point',
  error_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Error rate percentage (0-100)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_question_id (question_id),
  INDEX idx_severity (severity),
  INDEX idx_error_rate (error_rate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores trap point data for quiz questions';

-- Create trap point analytics table
CREATE TABLE IF NOT EXISTS alt42_trap_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trap_point_id INT NOT NULL,
  student_id INT NOT NULL,
  viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  interaction_type ENUM('hover', 'click', 'viewed') NOT NULL,
  duration_seconds INT DEFAULT 0,
  INDEX idx_trap_point (trap_point_id),
  INDEX idx_student (student_id),
  INDEX idx_viewed_at (viewed_at),
  FOREIGN KEY (trap_point_id) REFERENCES alt42_trap_points(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Tracks student interactions with trap points';

-- Create configuration table
CREATE TABLE IF NOT EXISTS alt42_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) NOT NULL UNIQUE,
  config_value TEXT,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_config_key (config_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Configuration settings for ALT42 Trap Shadow';

-- Insert default configuration
INSERT INTO alt42_config (config_key, config_value, description) VALUES
('trap_shadow_enabled', 'true', 'Enable/disable trap shadow feature globally'),
('default_shadow_opacity', '0.25', 'Default opacity for trap shadows (0-1)'),
('animation_enabled', 'true', 'Enable/disable pulse animation on trap shadows'),
('show_trap_count', 'true', 'Show trap point count on virtual phone'),
('virtual_phone_position', 'bottom-right', 'Position of virtual phone (bottom-right, bottom-left, top-right, top-left)')
ON DUPLICATE KEY UPDATE config_value=config_value;

-- Sample trap points (for testing)
-- Note: Replace question_id with actual question IDs from your Moodle instance

INSERT INTO alt42_trap_points
  (question_id, trap_type, position_x, position_y, position_width, position_height, severity, description, error_rate)
VALUES
  (1, 'text', 20.0, 30.0, 60.0, 10.0, 'high', '주의: "모두" 라는 키워드가 함정입니다. 일부 학생들이 놓치는 경우가 많습니다.', 75.5),
  (1, 'number', 45.0, 55.0, 20.0, 8.0, 'medium', '이 숫자는 단위가 다릅니다. 단위 변환이 필요합니다.', 52.3),
  (2, 'option', 15.0, 60.0, 70.0, 12.0, 'high', '이 선택지는 정답과 비슷해 보이지만 미묘한 차이가 있습니다.', 68.9),
  (2, 'diagram', 50.0, 20.0, 40.0, 30.0, 'low', '그림의 척도를 확인하세요.', 28.7)
ON DUPLICATE KEY UPDATE description=description;

-- Create view for trap point statistics
CREATE OR REPLACE VIEW alt42_trap_stats AS
SELECT
  tp.id,
  tp.question_id,
  tp.trap_type,
  tp.severity,
  tp.error_rate,
  COUNT(DISTINCT ta.student_id) as total_views,
  AVG(ta.duration_seconds) as avg_duration,
  COUNT(CASE WHEN ta.interaction_type = 'click' THEN 1 END) as total_clicks
FROM alt42_trap_points tp
LEFT JOIN alt42_trap_analytics ta ON tp.id = ta.trap_point_id
GROUP BY tp.id;

-- Grant permissions (adjust username as needed)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alt42_trap_points TO 'moodle_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE, DELETE ON alt42_trap_analytics TO 'moodle_user'@'localhost';
-- GRANT SELECT ON alt42_trap_stats TO 'moodle_user'@'localhost';

-- Verification queries
SELECT 'Trap Points Table Created' as status, COUNT(*) as sample_count FROM alt42_trap_points;
SELECT 'Configuration Table Created' as status, COUNT(*) as config_count FROM alt42_config;
SELECT 'Analytics Table Created' as status FROM alt42_trap_analytics LIMIT 1;
