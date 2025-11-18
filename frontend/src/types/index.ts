// 함수 타입 정의
export type FunctionType = 'linear' | 'quadratic' | 'constant' | 'inverse' | 'custom';

export interface MathFunction {
  id: string;
  name: string;
  displayName: string;
  expression: string; // LaTeX 형식
  type: FunctionType;
  calculate: (x: number) => number;
  color: string;
}

// 합성함수 블록
export interface CompositionBlock {
  id: string;
  functionId: string;
  position: number; // 조립 순서
}

// 문제 정의
export interface Problem {
  id: number;
  title: string;
  description: string;
  availableFunctions: string[]; // function IDs
  targetComposition: string; // 목표 합성함수 (예: "f(g(x))")
  testCases: TestCase[];
  maxAttempts: number;
  timeLimit?: number; // 초 단위
}

export interface TestCase {
  input: number;
  expectedOutput: number;
}

// 학생 시도 기록
export interface Attempt {
  id?: number;
  problemId: number;
  studentId: string;
  composition: CompositionBlock[];
  result: {
    success: boolean;
    passedTests: number;
    totalTests: number;
    score: number;
  };
  timestamp: Date;
}

// LTI 세션 정보
export interface LTISession {
  userId: string;
  userName: string;
  courseId: string;
  resourceLinkId: string;
  lisOutcomeServiceUrl?: string;
  lisResultSourcedId?: string;
}

// 앱 상태
export interface AppState {
  // 문제
  currentProblem: Problem | null;

  // 사용 가능한 함수들
  availableFunctions: MathFunction[];

  // 현재 조립된 함수들
  composedFunctions: CompositionBlock[];

  // 테스트 입력값
  testInput: number;

  // 계산 결과
  calculationResult: number | null;

  // 제출 결과
  submissionResult: Attempt['result'] | null;

  // LTI 세션
  ltiSession: LTISession | null;

  // UI 상태
  isLoading: boolean;
  error: string | null;
}
