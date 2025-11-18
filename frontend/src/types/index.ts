export interface Problem {
  id: string;
  title: string;
  content: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
  grade?: number;
}

export interface SummaryResult {
  success: boolean;
  summary: string[];
  metadata?: {
    model: string;
    tokensUsed: number;
    timestamp: string;
  };
  error?: string;
}

export interface LMSProblemSummaryResult extends SummaryResult {
  problem?: {
    id: string;
    title: string;
    difficulty?: string;
    grade?: number;
  };
}

export interface SummarizeRequest {
  problemText: string;
  language?: 'ko' | 'en';
}

export interface LMSSummarizeRequest {
  problemId: string;
  language?: 'ko' | 'en';
  saveSummary?: boolean;
}

export type Language = 'ko' | 'en';
