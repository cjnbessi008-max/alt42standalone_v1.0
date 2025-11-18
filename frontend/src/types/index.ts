// Type definitions for Counting Tree Map application

export interface Problem {
  id: string;
  moodle_problem_id: string;
  moodle_course_id?: number;
  question_text: string;
  problem_type: 'counting' | 'arithmetic' | 'comparison' | 'pattern';
  difficulty_level: 1 | 2 | 3 | 4 | 5;
  correct_answer?: any;
  hints?: string[];
  learning_objectives?: string[];
  created_at?: string;
  updated_at?: string;
}

export type NodeType = 'problem' | 'approach' | 'step' | 'answer';

export interface TreeNode {
  id: string;
  problem_id: string;
  parent_id: string | null;
  node_type: NodeType;
  label: string;
  description?: string;
  position_x: number;
  position_y: number;
  is_correct?: boolean | null;
  metadata?: Record<string, any>;
  created_at?: string;
  children?: TreeNode[];
}

export interface StudentSession {
  id: string;
  student_id: string;
  moodle_user_id: number;
  problem_id: string;
  session_start: string;
  session_end?: string | null;
  is_active: boolean;
  final_score?: number | null;
  time_spent: number;
}

export interface StudentPath {
  id: string;
  session_id: string;
  node_id: string;
  sequence_order: number;
  time_entered: string;
  time_spent: number;
  student_input?: any;
  feedback_given?: string;
  label?: string;
  node_type?: NodeType;
  is_correct?: boolean;
}

export interface Analytics {
  problem_id: string;
  total_attempts: number;
  success_rate: number;
  avg_time_spent: number;
  most_common_path?: any;
  difficulty_rating?: number;
}

// React Flow types
export interface FlowNode extends TreeNode {
  data: {
    label: string;
    description?: string;
    isCorrect?: boolean | null;
    nodeType: NodeType;
    onNodeClick?: (nodeId: string) => void;
  };
  position: {
    x: number;
    y: number;
  };
  type?: string;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
  style?: Record<string, any>;
}

// Socket.IO event types
export interface SocketEvents {
  'join-session': { sessionId: string; userId: string };
  'navigate-node': {
    sessionId: string;
    nodeId: string;
    sequenceOrder: number;
    studentInput?: any;
  };
  'add-node': {
    problemId: string;
    parentId: string | null;
    nodeType: NodeType;
    label: string;
    description?: string;
    positionX: number;
    positionY: number;
  };
  'submit-answer': {
    sessionId: string;
    nodeId: string;
    answer: any;
    isCorrect: boolean;
  };
  'tree-state': {
    problem_id: string;
    nodes: TreeNode[];
  };
  'node-visited': {
    nodeId: string;
    sequenceOrder: number;
    timestamp: string;
  };
  'answer-feedback': {
    nodeId: string;
    isCorrect: boolean;
    timestamp: string;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface LaunchResponse {
  success: boolean;
  problem_id: string;
  session_id: string;
  message: string;
}

export interface ProblemWithTree {
  problem: Problem;
  tree_nodes: TreeNode[];
}

export interface SessionProgress {
  session: StudentSession;
  path_taken: StudentPath[];
}
