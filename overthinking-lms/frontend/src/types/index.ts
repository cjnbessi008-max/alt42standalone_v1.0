export interface User {
  id: string;
  name: string;
  email: string;
  type: 'student' | 'teacher';
  gradeLevel?: string;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  difficultyLevel: number;
  problemType: string;
  avgSolveTimeSeconds: number;
  hints?: Hint[];
  createdAt: string;
}

export interface Hint {
  level: number;
  text: string;
}

export interface StudentAttempt {
  id: string;
  studentId: string;
  problemId: string;
  answer?: string;
  isCorrect?: boolean;
  timeSpentSeconds: number;
  answerModifications: number;
  hintLevelUsed: number;
  startedAt: string;
  submittedAt?: string;
  problem?: Partial<Problem>;
}

export interface BehaviorEvent {
  id?: string;
  studentId: string;
  problemId: string;
  attemptId?: string;
  eventType: 'click' | 'input_change' | 'focus' | 'blur' | 'scroll' | 'hover' | 'answer_modify';
  eventData?: Record<string, any>;
  timestamp?: string;
}

export interface OverthinkingEvent {
  id: string;
  studentId: string;
  problemId: string;
  attemptId?: string;
  score: number;
  confidence: 'low' | 'medium' | 'high';
  triggers: string[];
  recommendation: 'observe' | 'hint' | 'alert_teacher';
  interventionTaken?: string;
  studentResponse?: string;
  detectedAt: string;
  resolvedAt?: string;
  student?: { id: string; name: string; email: string };
  problem?: { id: string; title: string; difficultyLevel: number };
  attempt?: Partial<StudentAttempt>;
}

export interface TeacherAlert extends OverthinkingEvent {
  studentName: string;
  problemTitle: string;
}

export interface Analytics {
  overview: {
    totalAttempts: number;
    completedAttempts: number;
    correctAttempts: number;
    avgTimeSpent: number;
    overthinkingRate: number;
    totalOverthinkingEvents: number;
  };
  studentMetrics: Array<{
    studentId: string;
    studentName: string;
    totalAttempts: number;
    correctAnswers: number;
    overthinkingCount: number;
    avgTimeSpent: number;
  }>;
  recentOverthinking: OverthinkingEvent[];
}
