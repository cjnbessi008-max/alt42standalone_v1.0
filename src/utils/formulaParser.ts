import { Formula, FormulaComponent, Question, CategoryInfo } from '../types';

/**
 * 간단한 수학 공식 파서
 * 실제로는 OCR 결과나 LaTeX를 파싱해야 하지만,
 * 데모를 위해 기본적인 파싱 로직을 구현
 */
export function parseFormula(text: string): FormulaComponent[] {
  const components: FormulaComponent[] = [];

  // 간단한 정규식 기반 파싱
  const patterns = [
    { regex: /[a-zA-Z]\w*/g, type: 'variable' as const },
    { regex: /[+\-*/=]/g, type: 'operator' as const },
    { regex: /\d+\.?\d*/g, type: 'constant' as const },
    { regex: /sin|cos|tan|log|ln|sqrt/g, type: 'function' as const },
  ];

  let matches: Array<{ text: string; type: FormulaComponent['type']; index: number }> = [];

  patterns.forEach(({ regex, type }) => {
    const found = Array.from(text.matchAll(regex));
    found.forEach(match => {
      if (match.index !== undefined) {
        matches.push({
          text: match[0],
          type,
          index: match.index
        });
      }
    });
  });

  // 위치 순으로 정렬
  matches.sort((a, b) => a.index - b.index);

  // 컴포넌트 생성
  matches.forEach((match, idx) => {
    components.push({
      id: `comp-${idx}`,
      text: match.text,
      type: match.type,
      position: match.index
    });
  });

  return components;
}

/**
 * 공식에 대한 질문 생성
 */
export function generateQuestions(formula: Formula): Question[] {
  const questions: Question[] = [];
  const components = formula.components;

  // 변수에 대한 질문
  const variables = components.filter(c => c.type === 'variable');
  if (variables.length > 0) {
    questions.push({
      id: 'q-variables',
      text: `이 공식에는 어떤 변수들이 사용되나요?`,
      hint: `총 ${variables.length}개의 변수가 있습니다.`,
      focusComponent: variables[0].id
    });
  }

  // 연산자에 대한 질문
  const operators = components.filter(c => c.type === 'operator');
  if (operators.length > 0) {
    questions.push({
      id: 'q-operators',
      text: `어떤 연산이 수행되나요?`,
      hint: `${operators.map(o => o.text).join(', ')} 연산을 확인해보세요.`,
      focusComponent: operators[0].id
    });
  }

  // 상수에 대한 질문
  const constants = components.filter(c => c.type === 'constant');
  if (constants.length > 0) {
    questions.push({
      id: 'q-constants',
      text: `공식에 포함된 상수는 무엇인가요?`,
      hint: `숫자 값을 찾아보세요.`,
      focusComponent: constants[0].id
    });
  }

  // 함수에 대한 질문
  const functions = components.filter(c => c.type === 'function');
  if (functions.length > 0) {
    questions.push({
      id: 'q-functions',
      text: `어떤 수학 함수가 사용되었나요?`,
      hint: `${functions.map(f => f.text).join(', ')}`,
      focusComponent: functions[0].id
    });
  }

  // 전체 구조에 대한 질문
  questions.push({
    id: 'q-structure',
    text: `공식의 전체적인 형태를 떠올려보세요. 왼쪽에는 무엇이, 오른쪽에는 무엇이 있나요?`,
    hint: `등호(=)를 중심으로 생각해보세요.`
  });

  // 의미에 대한 질문
  questions.push({
    id: 'q-meaning',
    text: `이 공식은 무엇을 계산하거나 표현하나요?`,
    hint: `각 부분이 어떤 의미를 가지는지 생각해보세요.`
  });

  return questions;
}

/**
 * 카테고리 정보
 */
