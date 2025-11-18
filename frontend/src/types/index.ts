export enum ProblemType {
  PROBABILITY_TREE = 'probability_tree',
  COMBINATION_TREE = 'combination_tree',
  DECISION_TREE = 'decision_tree',
  FACTORIZATION_TREE = 'factorization_tree'
}

export interface TreeNode {
  id?: number;
  problem_id: number;
  node_key: string;
  label: string;
  parent_key?: string;
  probability?: number;
  value?: string;
  level: number;
  position_x?: number;
  position_y?: number;
  metadata?: Record<string, any>;
  children?: TreeNode[];
}

export interface Problem {
  id: number;
  moodle_quiz_id: number;
  moodle_question_id?: number;
  title: string;
  description?: string;
  tree_config: TreeConfig;
  problem_type: ProblemType;
  difficulty_level: number;
  created_at: Date;
  updated_at: Date;
}

export interface TreeConfig {
  type: ProblemType;
  levels?: number;
  rootLabel?: string;
  branchLabels?: string[];
  branchProbabilities?: number[];
  branches?: TreeBranch[];
  rootValue?: number;
  targetPrimes?: boolean;
  showSteps?: boolean;
  allowInteraction?: boolean;
  correctFactors?: number[];
  calculateOutcomes?: boolean;
  calculateTotal?: boolean;
  showProbabilities?: boolean;
  animation?: AnimationConfig;
}

export interface AnimationConfig {
  enabled: boolean;
  speed: number;
  expandOnClick?: boolean;
  highlightPath?: boolean;
}

export interface TreeBranch {
  level: number;
  label: string;
  options: string[];
}

export interface TreeCalculationResult {
  totalOutcomes: number;
  paths: TreePath[];
  probabilities?: Map<string, number>;
  metadata: Record<string, any>;
}

export interface TreePath {
  path: string[];
  probability: number;
  outcome: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    [key: string]: any;
  };
}
