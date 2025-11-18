/**
 * One-Frame Case Type Definitions
 *
 * Types for visualizing multiple solution paths or case scenarios
 * in a single compressed animated view
 */

export type LayoutAlgorithm = 'tree' | 'grid' | 'radial' | 'flow';
export type AnimationType = 'sequential' | 'parallel' | 'radial';
export type ContentType = 'text' | 'image' | 'svg' | 'interactive';
export type InteractionType = 'view' | 'click' | 'hover' | 'select';
export type ViewportPosition = 'bottom-right' | 'bottom-left' | 'center' | 'top-right' | 'top-left';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface HighlightConfig {
  recommendedCase?: boolean;
  color?: string;
  intensity?: number;
}

export interface AnimationConfig {
  type: AnimationType;
  duration: number; // milliseconds
  easing: string;
  delay?: number;
  highlight?: HighlightConfig;
}

export interface LayoutConfig {
  algorithm: LayoutAlgorithm;
  spacing: number;
  direction?: 'horizontal' | 'vertical';
  padding?: number;
}

export interface VisualizationConfig {
  type: 'fraction' | 'equation' | 'geometry' | 'graph' | 'custom';
  theme?: 'light' | 'dark';
  interactive?: boolean;
  scale?: number;
}

export interface CaseContent {
  type: ContentType;
  data: any;
  visualization?: VisualizationConfig;
}

export interface CaseMetadata {
  difficulty?: number; // 1-5
  timeEstimate?: number; // milliseconds
  isRecommended?: boolean;
  prerequisites?: string[];
  tags?: string[];
}

export interface Case {
  id: string;
  label: string;
  description?: string;
  content: CaseContent;
  position?: Position;
  size?: Size;
  connections?: string[]; // IDs of connected cases
  metadata?: CaseMetadata;
}

export interface CaseData {
  id: string;
  title: string;
  description: string;
  problemId?: string;
  moduleId?: string;
  cases: Case[];
  layout: LayoutConfig;
  animation?: AnimationConfig;
  createdAt?: string;
  updatedAt?: string;
}

export interface InteractionData {
  caseNodeId: string;
  interactionType: InteractionType;
  timestamp: number;
  duration?: number; // milliseconds
  metadata?: {
    selectedOption?: string;
    inputValue?: any;
    scrollPosition?: number;
    [key: string]: any;
  };
}

export interface InteractionResponse {
  success: boolean;
  message?: string;
  nextRecommendation?: string; // Next case ID to explore
}

export interface SmartphoneViewportConfig {
  width?: number; // default: 375px
  height?: number; // default: 667px
  position?: ViewportPosition;
  scale?: number; // default: 0.6
  showFrame?: boolean; // default: true
  showNotch?: boolean; // default: true
}

export interface CaseGenerationConfig {
  targetGradeLevel: string;
  difficulty: number;
  maxCases?: number;
  preferredLayout?: LayoutAlgorithm;
  includeVisualization?: boolean;
  language?: 'ko' | 'en';
}

export interface ProblemData {
  id: string;
  type: string;
  title: string;
  description: string;
  cases?: any[];
  difficulty?: number;
  gradeLevel?: string;
}

export interface StudentProgress {
  studentId: string;
  caseId: string;
  completedCases: string[];
  currentCase?: string;
  startedAt: string;
  lastInteractionAt?: string;
  totalTimeSpent: number; // milliseconds
  interactionCount: number;
}
