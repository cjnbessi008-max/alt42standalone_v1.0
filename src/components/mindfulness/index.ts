/**
 * Mindfulness Routine Components for LMS
 *
 * This module provides components for integrating mindfulness routines
 * between problem transitions in learning management systems.
 *
 * @module mindfulness
 */

export { MindfulnessRoutine } from './MindfulnessRoutine';
export type { MindfulnessRoutineProps } from './MindfulnessRoutine';

export { ProblemNavigator } from './ProblemNavigator';
export type {
  ProblemNavigatorProps,
  Problem,
  MindfulnessSettings
} from './ProblemNavigator';

export { MindfulnessSettings } from './MindfulnessSettings';
export type { MindfulnessSettingsProps } from './MindfulnessSettings';

export { useMindfulness } from './useMindfulness';
export type {
  MindfulnessConfig,
  UseMindfulnessOptions
} from './useMindfulness';
