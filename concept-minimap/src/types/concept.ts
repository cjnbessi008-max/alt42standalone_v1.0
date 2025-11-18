/**
 * Concept Tree Data Types
 * 개념 트리를 표현하기 위한 타입 정의
 */

export interface Concept {
  id: string;
  name: string;
  description: string;
  level: number; // 개념의 깊이 (0: 최상위)
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[]; // 선수 개념 ID 배열
  children: string[]; // 하위 개념 ID 배열
  learningProgress?: number; // 0-100, 학습 진도 (선택적)
  isLocked?: boolean; // 선수 학습 미완료 시 잠금
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mainConceptId: string; // 이 문제의 메인 개념
  relatedConceptIds: string[]; // 관련된 모든 개념들
  content: string; // 문제 내용
  solution?: string; // 해설 (선택적)
}

export interface ConceptTreeData {
  concepts: Record<string, Concept>;
  rootConceptId: string;
}

export interface LMSData {
  currentProblem: Problem;
  studentProgress: Record<string, number>; // conceptId -> progress percentage
  completedConcepts: string[];
}
