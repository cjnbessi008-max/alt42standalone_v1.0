// 부등식 타입 정의
export interface Inequality {
  id: string;
  expression: string;
  type: 'greater' | 'less' | 'greaterEqual' | 'lessEqual' | 'range';
  leftBound?: number;
  rightBound?: number;
  includeLeft?: boolean;
  includeRight?: boolean;
}

// 문제 정보
export interface Problem {
  id: string;
  title: string;
  description: string;
  inequality: string;
  moodleId?: string;
  createdAt: Date;
}

// 시각화 설정
export interface VisualizationSettings {
  minValue: number;
  maxValue: number;
  resolution: number;
  lightColor: string;
  backgroundColor: string;
}

// 앱 상태
export interface AppState {
  currentProblem: Problem | null;
  inequality: Inequality | null;
  visualizationSettings: VisualizationSettings;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentProblem: (problem: Problem) => void;
  setInequality: (inequality: Inequality) => void;
  updateVisualizationSettings: (settings: Partial<VisualizationSettings>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}
