/**
 * Scoring Algorithm
 * 고난도에서도 안정적인 집중 상태 유지 점수 계산
 */

class ScoringEngine {
    constructor(options = {}) {
        this.config = {
            // Weights for final score calculation
            focusWeight: options.focusWeight || 0.6,
            stabilityWeight: options.stabilityWeight || 0.2,
            accuracyWeight: options.accuracyWeight || 0.2,

            // Difficulty multipliers
            difficultyWeights: options.difficultyWeights || {
                1: 1.0,  // 쉬움
                2: 1.2,  // 기본
                3: 1.5,  // 중급
                4: 1.8,  // 고급
                5: 2.0   // 매우 어려움 (고난도)
            }
        };
    }

    /**
     * Calculate final score from focus metrics and accuracy
     *
     * @param {Object} metrics - Focus tracking metrics
     * @param {Number} accuracyRate - Percentage (0-100)
     * @param {Number} difficulty - Difficulty level (1-5)
     * @returns {Object} Score breakdown
     */
    calculateFinalScore(metrics, accuracyRate, difficulty = 1) {
        const focusScore = this.calculateFocusScore(metrics);
        const stabilityScore = this.calculateStabilityScore(metrics);
        const difficultyMultiplier = this.config.difficultyWeights[difficulty] || 1.0;

        // Apply weights
        const weightedFocus = focusScore * this.config.focusWeight;
        const weightedStability = stabilityScore * this.config.stabilityWeight;
        const weightedAccuracy = accuracyRate * this.config.accuracyWeight;

        // Base score (0-100)
        const baseScore = weightedFocus + weightedStability + weightedAccuracy;

        // Final score with difficulty multiplier
        const finalScore = Math.min(100, baseScore * difficultyMultiplier);

        return {
            final_score: Math.round(finalScore * 10) / 10,
            focus_score: Math.round(focusScore * 10) / 10,
            stability_score: Math.round(stabilityScore * 10) / 10,
            accuracy_rate: accuracyRate,
            difficulty_level: difficulty,
            difficulty_multiplier: difficultyMultiplier,
            breakdown: {
                weighted_focus: Math.round(weightedFocus * 10) / 10,
                weighted_stability: Math.round(weightedStability * 10) / 10,
                weighted_accuracy: Math.round(weightedAccuracy * 10) / 10
            }
        };
    }

    /**
     * Calculate focus score from metrics
     * Based on attention ratio and activity
     */
    calculateFocusScore(metrics) {
        const attentionScore = metrics.attention_score || 0;
        const activityRatio = metrics.activity_ratio || 0;

        // Combine attention and activity
        const focusScore = (attentionScore * 0.7) + (activityRatio * 100 * 0.3);

        return Math.max(0, Math.min(100, focusScore));
    }

    /**
     * Calculate stability score
     * 고난도에서도 집중도가 안정적으로 유지되는지 측정
     *
     * Higher stability = lower variance in focus periods
     */
    calculateStabilityScore(metrics) {
        const focusPeriods = metrics.focus_periods || [];

        if (focusPeriods.length === 0) {
            return 0;
        }

        if (focusPeriods.length === 1) {
            // Single focus period = perfect stability
            return 100;
        }

        // Calculate variance
        const variance = this.calculateVariance(focusPeriods);

        // Convert variance to stability score (inverse relationship)
        // Lower variance = higher stability
        const stabilityScore = variance > 0 ? Math.min(100, 100 / (1 + variance / 1000)) : 100;

        return stabilityScore;
    }

    /**
     * Calculate variance of an array
     */
    calculateVariance(values) {
        if (values.length === 0) return 0;

        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;

        return variance;
    }

    /**
     * Calculate standard deviation
     */
    calculateStdDev(values) {
        return Math.sqrt(this.calculateVariance(values));
    }

    /**
     * Get performance rating based on final score
     */
    getPerformanceRating(finalScore) {
        if (finalScore >= 90) return { rating: 'excellent', label: '탁월', color: '#10b981' };
        if (finalScore >= 80) return { rating: 'great', label: '우수', color: '#3b82f6' };
        if (finalScore >= 70) return { rating: 'good', label: '양호', color: '#8b5cf6' };
        if (finalScore >= 60) return { rating: 'fair', label: '보통', color: '#f59e0b' };
        if (finalScore >= 50) return { rating: 'needs_improvement', label: '노력 필요', color: '#ef4444' };
        return { rating: 'poor', label: '개선 필요', color: '#dc2626' };
    }

