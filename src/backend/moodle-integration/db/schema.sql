-- =====================================================
-- Shape Morph Animation System - Database Schema
-- For Moodle 3.7 with MySQL 5.7
-- =====================================================

-- Shape Morph 설정 테이블
CREATE TABLE IF NOT EXISTS mdl_shape_morph_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_course_id INT NOT NULL,
    animation_speed DECIMAL(3,2) DEFAULT 1.00 COMMENT '애니메이션 속도 (1.0 = 정상)',
    transition_duration INT DEFAULT 2000 COMMENT '전환 시간 (밀리초)',
    shape_style VARCHAR(50) DEFAULT 'smooth' COMMENT '형상 스타일',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Shape Morph 시스템 설정';

-- 개념 형상 매핑 테이블
CREATE TABLE IF NOT EXISTS mdl_concept_shapes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    concept_name VARCHAR(100) NOT NULL COMMENT '개념 이름',
    concept_category VARCHAR(50) NOT NULL COMMENT '개념 카테고리 (fraction, geometry, algebra 등)',
    shape_data JSON NOT NULL COMMENT '형상 정의 (SVG path, 좌표 등)',
    color_primary VARCHAR(7) NOT NULL COMMENT '주 색상 (HEX)',
    color_secondary VARCHAR(7) DEFAULT NULL COMMENT '보조 색상 (HEX)',
    description TEXT COMMENT '설명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_concept_name (concept_name),
    INDEX idx_category (concept_category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='개념별 형상 정의';

-- 전환 규칙 테이블
CREATE TABLE IF NOT EXISTS mdl_concept_transitions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_concept_id INT NOT NULL COMMENT '시작 개념',
    to_concept_id INT NOT NULL COMMENT '목표 개념',
    transition_type VARCHAR(50) DEFAULT 'morph' COMMENT '전환 타입 (morph, fade, slide 등)',
    duration_ms INT DEFAULT 2000 COMMENT '전환 시간 (밀리초)',
    easing_function VARCHAR(50) DEFAULT 'ease-in-out' COMMENT 'Easing 함수',
    keyframes JSON DEFAULT NULL COMMENT '중간 키프레임 정의',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_concept_id) REFERENCES mdl_concept_shapes(id) ON DELETE CASCADE,
    FOREIGN KEY (to_concept_id) REFERENCES mdl_concept_shapes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_transition (from_concept_id, to_concept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='개념 전환 규칙';

-- 학생 진행 상황 추적 테이블
CREATE TABLE IF NOT EXISTS mdl_student_shape_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    moodle_user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    moodle_course_id INT NOT NULL COMMENT 'Moodle 코스 ID',
    current_concept_id INT NOT NULL COMMENT '현재 개념',
    previous_concept_id INT DEFAULT NULL COMMENT '이전 개념',
    transition_state ENUM('idle', 'transitioning', 'completed') DEFAULT 'idle' COMMENT '전환 상태',
    animation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '마지막 애니메이션 시간',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (current_concept_id) REFERENCES mdl_concept_shapes(id) ON DELETE CASCADE,
    FOREIGN KEY (previous_concept_id) REFERENCES mdl_concept_shapes(id) ON DELETE SET NULL,
    INDEX idx_user_course (moodle_user_id, moodle_course_id),
    UNIQUE KEY unique_user_course (moodle_user_id, moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생별 진행 상황';

-- 애니메이션 이벤트 로그
CREATE TABLE IF NOT EXISTS mdl_shape_morph_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL COMMENT 'Moodle 사용자 ID',
    course_id INT NOT NULL COMMENT 'Moodle 코스 ID',
    event_type VARCHAR(50) NOT NULL COMMENT '이벤트 타입 (transition_start, transition_complete, interaction)',
    from_concept VARCHAR(100) DEFAULT NULL COMMENT '시작 개념',
    to_concept VARCHAR(100) DEFAULT NULL COMMENT '목표 개념',
    duration_ms INT DEFAULT NULL COMMENT '소요 시간 (밀리초)',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '이벤트 발생 시간',
    metadata JSON DEFAULT NULL COMMENT '추가 정보',
    INDEX idx_timestamp (timestamp),
    INDEX idx_event_type (event_type),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='애니메이션 이벤트 로그';

-- =====================================================
-- 초기 데이터 시드
-- =====================================================

-- 기본 개념 형상 데이터 (분수)
INSERT INTO mdl_concept_shapes (concept_name, concept_category, shape_data, color_primary, color_secondary, description) VALUES
('fraction_half', 'fraction', '{"type": "circle", "segments": 2, "filled": 1, "radius": 50}', '#FF6B6B', '#FFA07A', '1/2 분수 - 반원 표현'),
('fraction_third', 'fraction', '{"type": "circle", "segments": 3, "filled": 1, "radius": 50}', '#4ECDC4', '#95E1D3', '1/3 분수 - 삼등분 표현'),
('fraction_quarter', 'fraction', '{"type": "circle", "segments": 4, "filled": 1, "radius": 50}', '#45B7D1', '#96CEB4', '1/4 분수 - 사등분 표현'),
('fraction_two_thirds', 'fraction', '{"type": "circle", "segments": 3, "filled": 2, "radius": 50}', '#A8E6CF', '#FFD3B6', '2/3 분수'),
('fraction_three_quarters', 'fraction', '{"type": "circle", "segments": 4, "filled": 3, "radius": 50}', '#FFAAA5', '#FF8B94', '3/4 분수');

-- 기본 개념 형상 데이터 (기하학)
INSERT INTO mdl_concept_shapes (concept_name, concept_category, shape_data, color_primary, color_secondary, description) VALUES
('triangle', 'geometry', '{"type": "polygon", "sides": 3, "radius": 50, "rotation": 0}', '#FCBAD3', '#FFFFD2', '삼각형'),
('square', 'geometry', '{"type": "polygon", "sides": 4, "radius": 50, "rotation": 45}', '#F38181', '#AA96DA', '정사각형'),
('pentagon', 'geometry', '{"type": "polygon", "sides": 5, "radius": 50, "rotation": 0}', '#A8D8EA', '#FFAAA6', '오각형'),
('hexagon', 'geometry', '{"type": "polygon", "sides": 6, "radius": 50, "rotation": 0}', '#FF9FF3', '#FECA57', '육각형'),
('circle', 'geometry', '{"type": "circle", "radius": 50}', '#54A0FF', '#48DBF5', '원');

-- 분수 개념 전환 규칙
INSERT INTO mdl_concept_transitions (from_concept_id, to_concept_id, transition_type, duration_ms, easing_function) VALUES
(1, 2, 'morph', 2000, 'ease-in-out'), -- 1/2 -> 1/3
(2, 3, 'morph', 2000, 'ease-in-out'), -- 1/3 -> 1/4
(3, 1, 'morph', 2000, 'ease-in-out'), -- 1/4 -> 1/2
(2, 4, 'morph', 2000, 'ease-in-out'), -- 1/3 -> 2/3
(3, 5, 'morph', 2000, 'ease-in-out'); -- 1/4 -> 3/4

-- 기하학 개념 전환 규칙
INSERT INTO mdl_concept_transitions (from_concept_id, to_concept_id, transition_type, duration_ms, easing_function) VALUES
(6, 7, 'morph', 1500, 'ease-in-out'),  -- 삼각형 -> 사각형
(7, 8, 'morph', 1500, 'ease-in-out'),  -- 사각형 -> 오각형
(8, 9, 'morph', 1500, 'ease-in-out'),  -- 오각형 -> 육각형
(9, 10, 'morph', 1500, 'ease-in-out'), -- 육각형 -> 원
(10, 6, 'morph', 1500, 'ease-in-out'); -- 원 -> 삼각형

-- 기본 설정 (course_id = 1로 가정, 실제 환경에 맞게 수정 필요)
INSERT INTO mdl_shape_morph_config (moodle_course_id, animation_speed, transition_duration, shape_style, is_active) VALUES
(1, 1.00, 2000, 'smooth', TRUE);

-- =====================================================
-- 인덱스 최적화
-- =====================================================

-- 성능 향상을 위한 추가 인덱스
CREATE INDEX idx_progress_state ON mdl_student_shape_progress(transition_state);
CREATE INDEX idx_events_user_timestamp ON mdl_shape_morph_events(user_id, timestamp);

-- =====================================================
-- 완료 메시지
-- =====================================================
SELECT 'Shape Morph Database Schema Created Successfully!' as status;
SELECT CONCAT('Total Concept Shapes: ', COUNT(*)) as count FROM mdl_concept_shapes;
SELECT CONCAT('Total Transitions: ', COUNT(*)) as count FROM mdl_concept_transitions;
