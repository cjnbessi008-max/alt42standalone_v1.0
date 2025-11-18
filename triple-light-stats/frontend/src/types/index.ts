export interface Quiz {
  id: number;
  name: string;
  intro?: string;
  courseName: string;
  timeOpen?: number;
  timeClose?: number;
  attemptCount: number;
}

export interface Statistics {
  mean: number;
  median: number;
  mode: number;
  count: number;
  min: number;
  max: number;
  normalized: {
    mean: number;
    median: number;
    mode: number;
  };
}

export interface QuizStats {
  quizId: number;
  quizName: string;
  courseName: string;
  maxGrade: number;
  statistics: Statistics;
  timestamp: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
