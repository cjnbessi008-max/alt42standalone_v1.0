/**
 * Type definitions for Alt42 Standalone - Dot Expansion Feature
 * Integrated with Moodle LMS (MySQL 5.7, PHP 7.1.9, Moodle 3.7)
 */

// Moodle Problem/Question data structure
export interface MoodleProblem {
  id: number;
  questionText: string;
  questionType: 'multiple_choice' | 'calculation' | 'probability' | 'combination';
  difficulty: 1 | 2 | 3 | 4 | 5;
  possibilitiesCount: number; // 경우의 수
  options?: string[];
  correctAnswer?: string | number;
  metadata?: Record<string, any>;
}

// Dot visualization types
export type DotPattern = 'grid' | 'circle' | 'scatter' | 'tree' | 'pyramid';
export type DotColor = 'primary' | 'secondary' | 'success' | 'warning' | 'error';

export interface DotConfig {
  size: number; // dot diameter in pixels
  spacing: number; // spacing between dots
  color: DotColor;
  glowEffect: boolean;
  animationDuration: number; // in milliseconds
}

export interface DotExpansionProps {
  count: number; // number of dots to display (경우의 수)
  pattern?: DotPattern;
  config?: Partial<DotConfig>;
  maxDotsPerRow?: number;
  onDotClick?: (index: number) => void;
  animate?: boolean;
}

// Virtual Phone display
export interface VirtualPhoneProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  phoneModel?: 'iphone' | 'android';
  scale?: number;
  children: React.ReactNode;
}

// Moodle API Response
export interface MoodleApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Student interaction tracking
export interface InteractionEvent {
  type: 'dot_click' | 'expand' | 'collapse' | 'submit';
  timestamp: number;
  data: Record<string, any>;
}
