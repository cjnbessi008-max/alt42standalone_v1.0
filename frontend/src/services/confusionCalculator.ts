/**
 * Confusion Level Calculator Service
 *
 * Calculates student confusion levels based on behavioral metrics
 * using a weighted scoring algorithm.
 */

import {
  BehaviorMetrics,
  ConfusionLevel,
  ConfusionCategory,
  ConfusionColor,
  ConfusionWeights,
  ConceptConfusion,
} from '../types/confusion';

/**
 * Default weights for confusion calculation
 */
const DEFAULT_WEIGHTS: ConfusionWeights = {
  timeSpent: 0.25,
  attemptCount: 0.20,
  incorrectness: 0.20,
  hesitation: 0.15,
  helpRequests: 0.10,
  mouseMovement: 0.05,
  inputChanges: 0.05,
};

/**
 * Thresholds for different metrics (normalized to 0-1 scale)
 */
const METRIC_THRESHOLDS = {
  timeSpent: {
    expected: 60,      // Expected time in seconds
    max: 300,          // Maximum time before maximal confusion
  },
  attemptCount: {
    expected: 1,       // Expected attempts
    max: 5,            // Maximum attempts
  },
  hesitation: {
    expected: 5,       // Expected hesitation time
    max: 30,           // Maximum hesitation time
  },
  helpRequests: {
    expected: 0,       // Expected help requests
    max: 3,            // Maximum help requests
  },
  mouseMovement: {
    expected: 20,      // Expected movement score
    max: 100,          // Maximum movement score (erratic)
  },
  inputChanges: {
    expected: 2,       // Expected input changes
    max: 10,           // Maximum input changes
  },
};

/**
 * Calculate confusion level from behavior metrics
 */
export function calculateConfusionLevel(
  metrics: BehaviorMetrics,
  weights: ConfusionWeights = DEFAULT_WEIGHTS
): ConfusionLevel {
  // Normalize each metric to 0-1 scale
  const normalizedTimeSpent = normalizeMetric(
    metrics.timeSpent,
    METRIC_THRESHOLDS.timeSpent.expected,
    METRIC_THRESHOLDS.timeSpent.max
  );

  const normalizedAttempts = normalizeMetric(
    metrics.attemptCount,
    METRIC_THRESHOLDS.attemptCount.expected,
    METRIC_THRESHOLDS.attemptCount.max
  );

  const normalizedHesitation = normalizeMetric(
    metrics.hesitationTime,
    METRIC_THRESHOLDS.hesitation.expected,
    METRIC_THRESHOLDS.hesitation.max
  );

  const normalizedHelpRequests = normalizeMetric(
    metrics.helpRequestCount,
    METRIC_THRESHOLDS.helpRequests.expected,
    METRIC_THRESHOLDS.helpRequests.max
  );

  const normalizedMouseMovement = normalizeMetric(
    metrics.mouseMovementScore,
    METRIC_THRESHOLDS.mouseMovement.expected,
    METRIC_THRESHOLDS.mouseMovement.max
  );

  const normalizedInputChanges = normalizeMetric(
    metrics.inputChangeCount,
    METRIC_THRESHOLDS.inputChanges.expected,
    METRIC_THRESHOLDS.inputChanges.max
  );

  // Incorrectness: 0 if correct, 1 if incorrect
  const incorrectnessScore = metrics.isCorrect ? 0 : 1;

  // Calculate weighted confusion score
  const confusionScore =
    normalizedTimeSpent * weights.timeSpent +
    normalizedAttempts * weights.attemptCount +
    incorrectnessScore * weights.incorrectness +
    normalizedHesitation * weights.hesitation +
    normalizedHelpRequests * weights.helpRequests +
    normalizedMouseMovement * weights.mouseMovement +
    normalizedInputChanges * weights.inputChanges;

  // Convert to 0-100 scale
  return Math.min(100, Math.max(0, Math.round(confusionScore * 100)));
}

