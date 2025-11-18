// Type definitions for Recurrence Beam App

export interface RecurrenceProblem {
  id: string;
  title: string;
  description: string;
  formula: string; // e.g., "f(n) = f(n-1) + f(n-2)"
  initialConditions: { [key: string]: number }; // e.g., { "f(0)": 0, "f(1)": 1 }
  maxSteps: number;
}

export interface RecurrenceStep {
  index: number;
  value: number;
  formula: string;
  dependencies: number[]; // indices of previous steps used
}

export interface BeamAnimationState {
  currentStep: number;
  isAnimating: boolean;
  speed: number; // animation speed (1-10)
}

export interface MoodleConfig {
  baseUrl: string;
  token: string;
  courseId?: string;
}

export interface MoodleProblemResponse {
  id: number;
  name: string;
  intro: string;
  custom_data?: string; // JSON string with recurrence formula
}
