// 조건 타입: 필요조건(necessary) vs 충분조건(sufficient)
export type ConditionType = 'necessary' | 'sufficient';

// 문 상태
export type DoorState = 'closed' | 'opening' | 'open' | 'closing';

// 조건 데이터
export interface Condition {
  id: string;
  type: ConditionType;
  statement: string;
  isCorrect: boolean;
}

// 문제 데이터
export interface Problem {
  id: string;
  title: string;
  description: string;
  premise: string; // 전제 (P)
  conclusion: string; // 결론 (Q)
  necessaryCondition: Condition;
  sufficientCondition: Condition;
  explanation?: string;
}

// API 응답
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
