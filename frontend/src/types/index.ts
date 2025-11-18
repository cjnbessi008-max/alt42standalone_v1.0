export interface Problem {
  problemId: string;
  questionText: string;
  questionType: string;
  difficultyLevel?: number;
  attemptId: string;
  studentAnswer: string;
  isCorrect: boolean;
  score: number;
  timeSpentSeconds: number;
  attemptedAt: string;
  reasoning: ReasoningStructure;
}

export interface ReasoningStructure {
  concepts: string[];
  difficultyAssessment: 'trivial' | 'easy' | 'medium' | 'hard' | 'very_hard';
  prerequisites?: string[];
  reasoningSteps: ReasoningStep[];
  studentApproach: StudentApproach;
  relatedConcepts: string[];
  nextRecommendedTopics?: RecommendedTopic[];
  pedagogicalInsights?: PedagogicalInsights;
}

export interface ReasoningStep {
  step: number;
  description: string;
  concept: string;
  formula?: string;
  explanation?: string;
}

export interface StudentApproach {
  correct: boolean;
  steps: string[];
  insights: string;
  commonMistakes?: string[];
}

export interface RecommendedTopic {
  topic: string;
  reason: string;
}

export interface PedagogicalInsights {
  strengthens: string[];
  needsWork: string[];
  studyTips: string;
}

export interface Summary {
  totalProblems: number;
  correctCount: number;
  incorrectCount: number;
  accuracyRate: number;
  totalTimeMinutes: number;
  firstAttempt?: string;
  lastAttempt?: string;
}

export interface LearningPattern {
  patternId: string;
  date: string;
  statistics: {
    totalProblems: number;
    correctProblems: number;
    accuracyRate: number;
    totalTimeMinutes: number;
  };
  conceptStats: {
    strong: string[];
    weak: string[];
    improving: string[];
  };
  insights: {
    overallPerformance?: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
    };
    conceptMastery?: {
      strong: string[];
      developing: string[];
      needsWork: string[];
    };
    learningPatterns?: {
      preferredApproaches: string[];
      commonMistakes: string[];
      improvementTrend: string;
    };
    recommendations?: {
      nextTopics: string[];
      practiceAreas: string[];
      studyTips: string[];
    };
    motivationalMessage?: string;
  };
}

export interface Trend {
  date: string;
  totalProblems: number;
  correctCount: number;
  accuracyRate: number;
  totalTimeMinutes: number;
}
