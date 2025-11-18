-- Stat Story Mode Seed Data
-- Initial data for testing and demo

-- 통계 개념 데이터
INSERT INTO stat_concepts (concept_code, concept_name_ko, concept_name_en, category, description, formula, difficulty, prerequisite_concepts) VALUES
('mean', '평균', 'Mean', 'descriptive', '모든 데이터 값의 합을 데이터 개수로 나눈 값', '평균 = (데이터의 합) / (데이터의 개수)', 1, NULL),
('median', '중앙값', 'Median', 'descriptive', '데이터를 크기 순으로 정렬했을 때 가운데 위치한 값', NULL, 1, NULL),
('mode', '최빈값', 'Mode', 'descriptive', '데이터에서 가장 많이 나타나는 값', NULL, 1, NULL),
('range', '범위', 'Range', 'descriptive', '최댓값과 최솟값의 차이', '범위 = 최댓값 - 최솟값', 1, NULL),
('variance', '분산', 'Variance', 'descriptive', '데이터가 평균으로부터 얼마나 흩어져 있는지 나타내는 값', '분산 = Σ(xi - 평균)² / n', 3, '["mean"]'),
('std_dev', '표준편차', 'Standard Deviation', 'descriptive', '분산의 제곱근으로, 데이터의 흩어진 정도를 나타냄', '표준편차 = √분산', 3, '["mean", "variance"]'),
('quartile', '사분위수', 'Quartile', 'descriptive', '데이터를 4등분하는 값 (Q1, Q2, Q3)', NULL, 2, '["median"]'),
('probability', '확률', 'Probability', 'probability', '어떤 사건이 일어날 가능성을 수치로 나타낸 것', 'P(A) = (사건 A가 일어나는 경우의 수) / (전체 경우의 수)', 2, NULL),
('correlation', '상관관계', 'Correlation', 'correlation', '두 변수 간의 관계 정도', '상관계수 r = -1 ~ 1', 4, '["mean", "std_dev"]');

-- 캐릭터 데이터
INSERT INTO characters (character_code, name, role, personality) VALUES
('teacher_kim', '김통계 선생님', '선생님', '친절하고 설명을 잘하는 통계 전문가'),
('student_min', '민수', '학생', '호기심 많고 질문을 잘하는 중학생'),
('student_ji', '지영', '학생', '논리적이고 분석적인 고등학생'),
('helper_stat', '스탯봇', '조력자', 'AI 통계 도우미, 재미있게 힌트를 제공');

-- 샘플 스토리 시나리오 1: 평균 개념 학습
INSERT INTO story_scenarios (title, description, stat_concept, difficulty_level, target_grade, story_content, is_active) VALUES
(
    '반 평균 키 구하기 대작전',
    '민수네 반 학생들의 평균 키를 구하는 과정을 통해 평균의 개념을 배웁니다.',
    'mean',
    'basic',
    '중1',
    '{
        "theme": "school_life",
        "setting": "중학교 체육시간",
        "goal": "반 학생들의 평균 키를 계산하고 평균의 의미를 이해하기"
    }',
    TRUE
),
(
    '게임 점수로 알아보는 중앙값',
    '지영이가 게임 점수를 분석하면서 중앙값의 개념을 배웁니다.',
    'median',
    'basic',
    '중2',
    '{
        "theme": "gaming",
        "setting": "게임 대회",
        "goal": "게임 점수의 중앙값을 구하고 평균과의 차이 이해하기"
    }',
    TRUE
),
(
    '시험 점수 분석 - 표준편차의 비밀',
    '두 반의 시험 점수를 비교하면서 분산과 표준편차를 이해합니다.',
    'std_dev',
    'advanced',
    '고1',
    '{
        "theme": "exam_analysis",
        "setting": "중간고사 이후",
        "goal": "표준편차를 통해 점수 분포를 분석하고 비교하기"
    }',
    TRUE
);

