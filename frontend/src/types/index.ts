// Problem and Question Types
export interface ParsedProblem {
  id: number;
  type: string;
  questionText: string;
  plainText: string;
  equations: string[];
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

// AI Summary Types
export interface EquationSummary {
  line1: string;
  line2: string;
  line3: string;
  confidence: number;
  processingTime: number;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ProblemWithSummary {
  problem: ParsedProblem;
  summary: EquationSummary;
}
