-- Demo data for development and testing

-- Insert demo problems
INSERT INTO problems (id, title, description, source_triangle, target_triangle, required_scale_factor, tolerance, difficulty) VALUES
(
    'demo-problem-1',
    '삼각형 닮음 기초',
    '파란색 삼각형을 확대하여 보라색 삼각형과 완전히 겹치도록 만드세요.',
    '{"id":"source-1","vertices":[{"x":200,"y":200},{"x":300,"y":200},{"x":250,"y":300}],"color":"#3b82f6","isTarget":false,"scaleFactor":1}',
    '{"id":"target-1","vertices":[{"x":400,"y":200},{"x":600,"y":200},{"x":500,"y":400}],"color":"#8b5cf6","isTarget":true,"scaleFactor":2}',
    2.0,
    0.05,
    'easy'
),
(
    'demo-problem-2',
    '삼각형 닮음 중급',
    '삼각형을 1.5배 확대하여 목표 삼각형과 겹치도록 만드세요.',
    '{"id":"source-2","vertices":[{"x":150,"y":150},{"x":250,"y":150},{"x":200,"y":250}],"color":"#3b82f6","isTarget":false,"scaleFactor":1}',
    '{"id":"target-2","vertices":[{"x":375,"y":300},{"x":525,"y":300},{"x":450,"y":450}],"color":"#8b5cf6","isTarget":true,"scaleFactor":1.5}',
    1.5,
    0.05,
    'medium'
),
(
    'demo-problem-3',
    '삼각형 닮음 고급',
    '삼각형을 축소(0.6배)하여 목표 삼각형과 겹치도록 만드세요.',
    '{"id":"source-3","vertices":[{"x":100,"y":100},{"x":300,"y":100},{"x":200,"y":350}],"color":"#3b82f6","isTarget":false,"scaleFactor":1}',
    '{"id":"target-3","vertices":[{"x":450,"y":250},{"x":570,"y":250},{"x":510,"y":400}],"color":"#8b5cf6","isTarget":true,"scaleFactor":0.6}',
    0.6,
    0.05,
    'hard'
);

-- Note: Student attempts and progress data will be generated during actual usage
