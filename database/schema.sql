-- ============================================================================
-- Moodle Prerequisite Knowledge Checker - Database Schema
-- MySQL 5.7
-- ============================================================================

-- Drop tables if exists (for clean installation)
DROP TABLE IF EXISTS recommendations;
DROP TABLE IF EXISTS student_knowledge;
DROP TABLE IF EXISTS module_concepts;
DROP TABLE IF EXISTS moodle_modules;
DROP TABLE IF EXISTS moodle_courses;
DROP TABLE IF EXISTS concept_prerequisites;
DROP TABLE IF EXISTS knowledge_concepts;
DROP TABLE IF EXISTS moodle_sync_log;
DROP TABLE IF EXISTS system_settings;

-- ============================================================================
-- Knowledge Graph Tables
-- ============================================================================

-- Knowledge concepts (지식 개념)
CREATE TABLE knowledge_concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concept_code VARCHAR(100) NOT NULL UNIQUE COMMENT '개념 코드 (예: MATH_FRACTION_BASIC)',
    concept_name VARCHAR(255) NOT NULL COMMENT '개념 이름',
    concept_name_ko VARCHAR(255) NOT NULL COMMENT '개념 이름 (한국어)',
    description TEXT COMMENT '개념 설명',
    subject VARCHAR(50) NOT NULL DEFAULT 'mathematics' COMMENT '과목',
    grade_level VARCHAR(20) COMMENT '학년 수준',
    difficulty_level TINYINT DEFAULT 1 COMMENT '난이도 (1-5)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_subject (subject),
    INDEX idx_grade (grade_level),
    INDEX idx_difficulty (difficulty_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='지식 개념 정의';

-- Concept prerequisites (전제지식 관계)
CREATE TABLE concept_prerequisites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concept_id INT NOT NULL COMMENT '학습할 개념 ID',
    prerequisite_id INT NOT NULL COMMENT '필요한 전제지식 ID',
    importance ENUM('required', 'recommended', 'optional') DEFAULT 'required' COMMENT '중요도',
    minimum_mastery_level DECIMAL(3,2) DEFAULT 0.70 COMMENT '최소 숙달 수준 (0.00-1.00)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES knowledge_concepts(id) ON DELETE CASCADE,
    FOREIGN KEY (prerequisite_id) REFERENCES knowledge_concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_prerequisite (concept_id, prerequisite_id),
    INDEX idx_concept (concept_id),
    INDEX idx_prerequisite (prerequisite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='전제지식 관계 그래프';

-- ============================================================================
-- Moodle Integration Tables
-- ============================================================================

-- Moodle courses cache (코스 정보 캐시)
CREATE TABLE moodle_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_course_id INT NOT NULL UNIQUE COMMENT 'Moodle 코스 ID',
    course_name VARCHAR(255) NOT NULL,
    course_fullname TEXT,
    category_id INT COMMENT 'Moodle 카테고리 ID',
    visible TINYINT(1) DEFAULT 1,
    start_date INT COMMENT 'Unix timestamp',
    end_date INT COMMENT 'Unix timestamp',
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_moodle_id (moodle_course_id),
    INDEX idx_visible (visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 코스 정보 캐시';

-- Moodle modules/activities (퀴즈, 과제 등)
CREATE TABLE moodle_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_module_id INT NOT NULL COMMENT 'Moodle 모듈 ID',
    moodle_course_id INT NOT NULL COMMENT 'Moodle 코스 ID',
    course_id INT COMMENT 'Local course reference',
    module_type VARCHAR(50) NOT NULL COMMENT '모듈 타입 (quiz, assign, etc)',
    module_name VARCHAR(255) NOT NULL,
    description TEXT,
    visible TINYINT(1) DEFAULT 1,
    last_synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES moodle_courses(id) ON DELETE SET NULL,
    INDEX idx_moodle_module (moodle_module_id),
    INDEX idx_course (course_id),
    INDEX idx_type (module_type),
    INDEX idx_moodle_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 모듈/활동 정보';

-- Module to concept mapping (모듈과 개념 매핑)
CREATE TABLE module_concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL COMMENT 'Local module ID',
    concept_id INT NOT NULL COMMENT '개념 ID',
    is_primary TINYINT(1) DEFAULT 0 COMMENT '주요 개념 여부',
    weight DECIMAL(3,2) DEFAULT 1.00 COMMENT '가중치 (0.00-1.00)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES moodle_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (concept_id) REFERENCES knowledge_concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_module_concept (module_id, concept_id),
    INDEX idx_module (module_id),
    INDEX idx_concept (concept_id),
    INDEX idx_primary (is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='모듈과 지식 개념 매핑';

-- ============================================================================
-- Student Assessment Tables
-- ============================================================================

-- Student knowledge assessment (학생 지식 평가)
CREATE TABLE student_knowledge (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    student_name VARCHAR(255) COMMENT '학생 이름',
    concept_id INT NOT NULL COMMENT '개념 ID',
    mastery_level DECIMAL(3,2) DEFAULT 0.00 COMMENT '숙달 수준 (0.00-1.00)',
    confidence_score DECIMAL(3,2) DEFAULT 0.00 COMMENT '신뢰도 (0.00-1.00)',
    evidence_count INT DEFAULT 0 COMMENT '평가 근거 데이터 수',
    last_assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (concept_id) REFERENCES knowledge_concepts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_concept (moodle_user_id, concept_id),
    INDEX idx_student (moodle_user_id),
    INDEX idx_concept (concept_id),
    INDEX idx_mastery (mastery_level),
    INDEX idx_last_assessed (last_assessed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생별 지식 숙달 수준';

-- Recommendations (학습 추천)
CREATE TABLE recommendations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    target_module_id INT NOT NULL COMMENT '학습하려는 모듈',
    missing_concept_id INT NOT NULL COMMENT '부족한 전제지식 개념',
    current_mastery DECIMAL(3,2) DEFAULT 0.00 COMMENT '현재 숙달 수준',
    required_mastery DECIMAL(3,2) DEFAULT 0.70 COMMENT '필요한 숙달 수준',
    priority ENUM('high', 'medium', 'low') DEFAULT 'medium' COMMENT '우선순위',
    status ENUM('pending', 'in_progress', 'completed', 'dismissed') DEFAULT 'pending',
    recommended_modules TEXT COMMENT 'JSON array of recommended module IDs',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (target_module_id) REFERENCES moodle_modules(id) ON DELETE CASCADE,
    FOREIGN KEY (missing_concept_id) REFERENCES knowledge_concepts(id) ON DELETE CASCADE,
    INDEX idx_student (moodle_user_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학습 추천 내역';

-- ============================================================================
-- System Tables
-- ============================================================================

-- Moodle sync log (동기화 로그)
CREATE TABLE moodle_sync_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sync_type VARCHAR(50) NOT NULL COMMENT '동기화 타입 (courses, modules, grades)',
    status ENUM('started', 'success', 'failed', 'partial') DEFAULT 'started',
    records_processed INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    INDEX idx_type (sync_type),
    INDEX idx_status (status),
    INDEX idx_started (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 동기화 로그';

-- System settings (시스템 설정)
CREATE TABLE system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='시스템 설정';

-- ============================================================================
-- Initial System Settings
-- ============================================================================

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('default_mastery_threshold', '0.70', '기본 숙달 수준 임계값'),
('confidence_min_evidence', '3', '신뢰도 계산을 위한 최소 평가 데이터 수'),
('sync_interval_hours', '24', 'Moodle 동기화 주기 (시간)'),
('recommendation_max_items', '5', '최대 추천 항목 수'),
('assessment_decay_days', '90', '평가 데이터 유효 기간 (일)');