/**
 * Normalize a metric value to 0-1 scale
 */
function normalizeMetric(value: number, expected: number, max: number): number {
  if (value <= expected) {
    return 0; // No confusion if within expected range
  }

  if (value >= max) {
    return 1; // Maximum confusion if exceeds max threshold
  }

  // Linear interpolation between expected and max
  return (value - expected) / (max - expected);
}

/**
 * Categorize confusion level
 */
export function categorizeConfusion(level: ConfusionLevel): ConfusionCategory {
  if (level <= 20) return ConfusionCategory.VERY_LOW;
  if (level <= 40) return ConfusionCategory.LOW;
  if (level <= 60) return ConfusionCategory.MEDIUM;
  if (level <= 80) return ConfusionCategory.HIGH;
  return ConfusionCategory.VERY_HIGH;
}

/**
 * Get color for confusion level
 */
export function getConfusionColor(category: ConfusionCategory): ConfusionColor {
  const colorMap: Record<ConfusionCategory, ConfusionColor> = {
    [ConfusionCategory.VERY_LOW]: ConfusionColor.VERY_LOW,
    [ConfusionCategory.LOW]: ConfusionColor.LOW,
    [ConfusionCategory.MEDIUM]: ConfusionColor.MEDIUM,
    [ConfusionCategory.HIGH]: ConfusionColor.HIGH,
    [ConfusionCategory.VERY_HIGH]: ConfusionColor.VERY_HIGH,
  };

  return colorMap[category];
}

/**
 * Determine if student needs intervention
 */
export function needsIntervention(
  confusionLevel: ConfusionLevel,
  duration: number // in seconds
): boolean {
  // High confusion for extended period requires intervention
  if (confusionLevel >= 70 && duration >= 120) {
    return true;
  }

  // Very high confusion requires immediate intervention
  if (confusionLevel >= 85) {
    return true;
  }

  return false;
}

/**
 * Calculate average confusion from multiple data points
 */
export function calculateAverageConfusion(levels: ConfusionLevel[]): ConfusionLevel {
  if (levels.length === 0) return 0;

  const sum = levels.reduce((acc, level) => acc + level, 0);
  return Math.round(sum / levels.length);
}

/**
 * Build complete concept confusion object
 */
export function buildConceptConfusion(
  conceptId: string,
  conceptName: string,
  metrics: BehaviorMetrics,
  history: Array<{ timestamp: Date; confusionLevel: ConfusionLevel }>
): ConceptConfusion {
  const confusionLevel = calculateConfusionLevel(metrics);
  const category = categorizeConfusion(confusionLevel);
  const color = getConfusionColor(category);

  return {
    conceptId,
    conceptName,
    confusionLevel,
    category,
    color,
    metrics,
    history: history.map((h) => ({
      timestamp: h.timestamp,
      confusionLevel: h.confusionLevel,
      category: categorizeConfusion(h.confusionLevel),
      conceptId,
    })),
  };
}

/**
 * Get text description for confusion category
 */
export function getConfusionDescription(category: ConfusionCategory): string {
  const descriptions: Record<ConfusionCategory, string> = {
    [ConfusionCategory.VERY_LOW]: '매우 잘 이해하고 있습니다',
    [ConfusionCategory.LOW]: '대체로 이해하고 있습니다',
    [ConfusionCategory.MEDIUM]: '약간의 어려움을 겪고 있습니다',
    [ConfusionCategory.HIGH]: '많은 어려움을 겪고 있습니다',
    [ConfusionCategory.VERY_HIGH]: '즉각적인 도움이 필요합니다',
  };

  return descriptions[category];
}

/**
 * Export confusion calculator utilities
 */
export const confusionUtils = {
  calculateConfusionLevel,
  categorizeConfusion,
  getConfusionColor,
  needsIntervention,
  calculateAverageConfusion,
  buildConceptConfusion,
  getConfusionDescription,
};
