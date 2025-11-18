import { MethodInfo } from '../types/integration';

export const INTEGRATION_METHODS: MethodInfo[] = [
  {
    id: 'trapezoidal',
    name: 'Trapezoidal Rule',
    nameKo: '사다리꼴 법',
    description: '구간을 사다리꼴로 근사하여 적분을 계산합니다.',
    color: '#3b82f6',
    accuracy: 'medium'
  },
  {
    id: 'simpson',
    name: "Simpson's Rule",
    nameKo: '심슨 법',
    description: '2차 함수(포물선)로 근사하여 더 정확한 적분을 계산합니다.',
    color: '#10b981',
    accuracy: 'high'
  },
  {
    id: 'rectangle',
    name: 'Midpoint Rectangle',
    nameKo: '직사각형 법 (중점)',
    description: '구간 중점의 높이로 직사각형을 만들어 적분을 계산합니다.',
    color: '#f59e0b',
    accuracy: 'low'
  },
  {
    id: 'monte-carlo',
    name: 'Monte Carlo',
    nameKo: '몬테카를로 법',
    description: '무작위 샘플링을 통해 적분을 추정합니다.',
    color: '#ef4444',
    accuracy: 'medium'
  }
];

export const getMethodInfo = (methodId: string): MethodInfo | undefined => {
  return INTEGRATION_METHODS.find(m => m.id === methodId);
};
