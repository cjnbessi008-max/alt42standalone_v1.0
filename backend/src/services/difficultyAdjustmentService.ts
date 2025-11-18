/**
 * Difficulty Adjustment Service
 *
 * Adaptive algorithm that adjusts problem difficulty based on:
 * - Student's accuracy rate
 * - Solution speed (relative to expected time)
 * - Recent performance trends
 *
 * Uses a modified Elo-rating approach combined with speed percentiles
 */

import { DifficultyLevel, DifficultyAdjustment, PerformanceMetrics, Attempt } from '../../../shared/types';

interface AdjustmentConfig {
  // Minimum attempts before adjusting difficulty
  minAttemptsBeforeAdjustment: number;

  // Number of recent attempts to consider
  recentAttemptsWindow: number;

  // Accuracy thresholds
  highAccuracyThreshold: number; // e.g., 0.85
  lowAccuracyThreshold: number; // e.g., 0.60

  // Speed thresholds (percentile)
  fastSpeedPercentile: number; // e.g., 75 (faster than 75% of students)
  slowSpeedPercentile: number; // e.g., 25

  // Weight factors for decision making
  accuracyWeight: number; // 0-1
  speedWeight: number; // 0-1
  trendWeight: number; // 0-1
}

const DEFAULT_CONFIG: AdjustmentConfig = {
  minAttemptsBeforeAdjustment: 5,
  recentAttemptsWindow: 10,
  highAccuracyThreshold: 0.85,
  lowAccuracyThreshold: 0.60,
  fastSpeedPercentile: 75,
  slowSpeedPercentile: 25,
  accuracyWeight: 0.5,
  speedWeight: 0.3,
  trendWeight: 0.2,
};

export class DifficultyAdjustmentService {
  private config: AdjustmentConfig;

