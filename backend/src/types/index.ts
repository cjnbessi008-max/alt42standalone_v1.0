// Triangle types
export interface Point {
  x: number;
  y: number;
}

export interface Triangle {
  id: string;
  vertices: [Point, Point, Point];
  color: string;
  isTarget: boolean;
  scaleFactor?: number;
}

// Problem types
export interface Problem {
  id: string;
  moodleId?: string;
  title: string;
  description: string;
  sourceTriangle: Triangle;
  targetTriangle: Triangle;
  requiredScaleFactor: number;
  tolerance: number;
  difficulty: 'easy' | 'medium' | 'hard';
  createdAt: string;
}

export interface ProblemDB {
  id: string;
  moodle_id?: string;
  title: string;
  description: string;
  source_triangle: string; // JSON
  target_triangle: string; // JSON
  required_scale_factor: number;
  tolerance: number;
  difficulty: string;
  created_at: Date;
}

// Student attempt types
export interface StudentAttempt {
  id: string;
  studentId: string;
  problemId: string;
  submittedTriangle: Triangle;
  submittedScaleFactor: number;
  isCorrect: boolean;
  accuracy: number;
  timeSpentSeconds: number;
  attemptedAt: string;
}

export interface StudentAttemptDB {
  id: string;
  student_id: string;
  problem_id: string;
  submitted_triangle: string; // JSON
  submitted_scale_factor: number;
  is_correct: boolean;
  accuracy: number;
  time_spent_seconds: number;
  attempted_at: Date;
}

// Moodle types
export interface MoodleWebServiceRequest {
  wstoken: string;
  wsfunction: string;
  moodlewsrestformat: string;
  [key: string]: any;
}

export interface MoodleQuestion {
  id: number;
  name: string;
  questiontext: string;
  questiontextformat: number;
  defaultmark: number;
}

export interface MoodleGradeSubmission {
  itemname: string;
  userid: number;
  grade: number;
  feedback?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