    /**
     * Analyze performance trends
     * Compare current session with previous sessions
     */
    analyzeTrends(currentScore, historicalScores) {
        if (!historicalScores || historicalScores.length === 0) {
            return {
                trend: 'neutral',
                improvement: 0,
                message: '첫 세션입니다. 계속 학습하세요!'
            };
        }

        const avgHistorical = historicalScores.reduce((a, b) => a + b, 0) / historicalScores.length;
        const improvement = currentScore - avgHistorical;

        let trend, message;

        if (improvement > 10) {
            trend = 'improving_fast';
            message = '🎉 큰 폭으로 향상되었습니다!';
        } else if (improvement > 5) {
            trend = 'improving';
            message = '📈 점수가 상승하고 있습니다!';
        } else if (improvement > -5) {
            trend = 'stable';
            message = '✨ 안정적인 성적을 유지하고 있습니다.';
        } else if (improvement > -10) {
            trend = 'declining';
            message = '📉 집중력이 약간 떨어졌습니다.';
        } else {
            trend = 'declining_fast';
            message = '⚠️ 휴식이 필요할 수 있습니다.';
        }

        return {
            trend,
            improvement: Math.round(improvement * 10) / 10,
            average_historical: Math.round(avgHistorical * 10) / 10,
            message
        };
    }

    /**
     * Get difficulty-specific feedback
     * 고난도에서 안정적 집중 유지를 위한 피드백
     */
    getDifficultyFeedback(scores, difficulty) {
        const { focus_score, stability_score, accuracy_rate } = scores;

        const feedback = [];

        // 고난도 (4-5)에 특화된 피드백
        if (difficulty >= 4) {
            if (stability_score < 70) {
                feedback.push({
                    type: 'warning',
                    category: 'stability',
                    message: '고난도 문제에서 집중도가 불안정합니다. 문제를 작은 단계로 나누어 풀어보세요.',
                    icon: '⚠️'
                });
            } else if (stability_score >= 85) {
                feedback.push({
                    type: 'success',
                    category: 'stability',
                    message: '고난도 문제에서도 안정적인 집중을 유지하고 있습니다!',
                    icon: '🌟'
                });
            }

            if (focus_score < 60) {
                feedback.push({
                    type: 'warning',
                    category: 'focus',
                    message: '어려운 문제일수록 집중이 중요합니다. 잠시 휴식 후 다시 시도해보세요.',
                    icon: '🧘'
                });
            }
        }

        // 일반 피드백
        if (focus_score >= 80 && stability_score >= 80 && accuracy_rate >= 80) {
            feedback.push({
                type: 'success',
                category: 'overall',
                message: '완벽합니다! 집중도, 안정성, 정확도 모두 우수합니다.',
                icon: '🏆'
            });
        }

        if (accuracy_rate < 50) {
            feedback.push({
                type: 'info',
                category: 'accuracy',
                message: '정확도를 높이기 위해 문제를 천천히 읽고 검토해보세요.',
                icon: '📖'
            });
        }

        if (focus_score >= 85) {
            feedback.push({
                type: 'success',
                category: 'focus',
                message: '높은 집중력을 보여주고 있습니다!',
                icon: '⭐'
            });
        }

        return feedback;
    }

    /**
     * Calculate session summary
     */
    calculateSessionSummary(sessionData) {
        const {
            total_problems,
            correct_problems,
            focus_metrics,
            difficulty_level,
            duration_seconds
        } = sessionData;

        const accuracyRate = total_problems > 0
            ? (correct_problems / total_problems) * 100
            : 0;

        const scores = this.calculateFinalScore(
            focus_metrics,
            accuracyRate,
            difficulty_level
        );

        const rating = this.getPerformanceRating(scores.final_score);
        const feedback = this.getDifficultyFeedback(scores, difficulty_level);

        return {
            scores,
            rating,
            feedback,
            statistics: {
                total_problems,
                correct_problems,
                accuracy_rate: Math.round(accuracyRate * 10) / 10,
                duration_minutes: Math.round(duration_seconds / 60 * 10) / 10,
                avg_time_per_problem: total_problems > 0
                    ? Math.round(duration_seconds / total_problems)
                    : 0
            }
        };
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScoringEngine;
}
