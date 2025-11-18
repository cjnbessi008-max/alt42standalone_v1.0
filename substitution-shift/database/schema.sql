-- Substitution Shift Database Schema
-- MySQL 5.7 Compatible
-- Created: 2025-11-18

CREATE DATABASE IF NOT EXISTS substitution_shift
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE substitution_shift;

-- ============================================
-- Table: substitution_problems
-- Description: 치환적분 문제 정보
-- ============================================
CREATE TABLE IF NOT EXISTS substitution_problems (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Moodle 연동 정보
  moodle_question_id INT UNSIGNED NULL COMMENT 'Moodle 문제 ID',
  moodle_course_id INT UNSIGNED NULL COMMENT 'Moodle 코스 ID',

  -- 문제 내용
  title VARCHAR(255) NOT NULL COMMENT '문제 제목',
  description TEXT NULL COMMENT '문제 설명',

  -- 적분 표현식 (LaTeX)
  original_integral TEXT NOT NULL COMMENT '원본 적분식 (LaTeX)',

  -- 치환 정보
  substitution_variable VARCHAR(10) NOT NULL DEFAULT 'u' COMMENT '치환 변수 (u, t, w 등)',
  substitution_expression TEXT NOT NULL COMMENT '치환식 (예: x^2)',
  du_expression TEXT NOT NULL COMMENT 'du 표현식 (예: 2x dx)',

  -- 단계별 정보 (JSON)
  steps JSON NOT NULL COMMENT '치환 단계별 정보 [{"step": 1, "expression": "...", "color": "#FF0000"}]',

  -- 정답
  final_answer TEXT NOT NULL COMMENT '최종 답 (LaTeX)',

  -- 난이도 및 카테고리
  difficulty_level ENUM('easy', 'medium', 'hard') DEFAULT 'medium' COMMENT '난이도',
  category VARCHAR(100) NULL COMMENT '카테고리 (삼각함수, 지수함수 등)',

  -- 학습 목표
  learning_objectives TEXT NULL COMMENT '학습 목표',
  hints JSON NULL COMMENT '힌트 정보',

  -- 메타데이터
  is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
  created_by INT UNSIGNED NULL COMMENT '생성자 (teacher ID)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_moodle_question (moodle_question_id),
  INDEX idx_difficulty (difficulty_level),
  INDEX idx_category (category),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='치환적분 문제 정보';

-- ============================================
-- Table: student_attempts
-- Description: 학생의 문제 풀이 시도 기록
-- ============================================
CREATE TABLE IF NOT EXISTS student_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- 학생 및 문제 정보
  student_id INT UNSIGNED NOT NULL COMMENT 'Moodle 학생 ID',
  problem_id INT UNSIGNED NOT NULL COMMENT '문제 ID',

  -- 시도 정보
  attempt_number INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '시도 횟수',

  -- 학생 답안
  student_answer TEXT NULL COMMENT '학생이 입력한 답',
  selected_substitution VARCHAR(50) NULL COMMENT '학생이 선택한 치환 변수',

  -- 단계별 진행 (JSON)
  step_progress JSON NULL COMMENT '각 단계별 완료 여부 및 소요 시간',

  -- 결과
  is_correct BOOLEAN NULL COMMENT '정답 여부',
  score DECIMAL(5,2) NULL COMMENT '점수 (0-100)',
  partial_credit DECIMAL(5,2) NULL COMMENT '부분 점수',

  -- 시간 정보
  time_spent_seconds INT UNSIGNED NULL COMMENT '문제 풀이 소요 시간 (초)',
  started_at TIMESTAMP NULL COMMENT '시작 시간',
  submitted_at TIMESTAMP NULL COMMENT '제출 시간',

  -- 피드백
  feedback TEXT NULL COMMENT 'AI 생성 피드백',

  -- 메타데이터
  ip_address VARCHAR(45) NULL COMMENT '접속 IP',
  user_agent VARCHAR(255) NULL COMMENT '브라우저 정보',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (problem_id) REFERENCES substitution_problems(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_problem (problem_id),
  INDEX idx_student_problem (student_id, problem_id),
  INDEX idx_submitted (submitted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생 문제 풀이 시도 기록';

-- ============================================
-- Table: student_progress
-- Description: 학생별 전체 학습 진행도
-- ============================================
CREATE TABLE IF NOT EXISTS student_progress (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  student_id INT UNSIGNED NOT NULL COMMENT 'Moodle 학생 ID',

  -- 진행도 통계
  total_problems_attempted INT UNSIGNED DEFAULT 0 COMMENT '시도한 문제 수',
  total_problems_correct INT UNSIGNED DEFAULT 0 COMMENT '정답 처리된 문제 수',
  total_time_spent_seconds INT UNSIGNED DEFAULT 0 COMMENT '총 학습 시간 (초)',

  -- 난이도별 통계
  easy_correct INT UNSIGNED DEFAULT 0,
  easy_attempted INT UNSIGNED DEFAULT 0,
  medium_correct INT UNSIGNED DEFAULT 0,
  medium_attempted INT UNSIGNED DEFAULT 0,
  hard_correct INT UNSIGNED DEFAULT 0,
  hard_attempted INT UNSIGNED DEFAULT 0,

  -- 평균 점수
  average_score DECIMAL(5,2) NULL COMMENT '평균 점수',

  -- 숙련도 레벨
  mastery_level ENUM('beginner', 'intermediate', 'advanced', 'expert') DEFAULT 'beginner',

  -- 마지막 활동
  last_activity_at TIMESTAMP NULL COMMENT '마지막 활동 시간',

  -- 메타데이터
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uk_student (student_id),
  INDEX idx_mastery (mastery_level),
  INDEX idx_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='학생별 전체 학습 진행도';

-- ============================================
-- Table: animation_settings
-- Description: 색상 및 애니메이션 설정
-- ============================================
CREATE TABLE IF NOT EXISTS animation_settings (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  setting_name VARCHAR(100) NOT NULL UNIQUE COMMENT '설정 이름',

  -- 색상 설정
  color_scheme JSON NOT NULL COMMENT '단계별 색상 {"step1": "#FF0000", "step2": "#00FF00"}',

  -- 애니메이션 설정
  transition_duration_ms INT UNSIGNED DEFAULT 800 COMMENT '전환 애니메이션 시간 (ms)',
  highlight_duration_ms INT UNSIGNED DEFAULT 1500 COMMENT '강조 표시 시간 (ms)',
  auto_advance BOOLEAN DEFAULT FALSE COMMENT '자동 진행 여부',
  auto_advance_delay_ms INT UNSIGNED DEFAULT 3000 COMMENT '자동 진행 대기 시간 (ms)',

  -- 기본 설정 여부
  is_default BOOLEAN DEFAULT FALSE COMMENT '기본 설정 여부',

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='애니메이션 및 색상 설정';

-- ============================================
-- Sample Data: 기본 애니메이션 설정
-- ============================================
INSERT INTO animation_settings (setting_name, color_scheme, transition_duration_ms, highlight_duration_ms, is_default) VALUES
('default',
 JSON_OBJECT(
   'original', '#000000',
   'substitution_u', '#FF4444',
   'substitution_du', '#FF8844',
   'integrated', '#4444FF',
   'back_substitute', '#AA44FF',
   'final', '#44AA44'
 ),
 800,
 1500,
 TRUE);

-- ============================================
-- Sample Data: 예제 문제
-- ============================================
INSERT INTO substitution_problems
  (title, description, original_integral, substitution_variable, substitution_expression, du_expression, steps, final_answer, difficulty_level, category, learning_objectives)
VALUES
  (
    '기본 치환적분 - 제곱 함수',
    '2x·cos(x²)를 적분하는 문제입니다.',
    '\\int 2x \\cdot \\cos(x^2) \\, dx',
    'u',
    'x^2',
    '2x \\, dx',
    JSON_ARRAY(
      JSON_OBJECT('step', 1, 'description', '원본 식', 'expression', '\\int 2x \\cdot \\cos(x^2) \\, dx', 'color', '#000000'),
      JSON_OBJECT('step', 2, 'description', 'u 치환 정의', 'expression', 'u = x^2, \\quad du = 2x \\, dx', 'color', '#FF4444'),
      JSON_OBJECT('step', 3, 'description', '치환 적용', 'expression', '\\int \\cos(u) \\, du', 'color', '#4444FF'),
      JSON_OBJECT('step', 4, 'description', '적분', 'expression', '\\sin(u) + C', 'color', '#AA44FF'),
      JSON_OBJECT('step', 5, 'description', '역치환', 'expression', '\\sin(x^2) + C', 'color', '#44AA44')
    ),
    '\\sin(x^2) + C',
    'easy',
    '치환적분-기본',
    '치환적분의 기본 개념을 이해하고, 간단한 제곱 함수를 치환할 수 있다.'
  ),
  (
    '삼각함수 치환적분',
    'sin(x)·cos(x)를 적분하는 문제입니다.',
    '\\int \\sin(x) \\cdot \\cos(x) \\, dx',
    'u',
    '\\sin(x)',
    '\\cos(x) \\, dx',
    JSON_ARRAY(
      JSON_OBJECT('step', 1, 'description', '원본 식', 'expression', '\\int \\sin(x) \\cdot \\cos(x) \\, dx', 'color', '#000000'),
      JSON_OBJECT('step', 2, 'description', 'u 치환 정의', 'expression', 'u = \\sin(x), \\quad du = \\cos(x) \\, dx', 'color', '#FF4444'),
      JSON_OBJECT('step', 3, 'description', '치환 적용', 'expression', '\\int u \\, du', 'color', '#4444FF'),
      JSON_OBJECT('step', 4, 'description', '적분', 'expression', '\\frac{u^2}{2} + C', 'color', '#AA44FF'),
      JSON_OBJECT('step', 5, 'description', '역치환', 'expression', '\\frac{\\sin^2(x)}{2} + C', 'color', '#44AA44')
    ),
    '\\frac{\\sin^2(x)}{2} + C',
    'medium',
    '치환적분-삼각함수',
    '삼각함수를 포함한 치환적분을 수행할 수 있다.'
  );

-- ============================================
-- Views: 통계 조회용 뷰
-- ============================================

-- 문제별 통계
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
  p.id,
  p.title,
  p.difficulty_level,
  p.category,
  COUNT(DISTINCT a.student_id) AS total_students,
  COUNT(a.id) AS total_attempts,
  AVG(a.score) AS average_score,
  SUM(CASE WHEN a.is_correct = TRUE THEN 1 ELSE 0 END) AS correct_attempts,
  AVG(a.time_spent_seconds) AS avg_time_spent
FROM substitution_problems p
LEFT JOIN student_attempts a ON p.id = a.problem_id
WHERE p.is_active = TRUE
GROUP BY p.id;

-- 학생별 최근 활동
CREATE OR REPLACE VIEW student_recent_activity AS
SELECT
  sp.student_id,
  sp.total_problems_attempted,
  sp.total_problems_correct,
  sp.average_score,
  sp.mastery_level,
  sp.last_activity_at,
  COUNT(DISTINCT DATE(a.submitted_at)) AS active_days_last_30,
  MAX(a.submitted_at) AS last_submission
FROM student_progress sp
LEFT JOIN student_attempts a ON sp.student_id = a.student_id
  AND a.submitted_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY sp.student_id;
