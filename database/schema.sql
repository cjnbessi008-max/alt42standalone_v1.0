-- Stat Story Mode Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

-- 스토리 시나리오 테이블
CREATE TABLE IF NOT EXISTS story_scenarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL COMMENT '스토리 제목',
    description TEXT COMMENT '스토리 설명',
    stat_concept VARCHAR(100) NOT NULL COMMENT '통계 개념 (mean, median, mode, variance, etc.)',
    difficulty_level ENUM('basic', 'intermediate', 'advanced') NOT NULL DEFAULT 'basic',
    target_grade VARCHAR(20) COMMENT '대상 학년 (중1, 중2, 중3, 고1, 고2, 고3)',
    story_content JSON COMMENT '스토리 내용 (단계별 스크립트)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    INDEX idx_stat_concept (stat_concept),
    INDEX idx_difficulty (difficulty_level),
    INDEX idx_target_grade (target_grade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='스토리 시나리오 마스터';

-- 스토리 단계 테이블
CREATE TABLE IF NOT EXISTS story_steps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scenario_id INT NOT NULL,
    step_order INT NOT NULL COMMENT '단계 순서',
    step_type ENUM('dialogue', 'explanation', 'question', 'practice', 'quiz') NOT NULL,
    character_name VARCHAR(100) COMMENT '캐릭터 이름',
    dialogue_text TEXT COMMENT '대화 내용',
    explanation_content TEXT COMMENT '설명 내용',
    question_data JSON COMMENT '문제 데이터',
    hint_text TEXT COMMENT '힌트',
    next_step_id INT COMMENT '다음 단계 ID (NULL이면 자동)',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES story_scenarios(id) ON DELETE CASCADE,
    INDEX idx_scenario_step (scenario_id, step_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='스토리 진행 단계';

-- 학생 진행 상황 테이블
CREATE TABLE IF NOT EXISTS student_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL COMMENT 'Moodle 학생 ID',
    scenario_id INT NOT NULL,
    current_step_id INT NOT NULL,
    completed_steps JSON COMMENT '완료한 단계 ID 배열',
    score INT DEFAULT 0 COMMENT '획득 점수',
    total_attempts INT DEFAULT 0 COMMENT '총 시도 횟수',
    correct_answers INT DEFAULT 0 COMMENT '정답 수',
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    completion_time TIMESTAMP NULL COMMENT '완료 시간',
    is_completed BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (scenario_id) REFERENCES story_scenarios(id) ON DELETE CASCADE,
    FOREIGN KEY (current_step_id) REFERENCES story_steps(id) ON DELETE CASCADE,
    INDEX idx_student (student_id),
    INDEX idx_student_scenario (student_id, scenario_id),
    UNIQUE KEY unique_student_scenario (student_id, scenario_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생별 진행 상황';

-- 학생 답안 기록 테이블
CREATE TABLE IF NOT EXISTS student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    progress_id INT NOT NULL,
    step_id INT NOT NULL,
    student_answer TEXT COMMENT '학생 답안',
    is_correct BOOLEAN NOT NULL,
    attempt_number INT DEFAULT 1 COMMENT '시도 횟수',
    time_spent INT COMMENT '소요 시간(초)',
    hint_used BOOLEAN DEFAULT FALSE COMMENT '힌트 사용 여부',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (progress_id) REFERENCES student_progress(id) ON DELETE CASCADE,
    FOREIGN KEY (step_id) REFERENCES story_steps(id) ON DELETE CASCADE,
    INDEX idx_progress (progress_id),
    INDEX idx_step (step_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 답안 기록';

-- Moodle 연동 설정 테이블
CREATE TABLE IF NOT EXISTS moodle_integration (
    id INT AUTO_INCREMENT PRIMARY KEY,
    scenario_id INT NOT NULL,
    moodle_course_id INT NOT NULL COMMENT 'Moodle 코스 ID',
    moodle_activity_id INT COMMENT 'Moodle 활동 ID',
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_sync TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (scenario_id) REFERENCES story_scenarios(id) ON DELETE CASCADE,
    INDEX idx_moodle_course (moodle_course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Moodle 연동 설정';

-- 통계 개념 마스터 테이블
CREATE TABLE IF NOT EXISTS stat_concepts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    concept_code VARCHAR(50) UNIQUE NOT NULL COMMENT '개념 코드',
    concept_name_ko VARCHAR(100) NOT NULL COMMENT '개념명 (한글)',
    concept_name_en VARCHAR(100) NOT NULL COMMENT '개념명 (영문)',
    category ENUM('descriptive', 'probability', 'inference', 'correlation') NOT NULL,
    description TEXT COMMENT '개념 설명',
    formula TEXT COMMENT '수식',
    difficulty INT DEFAULT 1 COMMENT '난이도 (1-5)',
    prerequisite_concepts JSON COMMENT '선수 개념 코드 배열',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='통계 개념 마스터';

-- 캐릭터 테이블
CREATE TABLE IF NOT EXISTS characters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    character_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(100) COMMENT '역할 (선생님, 학생, 조력자 등)',
    avatar_url VARCHAR(255) COMMENT '아바타 이미지 URL',
    personality TEXT COMMENT '성격 설명',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='스토리 캐릭터';

-- 성취 배지 테이블
CREATE TABLE IF NOT EXISTS achievements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    achievement_type VARCHAR(50) NOT NULL COMMENT '배지 타입',
    achievement_name VARCHAR(100) NOT NULL,
    description TEXT,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='학생 성취 배지';
