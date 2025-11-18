import { LogProperty } from '../types';

/**
 * 로그 성질 데이터베이스
 * 카드 뒤집기 방식으로 표시할 로그 법칙들
 */
export const logProperties: LogProperty[] = [
  {
    id: 'log-product',
    title: '곱셈의 로그',
    formula: 'log(a × b) = log(a) + log(b)',
    explanation: '두 수의 곱에 대한 로그는 각각의 로그의 합과 같습니다.',
    example: 'log(2 × 8) = log(2) + log(8) = 1 + 3 = 4',
    category: 'basic'
  },
  {
    id: 'log-quotient',
    title: '나눗셈의 로그',
    formula: 'log(a ÷ b) = log(a) - log(b)',
    explanation: '두 수의 나눗셈에 대한 로그는 각각의 로그의 차와 같습니다.',
    example: 'log(100 ÷ 10) = log(100) - log(10) = 2 - 1 = 1',
    category: 'basic'
  },
  {
    id: 'log-power',
    title: '거듭제곱의 로그',
    formula: 'log(a^n) = n × log(a)',
    explanation: '거듭제곱에 대한 로그는 지수를 로그 앞으로 내릴 수 있습니다.',
    example: 'log(2^5) = 5 × log(2) = 5 × 1 = 5',
    category: 'basic'
  },
  {
    id: 'log-one',
    title: '1의 로그',
    formula: 'log(1) = 0',
    explanation: '밑이 무엇이든 1의 로그는 항상 0입니다.',
    example: 'log₁₀(1) = 0, log₂(1) = 0',
    category: 'basic'
  },
  {
    id: 'log-base',
    title: '밑의 로그',
    formula: 'log_a(a) = 1',
    explanation: '어떤 수를 그 자신을 밑으로 하는 로그는 항상 1입니다.',
    example: 'log₁₀(10) = 1, log₂(2) = 1',
    category: 'basic'
  },
  {
    id: 'log-change-base',
    title: '밑 변환 공식',
    formula: 'log_a(b) = log_c(b) ÷ log_c(a)',
    explanation: '로그의 밑을 다른 밑으로 변환할 수 있는 공식입니다.',
    example: 'log₂(8) = log₁₀(8) ÷ log₁₀(2) = 0.903 ÷ 0.301 = 3',
    category: 'change-of-base'
  },
  {
    id: 'log-exponential',
    title: '지수와 로그의 관계',
    formula: 'a^(log_a(x)) = x',
    explanation: '로그와 지수는 서로 역연산 관계입니다.',
    example: '10^(log₁₀(100)) = 100',
    category: 'exponential'
  },
  {
    id: 'log-root',
    title: '제곱근의 로그',
    formula: 'log(√a) = (1/2) × log(a)',
    explanation: '제곱근은 1/2 거듭제곱이므로 로그 법칙을 적용할 수 있습니다.',
    example: 'log(√100) = (1/2) × log(100) = (1/2) × 2 = 1',
    category: 'advanced'
  }
];

/**
 * 카테고리별로 로그 성질 가져오기
 */
export const getPropertiesByCategory = (category: LogProperty['category']): LogProperty[] => {
  return logProperties.filter(prop => prop.category === category);
};

/**
 * 랜덤 로그 성질 가져오기
 */
export const getRandomProperties = (count: number = 5): LogProperty[] => {
  const shuffled = [...logProperties].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};
