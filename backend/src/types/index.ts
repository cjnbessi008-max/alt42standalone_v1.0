// Problem types
export enum ProblemType {
  PROBABILITY_TREE = 'probability_tree',
  COMBINATION_TREE = 'combination_tree',
  DECISION_TREE = 'decision_tree',
  FACTORIZATION_TREE = 'factorization_tree'
}

// Tree configuration interface
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

// Problem interface
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

// Tree node interface
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

// Student attempt interface
export interface StudentAttempt {
  id?: number;
  problem_id: number;
  moodle_user_id: number;
  student_name?: string;
  answer: Record<string, any>;
  is_correct: boolean;
  time_spent_seconds?: number;
  tree_interaction_log?: Record<string, any>;
  attempt_number: number;
  started_at: Date;
  completed_at?: Date;
}

// Student progress interface
export interface StudentProgress {
  id?: number;
  moodle_user_id: number;
  problem_id: number;
  mastery_level: number;
  total_attempts: number;
  correct_attempts: number;
  last_attempt_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Moodle quiz interface
export interface MoodleQuiz {
  id: number;
  course: number;
  coursemodule: number;
  name: string;
  intro: string;
  introformat: number;
  timeopen?: number;
  timeclose?: number;
  timelimit?: number;
  questions?: MoodleQuestion[];
}

export interface MoodleQuestion {
  id: number;
  slot: number;
  type: string;
  name: string;
  questiontext: string;
  defaultmark: number;
}

// API Response types
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

// Tree calculation result
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
