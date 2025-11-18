// Problem Types
export type ProblemType =
  | 'number_comparison'
  | 'addition'
  | 'subtraction'
  | 'multiplication'
  | 'division'
  | 'fraction'
  | 'pattern';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Problem {
  id: number;
  moodle_problem_id?: number;
  title: string;
  description?: string;
  problem_type: ProblemType;
  difficulty_level: DifficultyLevel;
  target_grade: number;
  numbers: number[];
  correct_answer: string;
  visualization_config?: VisualizationConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface VisualizationConfig {
  object_type: ObjectType;
  color_scheme?: string;
  layout?: 'grid' | 'circular' | 'linear' | 'random';
  animation_type?: 'fade' | 'grow' | 'bounce' | 'slide';
  show_labels?: boolean;
}

// Garden Object Types
export type ObjectType =
  | 'flower'
  | 'tree'
  | 'bush'
  | 'stone'
  | 'fountain'
  | 'butterfly'
  | 'bird';

export interface GardenObject {
  id: number;
  type: ObjectType;
  position: { x: number; y: number };
  size: number;
  color: string;
  value: number;
  label?: string;
  interactive?: boolean;
}

// Student Session Types
export interface StudentSession {
  id: number;
  session_id: string;
  student_name?: string;
  moodle_user_id?: number;
  started_at: string;
  last_activity_at: string;
  total_problems_attempted: number;
  total_correct_answers: number;
}

export interface StudentAttempt {
  id: number;
  session_id: number;
  problem_id: number;
  student_answer: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  interaction_data?: InteractionData;
  attempted_at: string;
}

export interface InteractionData {
  clicks?: number;
  drags?: number;
  hover_time?: number;
  objects_moved?: string[];
  custom_events?: Array<{
    event_type: string;
    timestamp: number;
    data?: any;
  }>;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// App State Types
export interface AppState {
  currentSession: StudentSession | null;
  currentProblem: Problem | null;
  isLoading: boolean;
  error: string | null;
}

// Garden State Types
export interface GardenState {
  objects: GardenObject[];
  selectedObject: GardenObject | null;
  animating: boolean;
  interactionCount: number;
  startTime: number | null;
}
