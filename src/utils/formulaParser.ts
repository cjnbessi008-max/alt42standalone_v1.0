import { Formula, FormulaComponent, Question } from '../types';

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
 * 예제 공식들
 */
export const sampleFormulas: Formula[] = [
  {
    id: 'pythagorean',
    imageUrl: '',
    text: 'a² + b² = c²',
    components: parseFormula('a² + b² = c²')
  },
  {
    id: 'quadratic',
    imageUrl: '',
    text: 'x = (-b ± sqrt(b² - 4ac)) / 2a',
    components: parseFormula('x = (-b ± sqrt(b² - 4ac)) / 2a')
  },
  {
    id: 'einstein',
    imageUrl: '',
    text: 'E = mc²',
    components: parseFormula('E = mc²')
  }
];
