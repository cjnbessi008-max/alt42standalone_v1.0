/**
 * Recommendation Engine
 * AI-powered adaptive learning system
 */

class RecommendationEngine {
    /**
     * Calculate next recommended difficulty based on user performance
     * @param {Object} userProfile - User profile data
     * @param {Array} recentAttempts - Recent attempt history
     * @returns {number} Recommended difficulty (1-5)
     */
    static calculateDifficulty(userProfile, recentAttempts = []) {
        const currentDifficulty = userProfile.last_difficulty || 3;

        if (recentAttempts.length === 0) {
            return currentDifficulty;
        }

        // Analyze recent performance (last 5 attempts)
        const recent = recentAttempts.slice(0, 5);
        const correctCount = recent.filter(a => a.is_correct).length;
        const accuracy = correctCount / recent.length;

        // Calculate average time spent
        const avgTime = recent.reduce((sum, a) => sum + a.time_spent, 0) / recent.length;
        const speedFactor = avgTime < 30 ? 1.2 : (avgTime < 60 ? 1.0 : 0.8);

        // Adaptive difficulty adjustment
        let newDifficulty = currentDifficulty;

        if (accuracy >= 0.8 && speedFactor >= 1.0) {
            // Excellent performance - increase difficulty
            newDifficulty = Math.min(currentDifficulty + 1, 5);
        } else if (accuracy >= 0.6) {
            // Good performance - maintain difficulty
            newDifficulty = currentDifficulty;
        } else if (accuracy < 0.4) {
            // Poor performance - decrease difficulty
            newDifficulty = Math.max(currentDifficulty - 1, 1);
        }

        return newDifficulty;
    }

    /**
     * Recommend sequence type based on user preferences and performance
     * @param {Object} userProfile - User profile
     * @param {Array} attempts - Attempt history
     * @returns {string} Recommended sequence type
     */
    static recommendSequenceType(userProfile, attempts = []) {
        const preferred = userProfile.preferred_sequence_type || 'arithmetic';

        if (attempts.length < 10) {
            // Early learning phase - stick to preference
            return preferred;
        }

        // Analyze performance by sequence type
        const typePerformance = {};
        attempts.forEach(attempt => {
            const type = attempt.sequence_type;
            if (!typePerformance[type]) {
                typePerformance[type] = { correct: 0, total: 0 };
            }
            typePerformance[type].total++;
            if (attempt.is_correct) {
                typePerformance[type].correct++;
            }
        });

        // Find weakest type to practice
        let weakestType = preferred;
        let lowestAccuracy = 1.0;

        Object.keys(typePerformance).forEach(type => {
            const accuracy = typePerformance[type].correct / typePerformance[type].total;
            if (accuracy < lowestAccuracy) {
                lowestAccuracy = accuracy;
                weakestType = type;
            }
        });

        // 70% chance for weak area, 30% for preferred
        return Math.random() < 0.7 ? weakestType : preferred;
    }

    /**
     * Generate personalized problem recommendation
     * @param {Object} userProfile - User profile
     * @param {Array} recentAttempts - Recent attempts
     * @returns {Object} Recommendation with type and difficulty
     */
    static getRecommendation(userProfile, recentAttempts = []) {
        const difficulty = this.calculateDifficulty(userProfile, recentAttempts);
        const sequenceType = this.recommendSequenceType(userProfile, recentAttempts);

        // Calculate recommendation score (0-1)
        const score = this.calculateRecommendationScore(userProfile, difficulty, sequenceType);

        // Generate reason
        const reason = this.generateReason(difficulty, sequenceType, userProfile);

        return {
            difficulty,
            sequence_type: sequenceType,
            recommendation_score: score,
            reason
        };
    }

