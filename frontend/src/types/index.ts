// Session types
export interface Session {
  id: number;
  session_id: string;
  student_id: string;
  student_name: string;
  problem_id: string | null;
  problem_title: string;
  canvas_width: number;
  canvas_height: number;
  started_at: string;
  ended_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Coordinate types
export interface Coordinate {
  id?: number;
  session_id: string;
  x: number;
  y: number;
  timestamp: string | Date;
}

// Mean Center Statistics
export interface MeanCenterStats {
  id: number;
  session_id: string;
  mean_x: number;
  mean_y: number;
  point_count: number;
  variance_x: number;
  variance_y: number;
  std_dev_x: number;
  std_dev_y: number;
  min_x: number;
  max_x: number;
  min_y: number;
  max_y: number;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SessionSummary {
  session: Session;
  stats: MeanCenterStats | null;
  recentCoordinates: Coordinate[];
  coordinateCount: number;
}

// Moodle types
export interface MoodleUser {
  id: string;
  username: string;
  fullname: string;
  email: string;
}

export interface MoodleProblem {
  id: number;
  name: string;
  intro: string;
  course: number;
}
