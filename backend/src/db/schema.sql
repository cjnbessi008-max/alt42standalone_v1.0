-- 3초 도형 요약 데이터베이스 스키마

-- 데이터베이스 생성 (필요시)
-- CREATE DATABASE shape_summary;

-- 문제 테이블
CREATE TABLE IF NOT EXISTS problems (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    shape_type VARCHAR(50) NOT NULL CHECK (shape_type IN ('circle', 'triangle', 'rectangle', 'polygon')),
    summary TEXT NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),

    -- 도형별 속성 (JSONB로 유연하게 저장)
    properties JSONB NOT NULL,

    -- 메타데이터
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_problems_shape_type ON problems(shape_type);
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);
CREATE INDEX IF NOT EXISTS idx_problems_is_active ON problems(is_active);

-- 샘플 데이터 삽입
INSERT INTO problems (title, description, shape_type, summary, difficulty, properties) VALUES
(
    '원의 넓이 구하기',
    '반지름이 5cm인 원의 넓이를 구하는 문제입니다.',
    'circle',
    '반지름 5cm 원의 넓이는?',
    'easy',
    '{"radius": 5, "unit": "cm", "formula": "πr²", "answer": 78.54}'
),
(
    '큰 원의 넓이',
    '반지름이 10cm인 원의 넓이를 구하세요.',
    'circle',
    '반지름 10cm 원의 넓이',
    'medium',
    '{"radius": 10, "unit": "cm", "formula": "πr²", "answer": 314.16}'
),
(
    '삼각형의 넓이',
    '밑변이 8cm이고 높이가 6cm인 삼각형의 넓이를 구하세요.',
    'triangle',
    '밑변 8cm, 높이 6cm 삼각형',
    'medium',
    '{"base": 8, "height": 6, "unit": "cm", "formula": "(밑변 × 높이) ÷ 2", "answer": 24}'
),
(
    '직각삼각형',
    '밑변 6cm, 높이 8cm인 직각삼각형의 넓이는?',
    'triangle',
    '직각삼각형 넓이 구하기',
    'easy',
    '{"base": 6, "height": 8, "unit": "cm", "formula": "(밑변 × 높이) ÷ 2", "answer": 24}'
),
(
    '직사각형 둘레',
    '가로 10cm, 세로 6cm인 직사각형의 둘레를 구하세요.',
    'rectangle',
    '가로 10cm, 세로 6cm 직사각형',
    'easy',
    '{"width": 10, "height": 6, "unit": "cm", "formula": "2(가로 + 세로)", "answer": 32}'
),
(
    '직사각형 넓이',
    '가로 12cm, 세로 8cm인 직사각형의 넓이를 구하세요.',
    'rectangle',
    '직사각형 넓이 계산',
    'easy',
    '{"width": 12, "height": 8, "unit": "cm", "formula": "가로 × 세로", "answer": 96}'
),
(
    '정사각형의 넓이',
    '한 변이 7cm인 정사각형의 넓이를 구하세요.',
    'rectangle',
    '정사각형 넓이 구하기',
    'easy',
    '{"width": 7, "height": 7, "unit": "cm", "formula": "한 변 × 한 변", "answer": 49}'
),
(
    '복합 도형',
    '반지름이 4cm인 원과 가로 8cm, 세로 6cm인 직사각형이 결합된 도형의 넓이는?',
    'polygon',
    '원 + 직사각형 복합 도형',
    'hard',
    '{"shapes": [{"type": "circle", "radius": 4}, {"type": "rectangle", "width": 8, "height": 6}], "unit": "cm", "answer": 98.27}'
);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_problems_updated_at BEFORE UPDATE ON problems
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 통계 뷰
CREATE OR REPLACE VIEW problem_statistics AS
SELECT
    shape_type,
    difficulty,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count
FROM problems
GROUP BY shape_type, difficulty
ORDER BY shape_type, difficulty;
