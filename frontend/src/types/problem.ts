export interface InverseProblem {
  id: string;
  module_id?: string;
  function_type: string;
  original_function: string;
  inverse_function: string;
  domain_min: number;
  domain_max: number;
  range_min?: number;
  range_max?: number;
  difficulty_level: 'easy' | 'medium' | 'hard';
  tags?: string[];
  hints?: Hint[];
  visualization_config?: VisualizationConfig;
  created_at: string;
  updated_at: string;
}

export interface Hint {
  step: number;
  text: string;
}

export interface VisualizationConfig {
  show_grid: boolean;
  show_reflection_line: boolean;
  animation_speed: 'slow' | 'medium' | 'fast';
  color_original: string;
  color_inverse: string;
  color_reflection_line: string;
  enable_interactive_points?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface StudentAttempt {
  id: string;
  problem_id: string;
  student_id: string;
  attempted_inverse: string;
  is_correct: boolean;
  time_spent_seconds: number;
  interaction_log?: InteractionEvent[];
  attempted_at: string;
}

export interface InteractionEvent {
  type: string;
  data: any;
  timestamp: string;
}
