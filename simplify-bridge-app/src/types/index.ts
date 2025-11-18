/**
 * Simplify Bridge - Type Definitions
 * 부등식을 단계적으로 단순화하는 시스템의 타입 정의
 */

// 부등식 단계 타입
export interface SimplificationStep {
  id: number;
  expression: string;        // 현재 단계의 부등식 표현
  latex: string;             // LaTeX 형식
  explanation: string;       // 이 단계에서 수행된 작업 설명
  operation: string;         // 수행된 연산 (예: "양변에 -5 더하기")
  isSimplified: boolean;     // 완전히 단순화되었는지 여부
}

// 부등식 문제 타입
export interface InequalityProblem {
  id: string;
  originalExpression: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps: SimplificationStep[];
  finalAnswer: string;
  createdAt: Date;
}

// Moodle 연동용 문제 데이터 타입
export interface MoodleProblemData {
  problemId: string;
  courseId: string;
  studentId: string;
  inequality: string;
  timeLimit?: number;
  hints?: string[];
}

// 단순화 진행 상태
export interface SimplificationProgress {
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  startTime: Date;
  endTime?: Date;
}
