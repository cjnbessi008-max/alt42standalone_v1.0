-- Seed data for development and testing

-- Insert demo teacher
INSERT INTO users (id, email, name, role, institution) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'teacher@kaist.ac.kr', 'Demo Teacher', 'teacher', 'KAIST');

-- Insert demo student
INSERT INTO users (id, email, name, role, institution) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'student@kaist.ac.kr', 'Demo Student', 'student', 'KAIST');

-- Insert demo module
INSERT INTO modules (id, name, description, subject, grade_level, teacher_id, status) VALUES
('demo-module-1', 'Geometry Basics: Ratios', 'Learn about geometric ratios through interactive manipulation', 'mathematics', 'Grade 7-8', '550e8400-e29b-41d4-a716-446655440001', 'active');

-- Insert demo problems
INSERT INTO length_assist_problems (id, module_id, title, description, geometry_data, target_ratio, tolerance, hints, difficulty, unit) VALUES
(
    'problem-001',
    'demo-module-1',
    '두 선분의 비율',
    '파란색과 보라색 선분의 양 끝점을 드래그하여 길이를 조절하고, 두 선분의 비율을 계산해보세요.',
    '{
        "lines": [
            {
                "id": "line-1",
                "start": {"x": 50, "y": 150},
                "end": {"x": 200, "y": 150},
                "length": 150,
                "color": "#1976d2",
                "label": "선분 A",
                "isDraggable": true
            },
            {
                "id": "line-2",
                "start": {"x": 50, "y": 250},
                "end": {"x": 150, "y": 250},
                "length": 100,
                "color": "#9c27b0",
                "label": "선분 B",
                "isDraggable": true
            }
        ],
        "shapes": []
    }',
    1.5,
    0.05,
    '["선분의 양 끝점을 드래그하여 길이를 조절할 수 있습니다", "비율은 선분 A의 길이를 선분 B의 길이로 나눈 값입니다", "목표 비율은 3:2 입니다"]',
    1,
    'px'
),
(
    'problem-002',
    'demo-module-1',
    '황금비 만들기',
    '두 선분을 조작하여 황금비(약 1.618:1)를 만들어보세요.',
    '{
        "lines": [
            {
                "id": "line-1",
                "start": {"x": 50, "y": 150},
                "end": {"x": 212, "y": 150},
                "length": 162,
                "color": "#ff9800",
                "label": "긴 선분",
                "isDraggable": true
            },
            {
                "id": "line-2",
                "start": {"x": 50, "y": 250},
                "end": {"x": 150, "y": 250},
                "length": 100,
                "color": "#4caf50",
                "label": "짧은 선분",
                "isDraggable": true
            }
        ],
        "shapes": []
    }',
    1.618,
    0.08,
    '["황금비는 약 1.618:1 입니다", "긴 선분이 짧은 선분보다 약 1.6배 길어야 합니다", "정확한 비율에 가까울수록 좋습니다"]',
    2,
    'px'
),
(
    'problem-003',
    'demo-module-1',
    '같은 길이 만들기',
    '두 선분을 같은 길이로 만들어보세요 (비율 1:1).',
    '{
        "lines": [
            {
                "id": "line-1",
                "start": {"x": 50, "y": 150},
                "end": {"x": 180, "y": 150},
                "length": 130,
                "color": "#e91e63",
                "label": "선분 1",
                "isDraggable": true
            },
            {
                "id": "line-2",
                "start": {"x": 50, "y": 250},
                "end": {"x": 150, "y": 250},
                "length": 100,
                "color": "#00bcd4",
                "label": "선분 2",
                "isDraggable": true
            }
        ],
        "shapes": []
    }',
    1.0,
    0.05,
    '["두 선분이 정확히 같은 길이일 때 비율은 1:1입니다", "선분의 끝점을 드래그하여 조절하세요"]',
    1,
    'px'
);

-- Insert student progress
INSERT INTO student_progress (student_id, module_id, problems_completed, total_problems, accuracy_rate, average_time_per_problem) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'demo-module-1', 0, 3, 0.0, 0);