  constructor(config: Partial<AdjustmentConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Determine recommended difficulty based on student's recent performance
   */
  public calculateRecommendedDifficulty(
    currentDifficulty: DifficultyLevel,
    recentAttempts: Attempt[],
    allAttempts: Attempt[],
    expectedTimesByDifficulty: Record<DifficultyLevel, number>
  ): DifficultyAdjustment {
    // Not enough data - maintain current difficulty
    if (recentAttempts.length < this.config.minAttemptsBeforeAdjustment) {
      return this.createAdjustment(
        currentDifficulty,
        currentDifficulty,
        'Insufficient data - maintaining current difficulty',
        { recentAccuracy: 0, averageSpeed: 0, speedPercentile: 50 }
      );
    }

    // Calculate metrics
    const recentAccuracy = this.calculateAccuracy(recentAttempts);
    const averageSpeed = this.calculateAverageSpeed(recentAttempts);
    const speedPercentile = this.calculateSpeedPercentile(
      averageSpeed,
      currentDifficulty,
      allAttempts,
      expectedTimesByDifficulty
    );
    const trend = this.calculateTrend(recentAttempts);

    // Calculate adjustment score
    const adjustmentScore = this.calculateAdjustmentScore(
      recentAccuracy,
      speedPercentile,
      trend
    );

    // Determine new difficulty
    const newDifficulty = this.determineNewDifficulty(
      currentDifficulty,
      adjustmentScore,
      recentAccuracy,
      speedPercentile
    );

    // Generate explanation
    const reason = this.generateReason(
      currentDifficulty,
      newDifficulty,
      recentAccuracy,
      speedPercentile,
      trend
    );

    return this.createAdjustment(
      currentDifficulty,
      newDifficulty,
      reason,
      { recentAccuracy, averageSpeed, speedPercentile }
    );
  }

  /**
   * Calculate accuracy rate from recent attempts
   */
  private calculateAccuracy(attempts: Attempt[]): number {
    if (attempts.length === 0) return 0;
    const correct = attempts.filter(a => a.isCorrect).length;
    return correct / attempts.length;
  }

  /**
   * Calculate average time spent on problems
   */
  private calculateAverageSpeed(attempts: Attempt[]): number {
    if (attempts.length === 0) return 0;
    const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
    return totalTime / attempts.length;
  }

  /**
   * Calculate speed percentile relative to expected time
   * Returns 0-100, where higher = faster than peers
   */
  private calculateSpeedPercentile(
    studentAvgSpeed: number,
    difficulty: DifficultyLevel,
    allAttempts: Attempt[],
    expectedTimes: Record<DifficultyLevel, number>
  ): number {
    const expectedTime = expectedTimes[difficulty] || 60; // default 60 seconds

    // Calculate z-score based on expected time
    // If student is faster than expected, percentile is higher
    const speedRatio = studentAvgSpeed / expectedTime;

    if (speedRatio <= 0.7) return 90; // Very fast (30% faster than expected)
    if (speedRatio <= 0.85) return 75; // Fast (15% faster)
    if (speedRatio <= 1.15) return 50; // Average
    if (speedRatio <= 1.3) return 25; // Slow (30% slower)
    return 10; // Very slow (>30% slower)
  }

  /**
   * Calculate performance trend from attempts
   * Returns 'improving', 'stable', or 'declining'
   */
  private calculateTrend(attempts: Attempt[]): 'improving' | 'stable' | 'declining' {
    if (attempts.length < 6) return 'stable';

    const halfPoint = Math.floor(attempts.length / 2);
    const firstHalf = attempts.slice(0, halfPoint);
    const secondHalf = attempts.slice(halfPoint);

    const firstAccuracy = this.calculateAccuracy(firstHalf);
    const secondAccuracy = this.calculateAccuracy(secondHalf);

    const difference = secondAccuracy - firstAccuracy;

    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Calculate overall adjustment score
   * Positive = increase difficulty, Negative = decrease difficulty
   */
  private calculateAdjustmentScore(
    accuracy: number,
    speedPercentile: number,
    trend: 'improving' | 'stable' | 'declining'
  ): number {
    // Accuracy contribution (-1 to +1)
    let accuracyScore = 0;
    if (accuracy >= this.config.highAccuracyThreshold) {
      accuracyScore = 1;
    } else if (accuracy <= this.config.lowAccuracyThreshold) {
      accuracyScore = -1;
    } else {
      // Linear interpolation between thresholds
      const range = this.config.highAccuracyThreshold - this.config.lowAccuracyThreshold;
      accuracyScore = ((accuracy - this.config.lowAccuracyThreshold) / range) * 2 - 1;
    }

    // Speed contribution (-1 to +1)
    let speedScore = 0;
    if (speedPercentile >= this.config.fastSpeedPercentile) {
      speedScore = 1;
    } else if (speedPercentile <= this.config.slowSpeedPercentile) {
      speedScore = -1;
    } else {
      // Linear interpolation
      const range = this.config.fastSpeedPercentile - this.config.slowSpeedPercentile;
      speedScore = ((speedPercentile - this.config.slowSpeedPercentile) / range) * 2 - 1;
    }

    // Trend contribution (-1 to +1)
    const trendScore = trend === 'improving' ? 0.5 : trend === 'declining' ? -0.5 : 0;

    // Weighted sum
    const totalScore =
      accuracyScore * this.config.accuracyWeight +
      speedScore * this.config.speedWeight +
      trendScore * this.config.trendWeight;

    return totalScore;
  }

  /**
   * Determine new difficulty level based on adjustment score
   */
  private determineNewDifficulty(
    currentDifficulty: DifficultyLevel,
    adjustmentScore: number,
    accuracy: number,
    speedPercentile: number
  ): DifficultyLevel {
    // Strong signal to increase (both high accuracy AND fast speed)
    if (
      adjustmentScore > 0.4 &&
      accuracy >= this.config.highAccuracyThreshold &&
      speedPercentile >= this.config.fastSpeedPercentile
    ) {
      return Math.min(5, currentDifficulty + 1) as DifficultyLevel;
    }

    // Strong signal to decrease (both low accuracy AND slow speed)
    if (
      adjustmentScore < -0.4 &&
      accuracy <= this.config.lowAccuracyThreshold &&
      speedPercentile <= this.config.slowSpeedPercentile
    ) {
      return Math.max(1, currentDifficulty - 1) as DifficultyLevel;
    }

    // Moderate signal to increase
    if (adjustmentScore > 0.6) {
      return Math.min(5, currentDifficulty + 1) as DifficultyLevel;
    }

    // Moderate signal to decrease
    if (adjustmentScore < -0.6) {
      return Math.max(1, currentDifficulty - 1) as DifficultyLevel;
    }

    // Maintain current difficulty
    return currentDifficulty;
  }

  /**
   * Generate human-readable reason for difficulty adjustment
   */
  private generateReason(
    oldDifficulty: DifficultyLevel,
    newDifficulty: DifficultyLevel,
    accuracy: number,
    speedPercentile: number,
    trend: 'improving' | 'stable' | 'declining'
  ): string {
    if (oldDifficulty === newDifficulty) {
      return `Maintaining difficulty level ${oldDifficulty}: Performance is appropriate for current level`;
    }

    const direction = newDifficulty > oldDifficulty ? 'Increased' : 'Decreased';
    const reasons: string[] = [];

    // Accuracy reason
    if (accuracy >= this.config.highAccuracyThreshold) {
      reasons.push(`high accuracy (${(accuracy * 100).toFixed(0)}%)`);
    } else if (accuracy <= this.config.lowAccuracyThreshold) {
      reasons.push(`low accuracy (${(accuracy * 100).toFixed(0)}%)`);
    }

    // Speed reason
    if (speedPercentile >= this.config.fastSpeedPercentile) {
      reasons.push(`fast solution speed (top ${100 - speedPercentile}%)`);
    } else if (speedPercentile <= this.config.slowSpeedPercentile) {
      reasons.push(`slow solution speed (bottom ${speedPercentile}%)`);
    }

    // Trend reason
    if (trend === 'improving') {
      reasons.push('improving performance trend');
    } else if (trend === 'declining') {
      reasons.push('declining performance trend');
    }

    const reasonText = reasons.length > 0 ? reasons.join(', ') : 'overall performance';
    return `${direction} difficulty from ${oldDifficulty} to ${newDifficulty}: ${reasonText}`;
  }

  /**
   * Create adjustment object
   */
  private createAdjustment(
    previousDifficulty: DifficultyLevel,
    newDifficulty: DifficultyLevel,
    reason: string,
    metrics: { recentAccuracy: number; averageSpeed: number; speedPercentile: number }
  ): DifficultyAdjustment {
    return {
      previousDifficulty,
      newDifficulty,
      reason,
      metrics,
      timestamp: new Date(),
    };
  }

  /**
   * Get expected solve times by difficulty (can be customized or learned from data)
   */
  public static getDefaultExpectedTimes(): Record<DifficultyLevel, number> {
    return {
      [DifficultyLevel.VERY_EASY]: 30,
      [DifficultyLevel.EASY]: 45,
      [DifficultyLevel.MEDIUM]: 60,
      [DifficultyLevel.HARD]: 90,
      [DifficultyLevel.VERY_HARD]: 120,
    };
  }
}

export default DifficultyAdjustmentService;
