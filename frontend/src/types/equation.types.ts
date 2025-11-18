/**
 * Type definitions for equation simplification and animation
 * Part of KAIST Touch Math Academy AI Education System
 */

/**
 * Represents a single step in equation simplification
 */
export interface EquationStep {
  /** Unique identifier for this step */
  id: string;

  /** LaTeX representation of the equation at this step */
  equation: string;

  /** Human-readable description of what happened in this step */
  description: string;

  /** The mathematical rule applied (e.g., "Combine like terms", "Distributive property") */
  rule: string;

  /** Delay in milliseconds before showing this step */
  delay: number;

  /** Elements that changed in this step (for highlighting) */
  changedElements?: string[];

  /** Color to use for highlighting changed elements */
  highlightColor?: string;
}

/**
 * Represents a complete equation problem with simplification steps
 */
export interface EquationProblem {
  /** Unique identifier for this problem */
  id: string;

  /** Original equation (LaTeX format) */
  original: string;

  /** Final simplified form (LaTeX format) */
  simplified: string;

  /** Array of simplification steps */
  steps: EquationStep[];

  /** Difficulty level (1-5) */
  difficulty: number;

  /** Topic/category (e.g., "linear equations", "polynomials") */
  topic: string;

  /** Grade level target */
  gradeLevel: string;

  /** Module this problem belongs to */
  moduleId: string;
}

/**
 * Animation configuration options
 */
export interface AnimationConfig {
  /** Duration of each transition in milliseconds */
  transitionDuration: number;

  /** Delay between steps in milliseconds */
  stepDelay: number;

  /** Easing function for transitions */
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';

  /** Whether to auto-play the animation */
  autoPlay: boolean;

  /** Whether to loop the animation */
  loop: boolean;

  /** Highlight color for changed elements */
  highlightColor: string;

  /** Speed multiplier (1.0 = normal, 2.0 = 2x speed) */
  speedMultiplier: number;
}

/**
 * Student interaction event for tracking
 */
export interface InteractionEvent {
  /** Type of interaction */
  type: 'step_forward' | 'step_backward' | 'play' | 'pause' | 'reset' | 'speed_change';

  /** Timestamp of the interaction */
  timestamp: Date;

  /** Current step index when interaction occurred */
  currentStep: number;

  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Student attempt data for an equation problem
 */
export interface StudentAttempt {
  /** Unique identifier */
  id: string;

  /** Student ID */
  studentId: string;

  /** Problem ID */
  problemId: string;

  /** Student's answer (LaTeX format) */
  answer: string;

  /** Whether the answer was correct */
  isCorrect: boolean;

  /** Time spent in seconds */
  timeSpentSeconds: number;

  /** Number of hints requested */
  hintsRequested: number;

  /** Interaction events during the attempt */
  interactions: InteractionEvent[];

  /** Timestamp of attempt */
  attemptedAt: Date;
}

/**
 * Props for EquationRenderer component
 */
export interface EquationRendererProps {
  /** LaTeX equation string */
  equation: string;

  /** Display style (inline or block) */
  displayMode?: boolean;

  /** Additional CSS classes */
  className?: string;

  /** Error callback */
  onError?: (error: Error) => void;

  /** Elements to highlight */
  highlightElements?: string[];

  /** Highlight color */
  highlightColor?: string;
}

/**
 * Props for EquationAnimator component
 */
export interface EquationAnimatorProps {
  /** The equation problem to animate */
  problem: EquationProblem;

  /** Animation configuration */
  config?: Partial<AnimationConfig>;

  /** Callback when animation step changes */
  onStepChange?: (stepIndex: number, step: EquationStep) => void;

  /** Callback when animation completes */
  onComplete?: () => void;

  /** Callback for interaction events */
  onInteraction?: (event: InteractionEvent) => void;
}

/**
 * Props for StepViewer component
 */
export interface StepViewerProps {
  /** Array of steps to display */
  steps: EquationStep[];

  /** Currently active step index */
  currentStep: number;

  /** Callback when step is selected */
  onStepSelect?: (stepIndex: number) => void;

  /** Whether to show step descriptions */
  showDescriptions?: boolean;

  /** Whether to show rule names */
  showRules?: boolean;
}

/**
 * Default animation configuration
 */
export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  transitionDuration: 800,
  stepDelay: 1500,
  easing: 'ease-in-out',
  autoPlay: false,
  loop: false,
  highlightColor: '#FFA726',
  speedMultiplier: 1.0,
};
