-- MySQL 5.7 Database Schema for Contrapositive Flip
-- Compatible with Moodle 3.7

-- Main table for storing contrapositive questions
CREATE TABLE IF NOT EXISTS mdl_contrapositive_questions (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    moodle_question_id BIGINT(10) UNSIGNED NOT NULL,
    course_id BIGINT(10) UNSIGNED NOT NULL,

    -- Original proposition
    original_statement VARCHAR(500) NOT NULL,
    original_antecedent VARCHAR(250) NOT NULL COMMENT 'P: If P',
    original_consequent VARCHAR(250) NOT NULL COMMENT 'Q: then Q',

    -- Contrapositive (automatically generated)
    contrapositive_statement VARCHAR(500) NOT NULL,
    contrapositive_antecedent VARCHAR(250) NOT NULL COMMENT 'not Q: If not Q',
    contrapositive_consequent VARCHAR(250) NOT NULL COMMENT 'not P: then not P',

    -- Metadata
    difficulty_level TINYINT(1) DEFAULT 1 COMMENT '1=Easy, 2=Medium, 3=Hard',
    language VARCHAR(10) DEFAULT 'ko' COMMENT 'ko=Korean, en=English',

    -- Timestamps
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    KEY idx_moodle_question (moodle_question_id),
    KEY idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Contrapositive flip questions';

-- Table for tracking student interactions
CREATE TABLE IF NOT EXISTS mdl_contrapositive_attempts (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id BIGINT(10) UNSIGNED NOT NULL,
    user_id BIGINT(10) UNSIGNED NOT NULL,

    -- Interaction data
    flip_count INT(5) DEFAULT 0 COMMENT 'Number of times flipped',
    time_spent INT(10) DEFAULT 0 COMMENT 'Seconds spent on question',

    -- Understanding check
    understood TINYINT(1) DEFAULT NULL COMMENT '1=Yes, 0=No, NULL=Not answered',
    user_answer TEXT COMMENT 'Student written explanation',

    -- Timestamps
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    KEY idx_question (question_id),
    KEY idx_user (user_id),
    CONSTRAINT fk_contrapositive_question
        FOREIGN KEY (question_id)
        REFERENCES mdl_contrapositive_questions(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student interaction with contrapositive questions';

-- Table for storing pre-configured templates
CREATE TABLE IF NOT EXISTS mdl_contrapositive_templates (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,

    -- Template information
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50) DEFAULT 'general' COMMENT 'math, logic, science, etc.',

    -- Pattern for automatic generation
    antecedent_pattern VARCHAR(250) NOT NULL,
    consequent_pattern VARCHAR(250) NOT NULL,

    -- Negation rules (JSON format)
    negation_rules TEXT COMMENT 'JSON: rules for generating negations',

    -- Usage statistics
    usage_count INT(10) DEFAULT 0,

    -- Timestamps
    timecreated BIGINT(10) UNSIGNED NOT NULL,
    timemodified BIGINT(10) UNSIGNED NOT NULL,

    PRIMARY KEY (id),
    KEY idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Templates for contrapositive generation';

-- Table for analytics
CREATE TABLE IF NOT EXISTS mdl_contrapositive_analytics (
    id BIGINT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
    question_id BIGINT(10) UNSIGNED NOT NULL,

    -- Aggregated metrics (updated daily)
    total_views INT(10) DEFAULT 0,
    total_flips INT(10) DEFAULT 0,
    avg_time_spent DECIMAL(8,2) DEFAULT 0.00,
    understanding_rate DECIMAL(5,2) DEFAULT 0.00 COMMENT 'Percentage who understood',

    -- Date for this snapshot
    date_recorded DATE NOT NULL,

    PRIMARY KEY (id),
    UNIQUE KEY unique_question_date (question_id, date_recorded),
    KEY idx_date (date_recorded)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Daily analytics for contrapositive questions';

-- Insert sample templates
INSERT INTO mdl_contrapositive_templates
    (name, description, category, antecedent_pattern, consequent_pattern, negation_rules, usage_count, timecreated, timemodified)
VALUES
    (
        'Basic Math Implication',
        'Template for basic mathematical implications',
        'math',
        'x > 5',
        'x > 3',
        '{"antecedent_neg": "x ≤ 3", "consequent_neg": "x ≤ 5"}',
        0,
        UNIX_TIMESTAMP(),
        UNIX_TIMESTAMP()
    ),
    (
        'Geometric Property',
        'Template for geometric properties',
        'geometry',
        'A figure is a square',
        'A figure has 4 equal sides',
        '{"antecedent_neg": "A figure does not have 4 equal sides", "consequent_neg": "A figure is not a square"}',
        0,
        UNIX_TIMESTAMP(),
        UNIX_TIMESTAMP()
    ),
    (
        'Set Theory',
        'Template for set theory propositions',
        'logic',
        'x ∈ A',
        'x ∈ B',
        '{"antecedent_neg": "x ∉ B", "consequent_neg": "x ∉ A"}',
        0,
        UNIX_TIMESTAMP(),
        UNIX_TIMESTAMP()
    );
