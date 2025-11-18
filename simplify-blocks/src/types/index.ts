// 블록 타입 정의
export interface LogBlock {
  id: string;
  type: 'log' | 'sum' | 'difference' | 'coefficient' | 'power';
  expression: string;
  level: number; // 단순화 단계
  children?: LogBlock[];
  color?: string;
}

// 로그 법칙 타입
export type LogRule =
  | 'product'      // log(a*b) = log(a) + log(b)
  | 'quotient'     // log(a/b) = log(a) - log(b)
  | 'power'        // log(a^n) = n*log(a)
  | 'coefficient'  // log(k*a) = log(k) + log(a)
  | 'base_change'; // log_a(b) = log(b)/log(a)

// 단순화 단계
export interface SimplificationStep {
  id: string;
  rule: LogRule;
  description: string;
  before: string;
  after: string;
  blocks: LogBlock[];
}

// 문제 타입
export interface Problem {
  id: string;
  expression: string;
  difficulty: 'easy' | 'medium' | 'hard';
  steps: SimplificationStep[];
}
