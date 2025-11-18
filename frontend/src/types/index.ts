/**
 * Types for Blend Difference Animation System
 */

export type BlendMode =
  | 'difference'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'add'
  | 'subtract';

export interface MathFunction {
  id: string;
  expression: string;
  color: string;
  label: string;
}

export interface AnimationConfig {
  duration: number;
  fps: number;
  blendMode: BlendMode;
  showGrid: boolean;
  showAxes: boolean;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface Problem {
  id: number;
  title: string;
  description: string;
  function1: string;
  function2: string;
  color1: string;
  color2: string;
  expectedDifference?: string;
  hints?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface LMSIntegration {
  endpoint: string;
  apiKey?: string;
  courseId?: string;
  problemId?: string;
}

export interface Point {
  x: number;
  y: number;
}

export interface CanvasConfig {
  width: number;
  height: number;
  pixelRatio: number;
  padding: number;
}
