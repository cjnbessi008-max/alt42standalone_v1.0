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
  id?: number;
  moodle_problem_id?: number;
  title: string;
  description?: string;
  problem_type: ProblemType;
  difficulty_level: DifficultyLevel;
  target_grade: number;
  numbers: number[];
  correct_answer: string;
  visualization_config?: VisualizationConfig;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
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
  id?: number;
  object_type: ObjectType;
  object_name: string;
  svg_path?: string;
  color_scheme?: string;
  size_unit: number;
  description?: string;
  created_at?: Date;
}

// Student Session Types
export interface StudentSession {
  id?: number;
  session_id: string;
  student_name?: string;
  moodle_user_id?: number;
  started_at?: Date;
  last_activity_at?: Date;
  total_problems_attempted?: number;
  total_correct_answers?: number;
}

export interface StudentAttempt {
  id?: number;
  session_id: number;
  problem_id: number;
  student_answer: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  interaction_data?: InteractionData;
  attempted_at?: Date;
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

// Moodle Integration Types
export type SyncType = 'problem_import' | 'result_export' | 'user_sync';
export type SyncStatus = 'success' | 'failed' | 'pending';

export interface MoodleSyncLog {
  id?: number;
  sync_type: SyncType;
  moodle_endpoint: string;
  request_data?: any;
  response_data?: any;
  status: SyncStatus;
  error_message?: string;
  synced_at?: Date;
}

// App Settings Types
export type SettingType = 'string' | 'number' | 'boolean' | 'json';

export interface AppSetting {
  id?: number;
  setting_key: string;
  setting_value: string;
  setting_type: SettingType;
  description?: string;
  updated_at?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}
