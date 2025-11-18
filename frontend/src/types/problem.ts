/**
 * 문제 관련 타입 정의
 */

export enum DifficultyLevel {
  VERY_EASY = "very_easy",
  EASY = "easy",
  MEDIUM = "medium",
  HARD = "hard",
  VERY_HARD = "very_hard"
}

export enum ProblemType {
  MULTIPLE_CHOICE = "multiple_choice",
  SHORT_ANSWER = "short_answer",
  FILL_IN_BLANK = "fill_in_blank",
  TRUE_FALSE = "true_false",
  MATCHING = "matching",
  CALCULATION = "calculation"
}

export enum Subject {
  MATH = "math",
  SCIENCE = "science",
  LANGUAGE = "language",
  SOCIAL_STUDIES = "social_studies"
}

export interface Problem {
  id: string;
  title: string;
  content: string;
  problem_type: ProblemType;
  subject: Subject;
  difficulty: DifficultyLevel;
  grade_level: number;
  tags: string[];
  estimated_time_minutes: number;
  correct_answer: string;
  explanation?: string;
  created_at: string;
  updated_at: string;
}

export interface WarmupRecommendationRequest {
  student_id: string;
  current_problem_id?: string;
  problem_type?: ProblemType;
  subject?: Subject;
  grade_level?: number;
}

export interface WarmupRecommendationResponse {
  recommended_problem: Problem;
  reason: string;
  confidence_score: number;
}

export interface SubmitResultResponse {
  attempt_id: string;
  is_correct: boolean;
  correct_answer: string;
  explanation: string;
  lms_synced: boolean;
  message: string;
}

// 한글 레이블 매핑
export const DifficultyLabels: Record<DifficultyLevel, string> = {
  [DifficultyLevel.VERY_EASY]: "매우 쉬움",
  [DifficultyLevel.EASY]: "쉬움",
  [DifficultyLevel.MEDIUM]: "보통",
  [DifficultyLevel.HARD]: "어려움",
  [DifficultyLevel.VERY_HARD]: "매우 어려움"
};

export const SubjectLabels: Record<Subject, string> = {
  [Subject.MATH]: "수학",
  [Subject.SCIENCE]: "과학",
  [Subject.LANGUAGE]: "언어",
  [Subject.SOCIAL_STUDIES]: "사회"
};

export const ProblemTypeLabels: Record<ProblemType, string> = {
  [ProblemType.MULTIPLE_CHOICE]: "객관식",
  [ProblemType.SHORT_ANSWER]: "단답형",
  [ProblemType.FILL_IN_BLANK]: "빈칸 채우기",
  [ProblemType.TRUE_FALSE]: "참/거짓",
  [ProblemType.MATCHING]: "짝짓기",
  [ProblemType.CALCULATION]: "계산"
};
