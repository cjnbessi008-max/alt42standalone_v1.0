export interface User {
  id: number;
  username: string;
  email: string;
  fullName?: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface ErrorCategory {
  id: number;
  nameKo: string;
  nameEn: string;
  description?: string;
  icon?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface QuestionError {
  id: number;
  attemptId: number;
  userId: number;
  moodleQuestionId: number;
  questionText?: string;
  questionType?: string;
  correctAnswer?: string;
  studentAnswer?: string;
  isCorrect: boolean;
  createdAt: string;
  errorReasons?: ErrorReason[];
}

export interface ErrorReason {
  id: number;
  questionErrorId: number;
  categoryId: number;
  userId: number;
  confidenceLevel: '확실함' | '아마도' | '잘 모르겠음';
  studentNote?: string;
  createdAt: string;
  updatedAt: string;
  category?: ErrorCategory;
  questionError?: QuestionError;
}

export interface CategoryDistribution {
  category: string;
  categoryEn: string;
  count: number;
  percentage: number;
  avgConfidence: number;
}

export interface ErrorTrend {
  date: string;
  count: number;
  categories: { [key: string]: number };
}

export interface PatternAnalysis {
  userId: number;
  period: {
    start: string;
    end: string;
  };
  totalErrors: number;
  categoryDistribution: CategoryDistribution[];
  trends: ErrorTrend[];
  insights: string;
  recommendations: string[];
}

export interface CreateErrorReasonDTO {
  questionErrorId: number;
  categoryId: number;
  confidenceLevel?: '확실함' | '아마도' | '잘 모르겠음';
  studentNote?: string;
}

export interface UpdateErrorReasonDTO {
  categoryId?: number;
  confidenceLevel?: '확실함' | '아마도' | '잘 모르겠음';
  studentNote?: string;
}
