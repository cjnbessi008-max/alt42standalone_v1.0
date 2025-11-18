-- Probability Grid Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7 integration

-- Problems table: stores probability problems from Moodle
CREATE TABLE IF NOT EXISTS problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    grid_width INT NOT NULL DEFAULT 10,
    grid_height INT NOT NULL DEFAULT 10,
    total_cells INT NOT NULL,
    probability_data JSON,  -- MySQL 5.7 supports JSON
    color_scheme JSON,
    correct_answer VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_moodle_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Student attempts table
CREATE TABLE IF NOT EXISTS student_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    moodle_user_id INT NOT NULL,
    student_answer VARCHAR(50),
    is_correct BOOLEAN,
    grid_interaction_data JSON,  -- Track how student interacted with grid
    time_spent INT,  -- in seconds
    attempt_number INT DEFAULT 1,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_user_problem (moodle_user_id, problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Grid configurations table
CREATE TABLE IF NOT EXISTS grid_configurations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    cell_colors JSON,  -- Array of color codes for each cell
    event_regions JSON,  -- Define which cells belong to which events
    probability_labels JSON,  -- Labels for probability values
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LTI session data
CREATE TABLE IF NOT EXISTS lti_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    moodle_user_id INT NOT NULL,
    moodle_course_id INT NOT NULL,
    consumer_key VARCHAR(255),
    resource_link_id VARCHAR(255),
    context_id VARCHAR(255),
    session_data JSON,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_expiry (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sample data for testing
INSERT INTO problems (moodle_question_id, moodle_course_id, title, description, grid_width, grid_height, total_cells, probability_data, color_scheme, correct_answer) VALUES
(1, 101, '동전 던지기 확률', '동전을 두 번 던질 때 가능한 모든 경우의 수를 격자로 표현합니다.', 2, 2, 4,
 '{"events": [{"name": "앞면-앞면", "cells": [0], "probability": 0.25, "color": "#4CAF50"}, {"name": "앞면-뒷면", "cells": [1], "probability": 0.25, "color": "#2196F3"}, {"name": "뒷면-앞면", "cells": [2], "probability": 0.25, "color": "#FFC107"}, {"name": "뒷면-뒷면", "cells": [3], "probability": 0.25, "color": "#F44336"}]}',
 '{"background": "#FFFFFF", "border": "#000000", "text": "#000000"}',
 '0.25');

INSERT INTO problems (moodle_question_id, moodle_course_id, title, description, grid_width, grid_height, total_cells, probability_data, color_scheme, correct_answer) VALUES
(2, 101, '주사위 던지기', '주사위를 한 번 던질 때 각 눈이 나올 확률을 격자로 표현합니다.', 6, 1, 6,
 '{"events": [{"name": "1", "cells": [0], "probability": 0.1667, "color": "#E91E63"}, {"name": "2", "cells": [1], "probability": 0.1667, "color": "#9C27B0"}, {"name": "3", "cells": [2], "probability": 0.1667, "color": "#3F51B5"}, {"name": "4", "cells": [3], "probability": 0.1667, "color": "#00BCD4"}, {"name": "5", "cells": [4], "probability": 0.1667, "color": "#4CAF50"}, {"name": "6", "cells": [5], "probability": 0.1667, "color": "#FF9800"}]}',
 '{"background": "#F5F5F5", "border": "#333333", "text": "#000000"}',
 '0.1667');
