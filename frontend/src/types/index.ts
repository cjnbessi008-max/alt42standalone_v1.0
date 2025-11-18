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
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TrapPoint {
  id: number;
  questionId: number;
  type: TrapType;
  position: TrapPointPosition;
  severity: TrapSeverity;
  description: string;
  errorRate: number;
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

export interface QuizProblem {
  question: MoodleQuestion;
  answers: MoodleQuestionAnswer[];
  trapPoints: TrapPoint[];
}

// API Response Type
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
