-- Shape Explainer Database Schema
-- MySQL 5.7 Compatible

CREATE DATABASE IF NOT EXISTS shape_explainer DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE shape_explainer;

-- 도형 유형 테이블
CREATE TABLE IF NOT EXISTS shape_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name_ko VARCHAR(100) NOT NULL COMMENT '한글 이름',
    name_en VARCHAR(100) NOT NULL COMMENT '영어 이름',
    category ENUM('2D', '3D') NOT NULL DEFAULT '2D',
    description TEXT COMMENT '도형 설명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 도형 속성 테이블
CREATE TABLE IF NOT EXISTS shape_properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shape_type_id INT NOT NULL,
    property_key VARCHAR(50) NOT NULL COMMENT '속성 키 (vertices, edges, faces 등)',
    property_value VARCHAR(255) NOT NULL COMMENT '속성 값',
    description_ko TEXT COMMENT '한글 설명',
    description_en TEXT COMMENT '영어 설명',
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shape_type_id) REFERENCES shape_types(id) ON DELETE CASCADE,
    INDEX idx_shape_type (shape_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Moodle 문제 정보 테이블
CREATE TABLE IF NOT EXISTS moodle_questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_question_id INT NOT NULL UNIQUE COMMENT 'Moodle 문제 ID',
    moodle_course_id INT NOT NULL COMMENT 'Moodle 코스 ID',
    shape_type_id INT NOT NULL,
    question_text TEXT NOT NULL,
    question_type ENUM('identification', 'properties', 'decomposition', 'comparison') NOT NULL,
    difficulty_level TINYINT DEFAULT 1 COMMENT '난이도 (1-5)',
    animation_config JSON COMMENT '애니메이션 설정',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (shape_type_id) REFERENCES shape_types(id),
    INDEX idx_moodle_question (moodle_question_id),
    INDEX idx_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 학생 학습 기록 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    moodle_question_id INT NOT NULL,
    shape_type_id INT NOT NULL,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    time_spent INT DEFAULT 0 COMMENT '소요 시간 (초)',
    interaction_count INT DEFAULT 0 COMMENT '상호작용 횟수',
    animation_viewed BOOLEAN DEFAULT FALSE COMMENT '애니메이션 시청 여부',
    score DECIMAL(5,2) DEFAULT 0.00 COMMENT '점수',
    FOREIGN KEY (moodle_question_id) REFERENCES moodle_questions(id),
    FOREIGN KEY (shape_type_id) REFERENCES shape_types(id),
    INDEX idx_user (moodle_user_id),
    INDEX idx_question (moodle_question_id),
    INDEX idx_completed (completed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 애니메이션 단계 테이블
CREATE TABLE IF NOT EXISTS animation_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shape_type_id INT NOT NULL,
    step_number INT NOT NULL,
    step_type ENUM('decompose', 'highlight', 'rotate', 'transform', 'explain') NOT NULL,
    step_config JSON NOT NULL COMMENT '단계별 설정',
    description_ko TEXT,
    description_en TEXT,
    duration_ms INT DEFAULT 1000 COMMENT '애니메이션 길이 (밀리초)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shape_type_id) REFERENCES shape_types(id) ON DELETE CASCADE,
    INDEX idx_shape_step (shape_type_id, step_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 세션 테이블 (사용자 세션 관리)
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(128) PRIMARY KEY,
    moodle_user_id INT NOT NULL,
    session_data TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_session (moodle_user_id),
    INDEX idx_last_accessed (last_accessed)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 초기 데이터 삽입: 기본 도형들
INSERT INTO shape_types (name_ko, name_en, category, description) VALUES
('삼각형', 'Triangle', '2D', '3개의 변과 3개의 꼭짓점을 가진 도형'),
('사각형', 'Rectangle', '2D', '4개의 변과 4개의 직각을 가진 도형'),
('정사각형', 'Square', '2D', '4개의 같은 길이의 변과 4개의 직각을 가진 도형'),
('원', 'Circle', '2D', '중심으로부터 같은 거리에 있는 점들의 집합'),
('오각형', 'Pentagon', '2D', '5개의 변과 5개의 꼭짓점을 가진 도형'),
('육각형', 'Hexagon', '2D', '6개의 변과 6개의 꼭짓점을 가진 도형'),
('정육면체', 'Cube', '3D', '6개의 정사각형 면을 가진 입체도형'),
('구', 'Sphere', '3D', '중심으로부터 같은 거리에 있는 점들의 집합(3차원)'),
('원기둥', 'Cylinder', '3D', '2개의 원형 밑면과 곡면을 가진 입체도형'),
('원뿔', 'Cone', '3D', '1개의 원형 밑면과 꼭짓점을 가진 입체도형');

-- 초기 데이터: 삼각형 속성
INSERT INTO shape_properties (shape_type_id, property_key, property_value, description_ko, description_en, display_order) VALUES
(1, 'vertices', '3', '3개의 꼭짓점', '3 vertices', 1),
(1, 'edges', '3', '3개의 변', '3 edges', 2),
(1, 'angles', '3', '3개의 각', '3 angles', 3),
(1, 'angle_sum', '180°', '내각의 합은 180도', 'Sum of angles is 180 degrees', 4);

-- 초기 데이터: 정사각형 속성
INSERT INTO shape_properties (shape_type_id, property_key, property_value, description_ko, description_en, display_order) VALUES
(3, 'vertices', '4', '4개의 꼭짓점', '4 vertices', 1),
(3, 'edges', '4', '4개의 변 (모두 같은 길이)', '4 edges (all equal length)', 2),
(3, 'angles', '4', '4개의 직각 (90도)', '4 right angles (90 degrees)', 3),
(3, 'symmetry', '4', '4개의 대칭축', '4 lines of symmetry', 4);

-- 초기 데이터: 원 속성
INSERT INTO shape_properties (shape_type_id, property_key, property_value, description_ko, description_en, display_order) VALUES
(4, 'radius', 'r', '반지름', 'radius', 1),
(4, 'diameter', '2r', '지름 (반지름의 2배)', 'diameter (2 times radius)', 2),
(4, 'circumference', '2πr', '둘레 (2파이r)', 'circumference (2πr)', 3),
(4, 'area', 'πr²', '넓이 (파이r제곱)', 'area (πr²)', 4);

-- 초기 데이터: 삼각형 애니메이션 단계
INSERT INTO animation_steps (shape_type_id, step_number, step_type, step_config, description_ko, description_en, duration_ms) VALUES
(1, 1, 'highlight', '{"element": "vertices", "color": "#ff0000"}', '꼭짓점 강조', 'Highlight vertices', 1000),
(1, 2, 'highlight', '{"element": "edges", "color": "#00ff00"}', '변 강조', 'Highlight edges', 1000),
(1, 3, 'decompose', '{"method": "separate", "parts": ["angle1", "angle2", "angle3"]}', '각도 분리', 'Separate angles', 1500),
(1, 4, 'explain', '{"text": "내각의 합 = 180도"}', '내각 설명', 'Explain angle sum', 2000);
