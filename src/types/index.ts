// Set Dance 애플리케이션 타입 정의

export interface SetElement {
  id: string;
  value: number;
  color?: string;
  label?: string;
}

export interface SetCondition {
  type: 'even' | 'odd' | 'greater' | 'less' | 'range' | 'custom';
  value?: number;
  min?: number;
  max?: number;
  customFn?: (element: SetElement) => boolean;
}

export interface Problem {
  id: string;
  title: string;
  description: string;
  elements: SetElement[];
  conditions: SetCondition[];
  correctAnswer?: string[];
}

export interface MoodleApiResponse {
  success: boolean;
  problem?: Problem;
  error?: string;
}
