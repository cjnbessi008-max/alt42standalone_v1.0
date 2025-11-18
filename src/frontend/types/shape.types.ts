/**
 * Shape Morph 타입 정의
 */

export type ShapeType = 'circle' | 'polygon' | 'path' | 'bezier';

export type EasingFunction =
  | 'linear'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'ease-in-cubic'
  | 'ease-out-cubic'
  | 'ease-in-out-cubic'
  | 'bounce'
  | 'elastic';

export interface Point {
  x: number;
  y: number;
}

export interface ShapeData {
  type: ShapeType;
  points?: Point[];
  radius?: number;
  sides?: number;
  rotation?: number;
  width?: number;
  height?: number;
  segments?: number;
  filled?: number;
  paths?: string[];
}

export interface ConceptShape {
  id: number;
  name: string;
  category: string;
  shape_data: ShapeData;
  colors: {
    primary: string;
    secondary: string;
  };
  description?: string;
}

export interface TransitionConfig {
  type: 'morph' | 'fade' | 'slide' | 'scale';
  duration: number;
  easing: EasingFunction;
  keyframes?: ShapeData[];
}

export interface MorphState {
  fromShape: ConceptShape;
  toShape: ConceptShape;
  progress: number; // 0.0 - 1.0
  currentFrame: ShapeData;
}

export interface AnimationState {
  isAnimating: boolean;
  currentConcept: ConceptShape | null;
  previousConcept: ConceptShape | null;
  transition: TransitionConfig | null;
  morphState: MorphState | null;
}

export interface MoodleResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface CurrentConceptResponse {
  current_concept: ConceptShape;
  previous_concept: ConceptShape | null;
  transition_state: 'idle' | 'transitioning' | 'completed';
  transition: TransitionConfig | null;
  last_updated: number;
}

export interface UpdateProgressResponse {
  updated: boolean;
  from_concept_id: number;
  to_concept_id: number;
  transition: TransitionConfig;
}
