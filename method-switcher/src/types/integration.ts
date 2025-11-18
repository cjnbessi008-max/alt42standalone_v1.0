// 적분법 타입 정의
export type IntegrationMethod =
  | 'trapezoidal'   // 사다리꼴 법
  | 'simpson'       // 심슨 법
  | 'rectangle'     // 직사각형 법 (중점)
  | 'monte-carlo';  // 몬테카를로 법

// 문제 정보 (LMS에서 받아올 데이터 구조)
export interface ProblemData {
  id: string;
  functionExpression: string;  // 예: "x^2"
  lowerBound: number;         // 적분 하한
  upperBound: number;         // 적분 상한
  exactValue?: number;        // 정확한 값 (있는 경우)
  difficulty: 'easy' | 'medium' | 'hard';
}

// 적분 결과
export interface IntegrationResult {
  method: IntegrationMethod;
  value: number;
  error?: number;
  steps: IntegrationStep[];
  computationTime: number;
}

// 계산 단계 (애니메이션용)
export interface IntegrationStep {
  index: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  area: number;
}

// LMS 연동 설정
export interface LMSConfig {
  apiEndpoint: string;
  apiKey?: string;
  moodleVersion?: string;
  userId?: string;
}

// 메서드 정보
export interface MethodInfo {
  id: IntegrationMethod;
  name: string;
  nameKo: string;
  description: string;
  color: string;
  accuracy: 'low' | 'medium' | 'high';
}
