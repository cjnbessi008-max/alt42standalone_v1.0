/**
 * Types for Break Ripple Animation System
 * LMS Integration and Problem Data Structures
 */

/**
 * Discontinuity types in mathematical functions
 */
export enum DiscontinuityType {
  JUMP = 'jump',           // Jump discontinuity (계단 불연속)
  REMOVABLE = 'removable', // Removable discontinuity (제거 가능 불연속)
  INFINITE = 'infinite',   // Infinite discontinuity (무한 불연속)
  OSCILLATING = 'oscillating' // Oscillating discontinuity (진동 불연속)
}

/**
 * Ripple animation behavior at discontinuity points
 */
export enum RippleBehavior {
  BREAK = 'break',         // Ripple breaks/stops at discontinuity
  REFLECT = 'reflect',     // Ripple reflects back
  JUMP = 'jump',           // Ripple jumps to other side
  DAMPEN = 'dampen'        // Ripple amplitude decreases
}

/**
 * Mathematical function definition
 */
export interface MathFunction {
  id: string;
  expression: string;        // e.g., "x < 2 ? x^2 : x + 3"
  domain: [number, number];  // Function domain [min, max]
  range: [number, number];   // Function range [min, max]
  discontinuityPoints: DiscontinuityPoint[];
}

/**
 * Discontinuity point details
 */
export interface DiscontinuityPoint {
  x: number;                      // x-coordinate of discontinuity
  leftLimit: number | null;       // Left-hand limit
  rightLimit: number | null;      // Right-hand limit
  functionValue: number | null;   // Actual function value at x
  type: DiscontinuityType;
  rippleBehavior: RippleBehavior;
}

/**
 * Problem data from LMS (Moodle)
 */
export interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  mathFunction: MathFunction;
  instructions: string;
  expectedAnswer?: string;
  hints?: string[];
  metadata?: {
    subject: string;
    gradeLevel: string;
    topic: string;
    tags: string[];
  };
}

/**
 * LMS Integration - Problem response from Moodle
 */
export interface LMSProblemResponse {
  success: boolean;
  problem: Problem;
  sessionId?: string;
  error?: string;
}

/**
 * Student answer submission
 */
export interface AnswerSubmission {
  problemId: string;
  studentId: string;
  sessionId: string;
  answer: string;
  timeSpent: number; // seconds
  attempts: number;
  timestamp: string;
}

/**
 * Ripple animation configuration
 */
export interface RippleConfig {
  speed: number;           // Animation speed multiplier
  amplitude: number;       // Wave amplitude
  frequency: number;       // Wave frequency
  color: string;          // Ripple color
  showDiscontinuity: boolean; // Highlight discontinuity points
  autoPlay: boolean;      // Auto-start animation
}

/**
 * Animation state
 */
export interface AnimationState {
  isPlaying: boolean;
  currentTime: number;
  ripplePosition: number;
  hasReachedDiscontinuity: boolean;
  completedCycles: number;
}

/**
 * Smartphone display configuration
 */
export interface SmartphoneConfig {
  width: number;
  height: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  scale: number;
  showFrame: boolean;
}
