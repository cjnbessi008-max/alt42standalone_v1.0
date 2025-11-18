-- Focus Light 웹앱 데이터베이스 스키마
-- MySQL 5.7 호환

CREATE DATABASE IF NOT EXISTS focus_light_app
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE focus_light_app;

-- 문제 테이블
CREATE TABLE problems (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '문제 제목',
    description TEXT COMMENT '문제 설명',
    subject VARCHAR(50) DEFAULT 'geometry' COMMENT '과목 (geometry, algebra 등)',
    grade_level VARCHAR(20) COMMENT '학년 (3학년, 4학년 등)',
    difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '난이도',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_subject (subject),
    INDEX idx_grade (grade_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='수학 문제 정보';

-- 도형 테이블
CREATE TABLE shapes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    problem_id INT NOT NULL COMMENT '문제 ID',
    shape_type VARCHAR(50) NOT NULL COMMENT '도형 타입 (triangle, rectangle, circle 등)',
    svg_data TEXT NOT NULL COMMENT 'SVG 경로 데이터',
    properties JSON COMMENT '도형 속성 (크기, 각도, 색상 등)',
    position_x INT DEFAULT 0 COMMENT 'X 좌표',
    position_y INT DEFAULT 0 COMMENT 'Y 좌표',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_problem (problem_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='도형 데이터';

-- Focus Light 요소 테이블 (강조할 핵심 조건)
CREATE TABLE focus_elements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shape_id INT NOT NULL COMMENT '도형 ID',
    element_type VARCHAR(50) NOT NULL COMMENT '요소 타입 (angle, side, vertex, area 등)',
    element_selector VARCHAR(100) NOT NULL COMMENT 'SVG 요소 선택자',
    label VARCHAR(100) COMMENT '라벨 텍스트',
    highlight_color VARCHAR(20) DEFAULT '#FFD700' COMMENT '강조 색상',
    glow_intensity INT DEFAULT 3 COMMENT '빛나는 강도 (1-5)',
    animation_type ENUM('pulse', 'glow', 'flash', 'static') DEFAULT 'glow' COMMENT '애니메이션 타입',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shape_id) REFERENCES shapes(id) ON DELETE CASCADE,
    INDEX idx_shape (shape_id),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Focus Light 강조 요소';

-- 사용자 진행 상황 (선택사항, 향후 Moodle 연동 대비)
CREATE TABLE user_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT COMMENT '사용자 ID (Moodle user_id와 매핑)',
    problem_id INT NOT NULL,
    completed BOOLEAN DEFAULT FALSE COMMENT '완료 여부',
    score DECIMAL(5,2) COMMENT '점수',
    time_spent INT COMMENT '소요 시간 (초)',
    attempts INT DEFAULT 0 COMMENT '시도 횟수',
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_problem_user (problem_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='사용자 진행 상황';

-- 샘플 데이터 삽입
INSERT INTO problems (title, description, subject, grade_level, difficulty) VALUES
('직각삼각형의 빗변 찾기', '직각삼각형에서 빗변의 길이를 구하는 문제입니다.', 'geometry', '5학년', 'medium'),
('정사각형의 넓이', '한 변의 길이가 주어진 정사각형의 넓이를 구하세요.', 'geometry', '3학년', 'easy'),
('원의 둘레', '반지름이 주어진 원의 둘레를 계산하세요.', 'geometry', '4학년', 'medium');

-- 샘플 도형 데이터: 직각삼각형
INSERT INTO shapes (problem_id, shape_type, svg_data, properties, position_x, position_y) VALUES
(1, 'triangle',
 'M 50,200 L 200,200 L 200,50 Z',
 '{"width": 150, "height": 150, "angles": [90, 45, 45], "sides": {"a": 150, "b": 150, "c": 212.13}}',
 100, 100);

-- 샘플 Focus Light 요소: 빗변 강조
INSERT INTO focus_elements (shape_id, element_type, element_selector, label, highlight_color, glow_intensity, animation_type, display_order) VALUES
(1, 'side', '.hypotenuse', '빗변', '#FFD700', 4, 'glow', 1),
(1, 'angle', '.right-angle', '90°', '#FF6B6B', 3, 'pulse', 2);

-- 샘플 도형 데이터: 정사각형
INSERT INTO shapes (problem_id, shape_type, svg_data, properties, position_x, position_y) VALUES
(2, 'rectangle',
 'M 50,50 L 200,50 L 200,200 L 50,200 Z',
 '{"width": 150, "height": 150, "angles": [90, 90, 90, 90], "sides": {"all": 150}}',
 100, 100);

-- 샘플 Focus Light 요소: 한 변 강조
INSERT INTO focus_elements (shape_id, element_type, element_selector, label, highlight_color, glow_intensity, animation_type, display_order) VALUES
(2, 'side', '.side-length', '한 변', '#4ECDC4', 4, 'glow', 1);

-- 샘플 도형 데이터: 원
INSERT INTO shapes (problem_id, shape_type, svg_data, properties, position_x, position_y) VALUES
(3, 'circle',
 'M 150,150 m -100,0 a 100,100 0 1,0 200,0 a 100,100 0 1,0 -200,0',
 '{"radius": 100, "diameter": 200, "center": {"x": 150, "y": 150}}',
 100, 100);

-- 샘플 Focus Light 요소: 반지름 강조
INSERT INTO focus_elements (shape_id, element_type, element_selector, label, highlight_color, glow_intensity, animation_type, display_order) VALUES
(3, 'radius', '.radius-line', '반지름 (r)', '#9B59B6', 4, 'glow', 1);
