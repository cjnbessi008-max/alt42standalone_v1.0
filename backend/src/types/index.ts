// Trap Point Types
export enum TrapType {
  TEXT = 'text',
  NUMBER = 'number',
  DIAGRAM = 'diagram',
  OPTION = 'option',
}

export enum TrapSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface TrapPointPosition {
  x: number;        // X coordinate (%)
  y: number;        // Y coordinate (%)
  width: number;    // Width (%)
  height: number;   // Height (%)
}

export interface TrapPoint {
  id: number;
  questionId: number;
  type: TrapType;
  position: TrapPointPosition;
  severity: TrapSeverity;
  description: string;
  errorRate: number;  // 0-100 percentage
  createdAt?: Date;
}

// Moodle Types
export interface MoodleQuestion {
  id: number;
  questiontext: string;
  questiontextformat: number;
  qtype: string;
  name: string;
  penalty: number;
  defaultmark: number;
}

export interface MoodleQuestionAnswer {
  id: number;
  answer: string;
  fraction: number;
  feedback: string;
}

export interface MoodleQuiz {
  id: number;
  course: number;
  name: string;
  intro: string;
  timeopen: number;
  timeclose: number;
  timelimit: number;
  preferredbehaviour: string;
}

export interface QuizProblem {
  question: MoodleQuestion;
  answers: MoodleQuestionAnswer[];
  trapPoints: TrapPoint[];
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Moodle Web Service Response
export interface MoodleWSResponse {
  exception?: string;
  errorcode?: string;
  message?: string;
  [key: string]: any;
}
