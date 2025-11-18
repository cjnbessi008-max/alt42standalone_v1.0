// Moodle Question Types
export interface MoodleQuestion {
  id: number;
  questiontext: string;
  questiontextformat: number;
  generalfeedback?: string;
  defaultmark: number;
  qtype: string; // multichoice, truefalse, numerical, essay, etc.
  answers?: MoodleAnswer[];
  options?: any;
}

export interface MoodleAnswer {
  id: number;
  answer: string;
  answerformat: number;
  fraction: number; // 1.0 for correct, 0.0 for incorrect
}

export interface MoodleQuizAttempt {
  id: number;
  quiz: number;
  userid: number;
  attempt: number;
  uniqueid: number;
  state: string;
  timestart: number;
  timefinish: number;
  timemodified: number;
}

// Parsed Problem Structure
export interface ParsedProblem {
  id: number;
  type: string;
  questionText: string;
  plainText: string; // HTML stripped
  equations: string[]; // LaTeX equations found
  choices?: {
    id: number;
    text: string;
    isCorrect: boolean;
  }[];
  metadata: {
    difficulty?: string;
    category?: string;
    tags?: string[];
  };
}

// AI Summary Response
export interface EquationSummary {
  line1: string; // Problem type and core concept
  line2: string; // Main equation/formula structure
  line3: string; // Solution approach
  confidence: number; // 0-1
  processingTime: number; // milliseconds
}

export interface SummaryRequest {
  questionId: number;
  questionText: string;
  equations?: string[];
  questionType?: string;
}

export interface SummaryResponse {
  success: boolean;
  summary?: EquationSummary;
  error?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}