-- 스토리 1의 단계들 (평균 학습)
INSERT INTO story_steps (scenario_id, step_order, step_type, character_name, dialogue_text, explanation_content, question_data) VALUES
(
    1, 1, 'dialogue', '민수',
    '선생님, 우리 반 평균 키가 얼마나 될까요?',
    NULL, NULL
),
(
    1, 2, 'dialogue', '김통계 선생님',
    '좋은 질문이야! 평균을 구하려면 어떻게 해야 할까?',
    NULL, NULL
),
(
    1, 3, 'explanation', '김통계 선생님',
    NULL,
    '<h3>평균(Mean)이란?</h3><p>평균은 모든 데이터 값을 더한 후, 데이터 개수로 나눈 값입니다.</p><p><strong>공식:</strong> 평균 = (데이터의 합) / (데이터의 개수)</p><p>예를 들어, 키가 150cm, 160cm, 170cm인 3명의 평균 키는:<br>(150 + 160 + 170) / 3 = 480 / 3 = 160cm</p>',
    NULL
),
(
    1, 4, 'question', '김통계 선생님',
    '그럼 연습문제를 풀어볼까? 5명의 키가 다음과 같을 때 평균을 구해보세요.',
    NULL,
    '{
        "question_type": "calculation",
        "data": [152, 158, 165, 160, 155],
        "question_text": "5명 학생의 키: 152cm, 158cm, 165cm, 160cm, 155cm<br>평균 키는 몇 cm인가요?",
        "answer": 158,
        "unit": "cm",
        "tolerance": 0.5,
        "explanation": "(152 + 158 + 165 + 160 + 155) ÷ 5 = 790 ÷ 5 = 158cm"
    }'
),
(
    1, 5, 'practice', '김통계 선생님',
    '잘했어! 이제 우리 반 전체 학생 10명의 키로 평균을 구해보자.',
    NULL,
    '{
        "question_type": "calculation",
        "data": [158, 162, 155, 170, 163, 159, 168, 161, 157, 165],
        "question_text": "우리 반 10명의 키(cm): 158, 162, 155, 170, 163, 159, 168, 161, 157, 165<br>평균 키는?",
        "answer": 161.8,
        "unit": "cm",
        "tolerance": 0.5,
        "explanation": "합계: 1618cm, 평균: 1618 ÷ 10 = 161.8cm"
    }'
),
(
    1, 6, 'quiz', '김통계 선생님',
    '마지막 퀴즈! 평균의 성질에 대한 문제야.',
    NULL,
    '{
        "question_type": "multiple_choice",
        "question_text": "5명의 평균 점수가 80점입니다. 4명의 점수가 75, 78, 82, 85점일 때, 나머지 1명의 점수는?",
        "choices": ["70점", "75점", "80점", "85점"],
        "correct_answer": 2,
        "explanation": "5명의 합 = 80 × 5 = 400점<br>4명의 합 = 75 + 78 + 82 + 85 = 320점<br>나머지 = 400 - 320 = 80점"
    }'
);

-- 스토리 2의 단계들 (중앙값 학습)
INSERT INTO story_steps (scenario_id, step_order, step_type, character_name, dialogue_text, explanation_content, question_data) VALUES
(
    2, 1, 'dialogue', '지영',
    '오늘 게임 대회에서 내 점수가 중간쯤 되는 것 같은데...',
    NULL, NULL
),
(
    2, 2, 'dialogue', '김통계 선생님',
    '그럼 중앙값을 알아보면 되겠네! 중앙값은 평균과 다른 의미를 가지고 있어.',
    NULL, NULL
),
(
    2, 3, 'explanation', '김통계 선생님',
    NULL,
    '<h3>중앙값(Median)이란?</h3><p>데이터를 크기 순으로 정렬했을 때 가운데 위치한 값입니다.</p><p><strong>구하는 방법:</strong></p><ol><li>데이터를 오름차순으로 정렬</li><li>데이터 개수가 홀수면: 가운데 값</li><li>데이터 개수가 짝수면: 가운데 두 값의 평균</li></ol><p>예: 60, 70, 80, 90, 100 → 중앙값은 80</p>',
    NULL
),
(
    2, 4, 'question', '김통계 선생님',
    '7명의 게임 점수에서 중앙값을 구해보세요.',
    NULL,
    '{
        "question_type": "calculation",
        "data": [850, 920, 780, 990, 810, 870, 900],
        "question_text": "게임 점수: 850, 920, 780, 990, 810, 870, 900<br>중앙값은?",
        "answer": 870,
        "hint": "먼저 점수를 크기 순서로 정렬해보세요!",
        "explanation": "정렬: 780, 810, 850, <strong>870</strong>, 900, 920, 990<br>가운데 값 = 870점"
    }'
),
(
    2, 5, 'quiz', '김통계 선생님',
    '평균과 중앙값의 차이를 이해했는지 확인해볼까?',
    NULL,
    '{
        "question_type": "multiple_choice",
        "question_text": "데이터: 10, 20, 30, 40, 1000<br>평균과 중앙값 중 이 데이터를 더 잘 대표하는 값은?",
        "choices": ["평균 (220)", "중앙값 (30)", "둘 다 같다", "둘 다 적절하지 않다"],
        "correct_answer": 1,
        "explanation": "극단값(1000)이 있을 때는 중앙값이 데이터를 더 잘 대표합니다. 평균은 극단값의 영향을 크게 받기 때문입니다."
    }'
);

-- 스토리 3의 단계들 (표준편차 학습)
INSERT INTO story_steps (scenario_id, step_order, step_type, character_name, dialogue_text, explanation_content) VALUES
(
    3, 1, 'dialogue', '지영',
    'A반과 B반의 평균 점수가 같은데, 왜 A반이 더 잘했다고 하는 거예요?',
    NULL
),
(
    3, 2, 'dialogue', '김통계 선생님',
    '좋은 질문이야! 평균만으로는 점수의 분포를 알 수 없거든. 표준편차를 알아보자.',
    NULL
),
(
    3, 3, 'explanation', '김통계 선생님',
    NULL,
    '<h3>분산과 표준편차</h3><p><strong>분산(Variance):</strong> 각 데이터가 평균으로부터 얼마나 떨어져 있는지의 평균</p><p><strong>표준편차(Standard Deviation):</strong> 분산의 제곱근</p><p>표준편차가 작을수록 → 데이터가 평균 근처에 모여있음<br>표준편차가 클수록 → 데이터가 흩어져 있음</p><p><strong>공식:</strong><br>분산 = Σ(xi - 평균)² / n<br>표준편차 = √분산</p>'
);
