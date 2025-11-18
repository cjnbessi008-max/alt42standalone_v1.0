-- Slope Heatmap Database Schema
-- Compatible with MySQL 5.7
-- Created: 2025-11-18

-- Activity instances table
CREATE TABLE IF NOT EXISTS mdl_slopeheatmap (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    course BIGINT(10) NOT NULL DEFAULT 0,
    name VARCHAR(255) NOT NULL DEFAULT '',
    intro LONGTEXT,
    introformat SMALLINT(4) NOT NULL DEFAULT 0,
    timecreated BIGINT(10) NOT NULL DEFAULT 0,
    timemodified BIGINT(10) NOT NULL DEFAULT 0,
    grade BIGINT(10) NOT NULL DEFAULT 100,
    PRIMARY KEY (id),
    KEY mdl_slopheat_cou_ix (course)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Slope Heatmap activity instances';

-- Student sessions table
CREATE TABLE IF NOT EXISTS mdl_slopeheatmap_sessions (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    slopeheatmap_id BIGINT(10) NOT NULL,
    user_id BIGINT(10) NOT NULL,
    problem_id VARCHAR(100) NOT NULL,
    session_start BIGINT(10) NOT NULL,
    session_end BIGINT(10) DEFAULT NULL,
    completed TINYINT(1) NOT NULL DEFAULT 0,
    score DECIMAL(10,2) DEFAULT NULL,
    PRIMARY KEY (id),
    KEY mdl_slopses_slo_ix (slopeheatmap_id),
    KEY mdl_slopses_use_ix (user_id),
    KEY mdl_slopses_tim_ix (session_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student session data';

-- Slope sensor data table (raw data)
CREATE TABLE IF NOT EXISTS mdl_slopeheatmap_sensor_data (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    session_id BIGINT(10) NOT NULL,
    timestamp BIGINT(10) NOT NULL,
    alpha DECIMAL(10,6) NOT NULL COMMENT 'Rotation around Z-axis (0-360)',
    beta DECIMAL(10,6) NOT NULL COMMENT 'Rotation around X-axis (-180 to 180)',
    gamma DECIMAL(10,6) NOT NULL COMMENT 'Rotation around Y-axis (-90 to 90)',
    absolute TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    KEY mdl_slopsen_ses_ix (session_id),
    KEY mdl_slopsen_tim_ix (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Raw slope sensor data';

-- Heatmap aggregated data (for performance)
CREATE TABLE IF NOT EXISTS mdl_slopeheatmap_aggregated (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    session_id BIGINT(10) NOT NULL,
    beta_range_start INT NOT NULL COMMENT 'Beta angle range start (-180 to 180)',
    beta_range_end INT NOT NULL COMMENT 'Beta angle range end (-180 to 180)',
    gamma_range_start INT NOT NULL COMMENT 'Gamma angle range start (-90 to 90)',
    gamma_range_end INT NOT NULL COMMENT 'Gamma angle range end (-90 to 90)',
    count INT NOT NULL DEFAULT 0 COMMENT 'Number of data points in this range',
    duration_ms BIGINT(10) NOT NULL DEFAULT 0 COMMENT 'Total time spent in this range',
    PRIMARY KEY (id),
    KEY mdl_slopagg_ses_ix (session_id),
    KEY mdl_slopagg_ran_ix (beta_range_start, gamma_range_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Aggregated heatmap data';

-- Problem definitions table
CREATE TABLE IF NOT EXISTS mdl_slopeheatmap_problems (
    id BIGINT(10) NOT NULL AUTO_INCREMENT,
    slopeheatmap_id BIGINT(10) NOT NULL,
    problem_key VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_beta_min DECIMAL(10,6) DEFAULT NULL,
    target_beta_max DECIMAL(10,6) DEFAULT NULL,
    target_gamma_min DECIMAL(10,6) DEFAULT NULL,
    target_gamma_max DECIMAL(10,6) DEFAULT NULL,
    time_limit INT DEFAULT NULL COMMENT 'Time limit in seconds',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
    created_at BIGINT(10) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY mdl_slopprob_key_ix (slopeheatmap_id, problem_key),
    KEY mdl_slopprob_slo_ix (slopeheatmap_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Problem definitions';

-- Sample data insertion
INSERT INTO mdl_slopeheatmap_problems (slopeheatmap_id, problem_key, title, description, target_beta_min, target_beta_max, target_gamma_min, target_gamma_max, time_limit, difficulty, created_at)
VALUES
(1, 'balance_basic', 'Basic Balance', 'Keep the device level for 10 seconds', -5, 5, -5, 5, 10, 'easy', UNIX_TIMESTAMP()),
(1, 'tilt_forward', 'Forward Tilt', 'Tilt the device forward 45 degrees', 40, 50, -10, 10, 15, 'medium', UNIX_TIMESTAMP()),
(1, 'circle_motion', 'Circle Motion', 'Move the device in a circular pattern', NULL, NULL, NULL, NULL, 30, 'hard', UNIX_TIMESTAMP());
