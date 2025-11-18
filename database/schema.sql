-- Concept Tree Database Schema for MySQL 5.7
-- Compatible with Moodle 3.7 integration

CREATE DATABASE IF NOT EXISTS concept_tree_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE concept_tree_db;

-- Table: concepts
-- Stores individual mathematical concepts
CREATE TABLE IF NOT EXISTS concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    number INT NOT NULL COMMENT 'The number associated with this concept',
    concept_name VARCHAR(255) NOT NULL COMMENT 'Name of the concept (e.g., "Prime Numbers", "Even Numbers")',
    description TEXT COMMENT 'Detailed description of the concept',
    level INT DEFAULT 1 COMMENT 'Hierarchy level in the tree (1=root, 2=child, etc.)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_number (number),
    INDEX idx_level (level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: concept_relationships
-- Stores parent-child relationships between concepts
CREATE TABLE IF NOT EXISTS concept_relationships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    parent_concept_id INT NOT NULL,
    child_concept_id INT NOT NULL,
    relationship_type VARCHAR(50) DEFAULT 'is-a' COMMENT 'Type of relationship: is-a, part-of, related-to',
    weight DECIMAL(3,2) DEFAULT 1.0 COMMENT 'Strength of relationship (0.0-1.0)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (child_concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_relationship (parent_concept_id, child_concept_id),
    INDEX idx_parent (parent_concept_id),
    INDEX idx_child (child_concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: moodle_problems
-- Caches problem data from Moodle
CREATE TABLE IF NOT EXISTS moodle_problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_problem_id INT NOT NULL COMMENT 'Original problem ID from Moodle',
    course_id INT COMMENT 'Moodle course ID',
    problem_text TEXT NOT NULL COMMENT 'The problem statement',
    problem_type VARCHAR(50) COMMENT 'Type: multiple-choice, numeric, etc.',
    difficulty_level INT DEFAULT 1 COMMENT '1=easy, 5=hard',
    tags JSON COMMENT 'Tags for categorization',
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_moodle_problem (moodle_problem_id),
    INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: problem_concepts
-- Maps problems to concepts
CREATE TABLE IF NOT EXISTS problem_concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL,
    concept_id INT NOT NULL,
    relevance_score DECIMAL(3,2) DEFAULT 1.0 COMMENT 'How relevant this concept is to the problem',
    FOREIGN KEY (problem_id) REFERENCES moodle_problems(id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_problem_concept (problem_id, concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: user_interactions
-- Tracks user clicks and interactions
CREATE TABLE IF NOT EXISTS user_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT 'Moodle user ID',
    problem_id INT,
    clicked_number INT NOT NULL COMMENT 'The number that was clicked',
    concept_id INT COMMENT 'The concept that was displayed',
    session_id VARCHAR(255),
    interaction_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES moodle_problems(id) ON DELETE SET NULL,
    FOREIGN KEY (concept_id) REFERENCES concepts(id) ON DELETE SET NULL,
    INDEX idx_user (user_id),
    INDEX idx_session (session_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for demonstration
INSERT INTO concepts (number, concept_name, description, level) VALUES
(1, 'Natural Numbers', 'The counting numbers starting from 1', 1),
(2, 'Even Numbers', 'Numbers divisible by 2', 1),
(2, 'Prime Numbers', '2 is the only even prime number', 2),
(3, 'Odd Numbers', 'Numbers not divisible by 2', 1),
(3, 'Prime Numbers', '3 is a prime number', 2),
(4, 'Even Numbers', '4 is an even number', 1),
(4, 'Perfect Squares', '4 = 2²', 2),
(4, 'Composite Numbers', '4 has divisors other than 1 and itself', 2),
(5, 'Odd Numbers', '5 is odd', 1),
(5, 'Prime Numbers', '5 is a prime number', 2),
(6, 'Even Numbers', '6 is even', 1),
(6, 'Composite Numbers', '6 = 2 × 3', 2),
(6, 'Perfect Numbers', '6 is the first perfect number (1+2+3=6)', 3),
(7, 'Odd Numbers', '7 is odd', 1),
(7, 'Prime Numbers', '7 is a prime number', 2),
(8, 'Even Numbers', '8 is even', 1),
(8, 'Perfect Cubes', '8 = 2³', 2),
(9, 'Odd Numbers', '9 is odd', 1),
(9, 'Perfect Squares', '9 = 3²', 2),
(10, 'Even Numbers', '10 is even', 1),
(10, 'Composite Numbers', '10 = 2 × 5', 2);

-- Create relationships between concepts
INSERT INTO concept_relationships (parent_concept_id, child_concept_id, relationship_type, weight) VALUES
-- Number 2 relationships
(2, 3, 'related-to', 0.9),
-- Number 4 relationships
(6, 7, 'is-a', 1.0),
(6, 8, 'is-a', 0.8),
-- Number 6 relationships
(11, 12, 'is-a', 1.0),
(11, 13, 'is-a', 0.9);

-- Insert sample Moodle problem
INSERT INTO moodle_problems (moodle_problem_id, course_id, problem_text, problem_type, difficulty_level, tags) VALUES
(1, 101, 'What is 2 + 4?', 'numeric', 1, '["addition", "basic arithmetic"]'),
(2, 101, 'Is 7 a prime number?', 'true-false', 2, '["prime numbers", "number theory"]'),
(3, 102, 'Find all factors of 6', 'multiple-choice', 3, '["factors", "divisibility"]');

-- Link problems to concepts
INSERT INTO problem_concepts (problem_id, concept_id, relevance_score) VALUES
(1, 2, 1.0),  -- Problem 1 relates to concept about number 2
(1, 6, 1.0),  -- Problem 1 relates to concept about number 4
(2, 14, 1.0), -- Problem 2 relates to prime number 7
(3, 11, 1.0); -- Problem 3 relates to number 6
