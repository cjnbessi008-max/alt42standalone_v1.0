-- 초기 문제 데이터 삽입

-- 문제 1: 기본 개념
INSERT INTO problems (id, title, description, premise, conclusion,
                     necessary_statement, necessary_is_correct,
                     sufficient_statement, sufficient_is_correct, explanation)
VALUES (
    'prob_001',
    '비와 구름의 관계',
    '비와 구름의 논리적 관계를 파악하는 문제입니다.',
    '비가 온다',
    '하늘에 구름이 있다',
    'Q → P (비가 오면 구름이 있다)',
    true,
    'P → Q (구름이 있으면 비가 온다)',
    false,
    '비가 오려면 반드시 구름이 있어야 하므로, "구름이 있다"는 "비가 온다"의 필요조건입니다. 하지만 구름이 있다고 해서 항상 비가 오는 것은 아니므로 충분조건은 아닙니다.'
);

-- 문제 2: 수학 개념
INSERT INTO problems (id, title, description, premise, conclusion,
                     necessary_statement, necessary_is_correct,
                     sufficient_statement, sufficient_is_correct, explanation)
VALUES (
    'prob_002',
    '짝수와 2의 배수',
    '짝수와 2의 배수의 논리적 관계를 이해하는 문제입니다.',
    'n은 짝수이다',
    'n은 2의 배수이다',
    'Q → P (2의 배수이면 짝수이다)',
    false,
    'P → Q (짝수이면 2의 배수이다)',
    true,
    '짝수는 정의상 2의 배수이므로, "짝수"는 "2의 배수"의 충분조건입니다. 실제로 짝수와 2의 배수는 같은 개념이므로 필요충분조건입니다.'
);

-- 문제 3: 도형 개념
INSERT INTO problems (id, title, description, premise, conclusion,
                     necessary_statement, necessary_is_correct,
                     sufficient_statement, sufficient_is_correct, explanation)
VALUES (
    'prob_003',
    '정사각형과 직사각형',
    '정사각형과 직사각형의 포함 관계를 파악하는 문제입니다.',
    '도형이 정사각형이다',
    '도형이 직사각형이다',
    'Q → P (직사각형이면 정사각형이다)',
    false,
    'P → Q (정사각형이면 직사각형이다)',
    true,
    '모든 정사각형은 직사각형이므로, "정사각형"은 "직사각형"의 충분조건입니다. 하지만 모든 직사각형이 정사각형인 것은 아닙니다.'
);

-- 문제 4: 일상생활
INSERT INTO problems (id, title, description, premise, conclusion,
                     necessary_statement, necessary_is_correct,
                     sufficient_statement, sufficient_is_correct, explanation)
VALUES (
    'prob_004',
    '시험 합격 조건',
    '시험 합격의 조건을 논리적으로 이해하는 문제입니다.',
    '80점 이상을 받았다',
    '시험에 합격했다',
    'Q → P (합격하면 80점 이상)',
    true,
    'P → Q (80점 이상이면 합격)',
    true,
    '80점 이상이 합격 기준이라면, 이것은 필요충분조건입니다. 합격하려면 반드시 80점 이상이어야 하고(필요조건), 80점 이상이면 합격합니다(충분조건).'
);

-- 문제 5: 논리 관계
INSERT INTO problems (id, title, description, premise, conclusion,
                     necessary_statement, necessary_is_correct,
                     sufficient_statement, sufficient_is_correct, explanation)
VALUES (
    'prob_005',
    '운동과 건강',
    '운동과 건강의 관계를 논리적으로 분석하는 문제입니다.',
    '매일 운동한다',
    '건강하다',
    'Q → P (건강하면 매일 운동한다)',
    false,
    'P → Q (매일 운동하면 건강하다)',
    false,
    '매일 운동한다고 해서 반드시 건강한 것은 아니며(충분조건 X), 건강하다고 해서 매일 운동하는 것도 아닙니다(필요조건 X). 따라서 이 경우 둘 다 정답이 아닙니다.'
);

-- 문제 6: 수 체계
INSERT INTO problems (id, title, description, premise, conclusion,
                     necessary_statement, necessary_is_correct,
                     sufficient_statement, sufficient_is_correct, explanation)
VALUES (
    'prob_006',
    '자연수와 정수',
    '자연수와 정수의 집합 관계를 이해하는 문제입니다.',
    'n은 자연수이다',
    'n은 정수이다',
    'Q → P (정수이면 자연수이다)',
    false,
    'P → Q (자연수이면 정수이다)',
    true,
    '모든 자연수는 정수이므로, "자연수"는 "정수"의 충분조건입니다. 하지만 음의 정수나 0은 자연수가 아니므로, "정수"는 "자연수"의 필요조건이 아닙니다.'
);

-- 문제 7: 기하학
INSERT INTO problems (id, title, description, premise, conclusion,
                     necessary_statement, necessary_is_correct,
                     sufficient_statement, sufficient_is_correct, explanation)
VALUES (
    'prob_007',
    '이등변삼각형과 정삼각형',
    '삼각형의 분류 관계를 파악하는 문제입니다.',
    '삼각형이 정삼각형이다',
    '삼각형이 이등변삼각형이다',
    'Q → P (이등변삼각형이면 정삼각형)',
    false,
    'P → Q (정삼각형이면 이등변삼각형)',
    true,
    '정삼각형은 세 변이 모두 같으므로, 당연히 두 변이 같은 이등변삼각형입니다. 따라서 "정삼각형"은 "이등변삼각형"의 충분조건입니다.'
);

-- 문제 8: 논리와 집합
INSERT INTO problems (id, title, description, premise, conclusion,
                     necessary_statement, necessary_is_correct,
                     sufficient_statement, sufficient_is_correct, explanation)
VALUES (
    'prob_008',
    '소수와 홀수',
    '소수와 홀수의 관계를 논리적으로 분석하는 문제입니다.',
    'n은 소수이다 (n > 2)',
    'n은 홀수이다',
    'Q → P (홀수이면 소수이다)',
    false,
    'P → Q (소수이면 홀수이다)',
    true,
    '2보다 큰 소수는 모두 홀수입니다. (2는 유일한 짝수 소수) 따라서 "2보다 큰 소수"는 "홀수"의 충분조건입니다. 하지만 9, 15와 같은 홀수는 소수가 아닙니다.'
);
