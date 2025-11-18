-- Seed data for Dynamic Tree
USE dynamic_tree;

-- Sample problem: Coin flip probability tree
INSERT INTO problems (moodle_quiz_id, moodle_question_id, title, description, tree_config, problem_type, difficulty_level)
VALUES (
    1,
    101,
    '동전 던지기 확률 트리',
    '동전을 3번 던질 때 나올 수 있는 모든 경우의 수를 트리로 표현하고, 각 경로의 확률을 계산하세요.',
    '{
        "type": "probability_tree",
        "levels": 3,
        "rootLabel": "시작",
        "branchLabels": ["앞면(H)", "뒷면(T)"],
        "branchProbabilities": [0.5, 0.5],
        "calculateOutcomes": true,
        "showProbabilities": true,
        "animation": {
            "enabled": true,
            "speed": 500,
            "expandOnClick": true
        }
    }',
    'probability_tree',
    1
);

-- Sample problem: Combination tree
INSERT INTO problems (moodle_quiz_id, moodle_question_id, title, description, tree_config, problem_type, difficulty_level)
VALUES (
    1,
    102,
    '주사위와 동전 조합',
    '주사위 1개와 동전 1개를 동시에 던질 때의 모든 경우의 수를 트리로 표현하세요.',
    '{
        "type": "combination_tree",
        "levels": 2,
        "rootLabel": "시작",
        "branches": [
            {
                "level": 1,
                "label": "주사위",
                "options": ["1", "2", "3", "4", "5", "6"]
            },
            {
                "level": 2,
                "label": "동전",
                "options": ["앞면", "뒷면"]
            }
        ],
        "calculateTotal": true,
        "animation": {
            "enabled": true,
            "speed": 400
        }
    }',
    'combination_tree',
    2
);

-- Sample problem: Decision tree for factorization
INSERT INTO problems (moodle_quiz_id, moodle_question_id, title, description, tree_config, problem_type, difficulty_level)
VALUES (
    2,
    201,
    '소인수분해 트리',
    '72를 소인수분해하는 과정을 트리로 표현하세요.',
    '{
        "type": "factorization_tree",
        "rootValue": 72,
        "targetPrimes": true,
        "showSteps": true,
        "allowInteraction": true,
        "correctFactors": [2, 2, 2, 3, 3],
        "animation": {
            "enabled": true,
            "speed": 600,
            "highlightPath": true
        }
    }',
    'factorization_tree',
    3
);

-- Sample tree nodes for coin flip problem (problem_id = 1)
-- Root node
INSERT INTO tree_nodes (problem_id, node_key, label, parent_key, probability, level, position_x, position_y)
VALUES (1, 'root', '시작', NULL, 1.0, 0, 400, 50);

-- Level 1 nodes
INSERT INTO tree_nodes (problem_id, node_key, label, parent_key, probability, level, position_x, position_y)
VALUES
    (1, 'h1', '앞면', 'root', 0.5, 1, 300, 150),
    (1, 't1', '뒷면', 'root', 0.5, 1, 500, 150);

-- Level 2 nodes
INSERT INTO tree_nodes (problem_id, node_key, label, parent_key, probability, level, position_x, position_y)
VALUES
    (1, 'h1_h2', '앞면', 'h1', 0.25, 2, 250, 250),
    (1, 'h1_t2', '뒷면', 'h1', 0.25, 2, 350, 250),
    (1, 't1_h2', '앞면', 't1', 0.25, 2, 450, 250),
    (1, 't1_t2', '뒷면', 't1', 0.25, 2, 550, 250);

-- Level 3 nodes (final outcomes)
INSERT INTO tree_nodes (problem_id, node_key, label, parent_key, probability, level, position_x, position_y, metadata)
VALUES
    (1, 'hhh', '앞면', 'h1_h2', 0.125, 3, 200, 350, '{"outcome": "HHH", "probability": 0.125}'),
    (1, 'hht', '뒷면', 'h1_h2', 0.125, 3, 250, 350, '{"outcome": "HHT", "probability": 0.125}'),
    (1, 'hth', '앞면', 'h1_t2', 0.125, 3, 300, 350, '{"outcome": "HTH", "probability": 0.125}'),
    (1, 'htt', '뒷면', 'h1_t2', 0.125, 3, 350, 350, '{"outcome": "HTT", "probability": 0.125}'),
    (1, 'thh', '앞면', 't1_h2', 0.125, 3, 450, 350, '{"outcome": "THH", "probability": 0.125}'),
    (1, 'tht', '뒷면', 't1_h2', 0.125, 3, 500, 350, '{"outcome": "THT", "probability": 0.125}'),
    (1, 'tth', '앞면', 't1_t2', 0.125, 3, 550, 350, '{"outcome": "TTH", "probability": 0.125}'),
    (1, 'ttt', '뒷면', 't1_t2', 0.125, 3, 600, 350, '{"outcome": "TTT", "probability": 0.125}');