    /**
     * Calculate recommendation confidence score
     * @param {Object} userProfile - User profile
     * @param {number} difficulty - Recommended difficulty
     * @param {string} sequenceType - Recommended type
     * @returns {number} Score 0-1
     */
    static calculateRecommendationScore(userProfile, difficulty, sequenceType) {
        const levelMatch = 1 - (Math.abs(userProfile.current_level - difficulty) / 5);
        const typeMatch = userProfile.preferred_sequence_type === sequenceType ? 1.0 : 0.7;
        const speedFactor = Math.min(userProfile.learning_speed, 1.5) / 1.5;

        return ((levelMatch * 0.4) + (typeMatch * 0.3) + (speedFactor * 0.3));
    }

    /**
     * Generate human-readable recommendation reason
     * @param {number} difficulty - Difficulty level
     * @param {string} sequenceType - Sequence type
     * @param {Object} userProfile - User profile
     * @returns {string} Reason text
     */
    static generateReason(difficulty, sequenceType, userProfile) {
        const difficultyNames = {
            1: 'very easy',
            2: 'easy',
            3: 'medium',
            4: 'hard',
            5: 'very hard'
        };

        const reasons = [];

        if (difficulty > userProfile.last_difficulty) {
            reasons.push('You\'re ready for a challenge!');
        } else if (difficulty < userProfile.last_difficulty) {
            reasons.push('Let\'s build confidence with easier problems.');
        } else {
            reasons.push('Continuing at your current level.');
        }

        reasons.push(`Difficulty: ${difficultyNames[difficulty]}`);
        reasons.push(`Type: ${sequenceType} sequence`);

        return reasons.join(' ');
    }

    /**
     * Update learning speed based on performance
     * @param {Object} userProfile - User profile
     * @param {Array} recentAttempts - Recent attempts
     * @returns {number} Updated learning speed
     */
    static updateLearningSpeed(userProfile, recentAttempts) {
        if (recentAttempts.length < 5) {
            return userProfile.learning_speed;
        }

        const recent = recentAttempts.slice(0, 10);
        const avgTime = recent.reduce((sum, a) => sum + a.time_spent, 0) / recent.length;
        const accuracy = recent.filter(a => a.is_correct).length / recent.length;

        // Fast and accurate = higher learning speed
        let speed = userProfile.learning_speed;

        if (avgTime < 30 && accuracy >= 0.8) {
            speed = Math.min(speed + 0.1, 2.0);
        } else if (avgTime > 90 || accuracy < 0.5) {
            speed = Math.max(speed - 0.1, 0.5);
        }

        return parseFloat(speed.toFixed(2));
    }

    /**
     * Check if user deserves an achievement
     * @param {Object} userProfile - User profile
     * @param {Array} attempts - All attempts
     * @returns {Array} New achievements
     */
    static checkAchievements(userProfile, attempts) {
        const achievements = [];

        // Streak achievements
        if (userProfile.current_streak === 5) {
            achievements.push({
                type: 'streak',
                name: '5 in a Row!',
                description: 'Solved 5 problems correctly in a row'
            });
        } else if (userProfile.current_streak === 10) {
            achievements.push({
                type: 'streak',
                name: 'Perfect Ten!',
                description: 'Solved 10 problems correctly in a row'
            });
        }

        // Milestone achievements
        if (userProfile.total_problems_solved === 10) {
            achievements.push({
                type: 'milestone',
                name: 'Getting Started',
                description: 'Solved your first 10 problems'
            });
        } else if (userProfile.total_problems_solved === 50) {
            achievements.push({
                type: 'milestone',
                name: 'Halfway There',
                description: 'Solved 50 problems'
            });
        } else if (userProfile.total_problems_solved === 100) {
            achievements.push({
                type: 'milestone',
                name: 'Century!',
                description: 'Solved 100 problems'
            });
        }

        // Speed achievements
        const recentFast = attempts.slice(0, 5).filter(a => a.time_spent < 20 && a.is_correct);
        if (recentFast.length === 5) {
            achievements.push({
                type: 'speed',
                name: 'Lightning Fast',
                description: 'Solved 5 problems in under 20 seconds each'
            });
        }

        return achievements;
    }
}

module.exports = RecommendationEngine;
