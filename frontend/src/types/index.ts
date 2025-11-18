// Moodle Question Types
export interface MoodleQuestion {
  id: number;
  name: string;
  questiontext: string;
  qtype: string;
  defaultmark: number;
  penalty: number;
  length: number;
  stamp: string;
  version: string;
  hidden: boolean;
  timecreated: number;
  timemodified: number;
  createdby: number;
  modifiedby: number;
  // Question-specific data
  questiondata?: {
    min?: number;
    max?: number;
    step?: number;
    correctAnswer?: number;
    tolerance?: number;
  };
}

// Real Number Line Configuration
export interface RealLineConfig {
  minValue: number;
  maxValue: number;
  centerValue: number;
  zoomLevel: number;
  showTicks: boolean;
  showLabels: boolean;
  highlightPoints?: number[];
  markedRegions?: Array<{
    start: number;
    end: number;
    color: string;
    label?: string;
  }>;
}

// Viewport for panorama visualization
export interface Viewport {
  left: number;
  right: number;
  width: number;
}

// Interaction state
export interface InteractionState {
  isDragging: boolean;
  isZooming: boolean;
  startX: number;
  startViewport: Viewport;
}

// Problem state from Moodle
export interface ProblemState {
  question: MoodleQuestion | null;
  isLoading: boolean;
  error: string | null;
  userAnswer: number | null;
  submitted: boolean;
  feedback: string | null;
}

// App configuration
export interface AppConfig {
  moodleUrl: string;
  moodleToken: string;
  apiBaseUrl: string;
  smartphonePosition: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme: 'light' | 'dark';
}
