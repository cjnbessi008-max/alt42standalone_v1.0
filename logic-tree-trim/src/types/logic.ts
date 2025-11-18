/**
 * Logic Tree Trim - Type Definitions
 * 논리식 단순화를 위한 타입 정의
 */

export type NodeType = 'AND' | 'OR' | 'NOT' | 'VARIABLE' | 'LITERAL';

export interface LogicNode {
  id: string;
  type: NodeType;
  value?: string | boolean; // For VARIABLE or LITERAL
  children?: LogicNode[];
  parent?: string; // Parent node ID
  simplificationStep?: number; // 단순화 단계 (0 = 원본)
  pruned?: boolean; // 가지치기 되었는지
  explanation?: string; // 단순화 설명
}

export interface SimplificationStep {
  stepNumber: number;
  rule: string; // 적용된 규칙 (예: "De Morgan's Law", "Identity Law")
  description: string;
  before: LogicNode;
  after: LogicNode;
  prunedNodeIds: string[]; // 이 단계에서 제거된 노드 ID들
}

export interface LogicExpression {
  original: string;
  tree: LogicNode;
  simplificationSteps: SimplificationStep[];
  finalTree: LogicNode;
  finalExpression: string;
}

// 단순화 규칙 타입
export type SimplificationRule =
  | 'identity'        // A AND TRUE = A, A OR FALSE = A
  | 'annihilation'    // A AND FALSE = FALSE, A OR TRUE = TRUE
  | 'idempotent'      // A AND A = A, A OR A = A
  | 'complement'      // A AND NOT A = FALSE, A OR NOT A = TRUE
  | 'demorgan'        // NOT(A AND B) = NOT A OR NOT B
  | 'absorption'      // A OR (A AND B) = A
  | 'distribution'    // A AND (B OR C) = (A AND B) OR (A AND C)
  | 'doubleNegation'; // NOT NOT A = A
