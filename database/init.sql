-- AI Education System Database Initialization
-- MySQL 5.7 compatible

CREATE DATABASE IF NOT EXISTS ai_education
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ai_education;

-- Teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  institution VARCHAR(255),
  role ENUM('teacher', 'admin', 'system_maintainer') DEFAULT 'teacher',
  preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Students table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  grade_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_grade (grade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  subject ENUM('mathematics') DEFAULT 'mathematics',
  grade_level VARCHAR(50),
  teacher_id VARCHAR(36),
  status ENUM('generating', 'active', 'archived') DEFAULT 'generating',
  world_model JSON,
  generated_schema JSON,
  generated_ui JSON,
  version INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_teacher (teacher_id),
  INDEX idx_status (status),
  INDEX idx_subject (subject)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Generation Jobs table
CREATE TABLE IF NOT EXISTS generation_jobs (
  id VARCHAR(36) PRIMARY KEY,
  module_id VARCHAR(36),
  stage ENUM('world_model', 'rules', 'data', 'input_strategy', 'ui', 'deployment'),
  status ENUM('pending', 'in_progress', 'completed', 'failed') DEFAULT 'pending',
  input_data JSON,
  output_data JSON,
  error_log TEXT,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module (module_id),
  INDEX idx_status (status),
  INDEX idx_stage (stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rules table
CREATE TABLE IF NOT EXISTS rules (
  id VARCHAR(36) PRIMARY KEY,
  module_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  type ENUM('validation', 'calculation', 'progression', 'feedback'),
  complexity_score INT DEFAULT 0,
  is_ontology BOOLEAN DEFAULT FALSE,
  code TEXT,
  ontology_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  INDEX idx_module (module_id),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- LTI Integrations table (for Moodle)
CREATE TABLE IF NOT EXISTS lti_integrations (
  id VARCHAR(36) PRIMARY KEY,
  platform_name VARCHAR(255) NOT NULL,
  platform_url VARCHAR(255) NOT NULL,
  client_id VARCHAR(255) NOT NULL,
  deployment_id VARCHAR(255),
  auth_endpoint VARCHAR(255),
  token_endpoint VARCHAR(255),
  jwks_url VARCHAR(255),
  public_key TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_client (client_id),
  INDEX idx_platform (platform_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for development
INSERT INTO teachers (id, name, email, role) VALUES
  ('teacher-1', 'Test Teacher', 'teacher@kaist.ac.kr', 'teacher'),
  ('admin-1', 'Admin User', 'admin@kaist.ac.kr', 'admin')
ON DUPLICATE KEY UPDATE email=email;
