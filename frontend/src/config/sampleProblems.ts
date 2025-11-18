import { Problem, ConditionType } from '@/types';

/**
 * Sample fraction problems with color-coded conditions
 */
export const sampleFractionProblem: Problem = {
  id: 'fraction-001',
  title: '분수의 덧셈',
  description: '두 분수를 더하여 답을 구하세요. 답은 기약분수로 나타내야 합니다.',
  problemType: 'fraction',
  conditions: [
    {
      id: 'c1',
      type: ConditionType.VALUE,
      text: '첫 번째 분수: 3/4',
      description: '문제에서 주어진 첫 번째 분수입니다.',
    },
    {
      id: 'c2',
      type: ConditionType.VALUE,
      text: '두 번째 분수: 2/5',
      description: '문제에서 주어진 두 번째 분수입니다.',
    },
    {
      id: 'c3',
      type: ConditionType.CONSTRAINT,
      text: '분모는 0이 아니어야 함',
      description: '수학적으로 분모가 0이면 정의되지 않습니다.',
    },
    {
      id: 'c4',
      type: ConditionType.CONSTRAINT,
      text: '분자와 분모는 정수',
      description: '분수의 분자와 분모는 모두 정수여야 합니다.',
    },
    {
      id: 'c5',
      type: ConditionType.IMPORTANT,
      text: '답은 기약분수로 표현',
      description: '최종 답은 분자와 분모의 최대공약수로 약분한 기약분수여야 합니다.',
    },
    {
      id: 'c6',
      type: ConditionType.CONDITIONAL,
      text: '분모가 다르면 통분 필요',
      description: '분모가 다른 경우 공통분모로 통분한 후 더해야 합니다.',
    },
  ],
};

export const sampleGeometryProblem: Problem = {
  id: 'geometry-001',
  title: '삼각형의 넓이',
  description: '주어진 조건을 만족하는 삼각형의 넓이를 구하세요.',
  problemType: 'geometry',
  conditions: [
    {
      id: 'g1',
      type: ConditionType.VALUE,
      text: '밑변: 12 cm',
      description: '삼각형의 밑변 길이입니다.',
    },
    {
      id: 'g2',
      type: ConditionType.VALUE,
      text: '높이: 8 cm',
      description: '삼각형의 높이입니다.',
    },
    {
      id: 'g3',
      type: ConditionType.RANGE,
      text: '모든 변의 길이 > 0',
      description: '삼각형의 모든 변은 양수여야 합니다.',
    },
    {
      id: 'g4',
      type: ConditionType.CONSTRAINT,
      text: '삼각형 부등식 만족',
      description: '두 변의 길이의 합은 나머지 한 변의 길이보다 커야 합니다.',
    },
    {
      id: 'g5',
      type: ConditionType.IMPORTANT,
      text: '넓이 = (밑변 × 높이) ÷ 2',
      description: '삼각형 넓이 공식을 사용합니다.',
    },
  ],
};

export const sampleEquationProblem: Problem = {
  id: 'equation-001',
  title: '일차방정식 풀이',
  description: '주어진 일차방정식의 해를 구하세요.',
  problemType: 'equation',
  conditions: [
    {
      id: 'e1',
      type: ConditionType.VALUE,
      text: '방정식: 2x + 5 = 13',
      description: '풀어야 할 일차방정식입니다.',
    },
    {
      id: 'e2',
      type: ConditionType.CONSTRAINT,
      text: 'x는 실수',
      description: '미지수 x는 실수 범위에서 찾습니다.',
    },
    {
      id: 'e3',
      type: ConditionType.CONDITIONAL,
      text: '양변에 같은 수를 더하거나 빼도 등식 성립',
      description: '등식의 성질을 이용하여 풀이합니다.',
    },
    {
      id: 'e4',
      type: ConditionType.CONDITIONAL,
      text: '양변에 0이 아닌 같은 수를 곱하거나 나누어도 등식 성립',
      description: '등식의 성질을 이용하여 풀이합니다.',
    },
    {
      id: 'e5',
      type: ConditionType.IMPORTANT,
      text: '검산 필수',
      description: '구한 해를 원래 방정식에 대입하여 확인해야 합니다.',
    },
    {
      id: 'e6',
      type: ConditionType.RANGE,
      text: '정수 해를 구하시오',
      description: '답은 정수 형태로 표현되어야 합니다.',
    },
  ],
};

export const allSampleProblems: Problem[] = [
  sampleFractionProblem,
  sampleGeometryProblem,
  sampleEquationProblem,
];
