export interface RecurrenceNode {
  id: string;
  value: number;
  depth: number;
  position: number;
  result?: number;
  children?: RecurrenceNode[];
}

export interface RecurrenceProblem {
  id: string;
  name: string;
  description: string;
  formula: string;
  baseCase: string;
  calculate: (n: number) => RecurrenceTree;
  example: string;
}

export interface RecurrenceTree {
  root: RecurrenceNode;
  maxDepth: number;
  totalNodes: number;
}

export interface WavePoint {
  x: number;
  y: number;
  depth: number;
  value: number;
  opacity: number;
}
