/**
 * Core types for Alt42 Standalone App with Moodle Integration
 */

/**
 * Term represents a single educational term/item from Moodle
 */
export interface Term {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
  order: number;
  metadata?: Record<string, any>;
}

/**
 * Question data from Moodle LMS
 */
export interface MoodleQuestion {
  id: number;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  options?: string[];
  correctAnswer?: string | number;
  points: number;
  category?: string;
}

/**
 * Module data from Moodle
 */
export interface MoodleModule {
  id: number;
  name: string;
  description: string;
  questions: MoodleQuestion[];
  terms: Term[];
}

/**
 * Animation direction for term slides
 */
export type SlideDirection = 'left' | 'right' | 'up' | 'down';

/**
 * Animation configuration
 */
export interface AnimationConfig {
  duration: number; // in seconds
  ease: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
  direction: SlideDirection;
}

/**
 * Smartphone display configuration
 */
export interface SmartphoneConfig {
  width: number;
  height: number;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  scale: number;
}

/**
 * App state
 */
export interface AppState {
  currentTermIndex: number;
  terms: Term[];
  isLoading: boolean;
  error: string | null;
  moodleConnected: boolean;
}