export const categories: CategoryInfo[] = [
  {
    id: 'algebra',
    name: '대수학',
    icon: '🔢',
    description: '방정식, 부등식, 다항식 등'
  },
  {
    id: 'geometry',
    name: '기하학',
    icon: '📐',
    description: '도형, 넓이, 부피 등'
  },
  {
    id: 'trigonometry',
    name: '삼각함수',
    icon: '📊',
    description: '사인, 코사인, 탄젠트 등'
  },
  {
    id: 'calculus',
    name: '미적분',
    icon: '∫',
    description: '미분, 적분, 극한 등'
  },
  {
    id: 'physics',
    name: '물리학',
    icon: '⚡',
    description: '운동, 에너지, 전자기학 등'
  },
  {
    id: 'statistics',
    name: '통계',
    icon: '📈',
    description: '평균, 분산, 확률 등'
  }
];

/**
 * 예제 공식들
 */
export const sampleFormulas: Formula[] = [
  // 대수학 (Algebra)
  {
    id: 'quadratic',
    name: '이차방정식 근의 공식',
    description: '이차방정식 ax² + bx + c = 0의 해',
    text: 'x = (-b ± sqrt(b² - 4ac)) / 2a',
    imageUrl: '',
    category: 'algebra',
    difficulty: 'intermediate',
    components: parseFormula('x = (-b ± sqrt(b² - 4ac)) / 2a')
  },
  {
    id: 'slope',
    name: '직선의 기울기',
    description: '두 점을 지나는 직선의 기울기',
    text: 'm = (y2 - y1) / (x2 - x1)',
    imageUrl: '',
    category: 'algebra',
    difficulty: 'beginner',
    components: parseFormula('m = (y2 - y1) / (x2 - x1)')
  },
  {
    id: 'binomial',
    name: '이항정리',
    description: '(a + b)의 거듭제곱 전개',
    text: '(a + b)² = a² + 2ab + b²',
    imageUrl: '',
    category: 'algebra',
    difficulty: 'beginner',
    components: parseFormula('(a + b)² = a² + 2ab + b²')
  },
  {
    id: 'difference-squares',
    name: '제곱의 차',
    description: '두 수의 제곱의 차 인수분해',
    text: 'a² - b² = (a + b)(a - b)',
    imageUrl: '',
    category: 'algebra',
    difficulty: 'beginner',
    components: parseFormula('a² - b² = (a + b)(a - b)')
  },

  // 기하학 (Geometry)
  {
    id: 'pythagorean',
    name: '피타고라스 정리',
    description: '직각삼각형의 세 변의 관계',
    text: 'a² + b² = c²',
    imageUrl: '',
    category: 'geometry',
    difficulty: 'beginner',
    components: parseFormula('a² + b² = c²')
  },
  {
    id: 'circle-area',
    name: '원의 넓이',
    description: '반지름 r인 원의 넓이',
    text: 'A = πr²',
    imageUrl: '',
    category: 'geometry',
    difficulty: 'beginner',
    components: parseFormula('A = πr²')
  },
  {
    id: 'circle-circumference',
    name: '원의 둘레',
    description: '반지름 r인 원의 둘레',
    text: 'C = 2πr',
    imageUrl: '',
    category: 'geometry',
    difficulty: 'beginner',
    components: parseFormula('C = 2πr')
  },
  {
    id: 'sphere-volume',
    name: '구의 부피',
    description: '반지름 r인 구의 부피',
    text: 'V = (4/3)πr³',
    imageUrl: '',
    category: 'geometry',
    difficulty: 'intermediate',
    components: parseFormula('V = (4/3)πr³')
  },
  {
    id: 'triangle-area',
    name: '삼각형의 넓이',
    description: '밑변 b, 높이 h인 삼각형의 넓이',
    text: 'A = (1/2)bh',
    imageUrl: '',
    category: 'geometry',
    difficulty: 'beginner',
    components: parseFormula('A = (1/2)bh')
  },

  // 삼각함수 (Trigonometry)
  {
    id: 'sin-cos-identity',
    name: '삼각함수 항등식',
    description: '사인과 코사인의 기본 관계',
    text: 'sin²θ + cos²θ = 1',
    imageUrl: '',
    category: 'trigonometry',
    difficulty: 'intermediate',
    components: parseFormula('sin²θ + cos²θ = 1')
  },
  {
    id: 'tan-identity',
    name: '탄젠트 정의',
    description: '탄젠트와 사인, 코사인의 관계',
    text: 'tanθ = sinθ / cosθ',
    imageUrl: '',
    category: 'trigonometry',
    difficulty: 'beginner',
    components: parseFormula('tanθ = sinθ / cosθ')
  },
  {
    id: 'law-of-cosines',
    name: '코사인 법칙',
    description: '삼각형의 변과 각의 관계',
    text: 'c² = a² + b² - 2ab*cosC',
    imageUrl: '',
    category: 'trigonometry',
    difficulty: 'advanced',
    components: parseFormula('c² = a² + b² - 2ab*cosC')
  },

  // 미적분 (Calculus)
  {
    id: 'power-rule',
    name: '거듭제곱 미분',
    description: 'x의 거듭제곱 미분 공식',
    text: 'd/dx(xⁿ) = nxⁿ⁻¹',
    imageUrl: '',
    category: 'calculus',
    difficulty: 'intermediate',
    components: parseFormula('d/dx(xⁿ) = nxⁿ⁻¹')
  },
  {
    id: 'integration-power',
    name: '거듭제곱 적분',
    description: 'x의 거듭제곱 적분 공식',
    text: '∫xⁿdx = xⁿ⁺¹/(n+1) + C',
    imageUrl: '',
    category: 'calculus',
    difficulty: 'intermediate',
    components: parseFormula('∫xⁿdx = xⁿ⁺¹/(n+1) + C')
  },

  // 물리학 (Physics)
  {
    id: 'einstein',
    name: '질량-에너지 등가원리',
    description: '아인슈타인의 유명한 공식',
    text: 'E = mc²',
    imageUrl: '',
    category: 'physics',
    difficulty: 'beginner',
    components: parseFormula('E = mc²')
  },
  {
    id: 'newton-second',
    name: '뉴턴의 제2법칙',
    description: '힘, 질량, 가속도의 관계',
    text: 'F = ma',
    imageUrl: '',
    category: 'physics',
    difficulty: 'beginner',
    components: parseFormula('F = ma')
  },
  {
    id: 'kinetic-energy',
    name: '운동 에너지',
    description: '질량 m인 물체의 운동 에너지',
    text: 'KE = (1/2)mv²',
    imageUrl: '',
    category: 'physics',
    difficulty: 'intermediate',
    components: parseFormula('KE = (1/2)mv²')
  },
  {
    id: 'gravity',
    name: '만유인력의 법칙',
    description: '두 물체 사이의 중력',
    text: 'F = G(m1*m2)/r²',
    imageUrl: '',
    category: 'physics',
    difficulty: 'advanced',
    components: parseFormula('F = G(m1*m2)/r²')
  },

  // 통계 (Statistics)
  {
    id: 'mean',
    name: '산술 평균',
    description: 'n개 데이터의 평균',
    text: 'μ = (Σx) / n',
    imageUrl: '',
    category: 'statistics',
    difficulty: 'beginner',
    components: parseFormula('μ = (Σx) / n')
  },
  {
    id: 'variance',
    name: '분산',
    description: '데이터의 퍼진 정도',
    text: 'σ² = Σ(x - μ)² / n',
    imageUrl: '',
    category: 'statistics',
    difficulty: 'intermediate',
    components: parseFormula('σ² = Σ(x - μ)² / n')
  },
  {
    id: 'standard-deviation',
    name: '표준편차',
    description: '분산의 제곱근',
    text: 'σ = sqrt(σ²)',
    imageUrl: '',
    category: 'statistics',
    difficulty: 'beginner',
    components: parseFormula('σ = sqrt(σ²)')
  }
];
