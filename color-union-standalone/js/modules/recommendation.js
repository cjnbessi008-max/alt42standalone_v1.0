/**
 * AI-Based Recommendation System
 * Analyzes user performance and recommends personalized problems
 * Implements adaptive difficulty and targeted learning
 */

class RecommendationEngine {
    constructor() {
        this.difficultyLevels = ['beginner', 'easy', 'medium', 'hard', 'expert'];
        this.skillAreas = [
            'small_sets',      // Small set sizes (2-4 elements)
            'medium_sets',     // Medium set sizes (5-7 elements)
            'large_sets',      // Large set sizes (8-10 elements)
            'no_overlap',      // Sets with no common elements
            'partial_overlap', // Sets with some overlap
            'high_overlap',    // Sets with significant overlap
            'consecutive',     // Sets with consecutive numbers
            'scattered',       // Sets with scattered numbers
            'pattern_based'    // Sets following patterns
        ];
    }

    /**
     * Analyze user performance and generate recommendations
     */
    async analyzeAndRecommend(userId) {
        try {
            // Get user progress
            const progress = await storageManager.get('userProgress', userId);

            if (!progress) {
                // New user - start with beginner problems
                return this.generateBeginnerRecommendations();
            }

            // Get recent sessions and attempts
            const recentSessions = await this.getRecentSessions(userId, 5);
            const recentAttempts = await this.getRecentAttempts(userId, 20);

            // Analyze performance patterns
            const analysis = {
                overallAccuracy: this.calculateAccuracy(recentAttempts),
                averageTime: this.calculateAverageTime(recentAttempts),
                strengthAreas: await this.identifyStrengths(recentAttempts),
                weaknessAreas: await this.identifyWeaknesses(recentAttempts),
                learningTrend: this.analyzeLearningTrend(recentAttempts),
                difficultyLevel: this.assessDifficultyLevel(progress, recentAttempts),
                focusAreas: await this.determineFocusAreas(recentAttempts),
                recommendedPractice: []
            };

            // Generate personalized recommendations
            const recommendations = await this.generateRecommendations(analysis, progress);

            // Save recommendations
            await this.saveRecommendations(userId, recommendations, analysis);

            return recommendations;
        } catch (error) {
            console.error('Error in recommendation system:', error);
            return this.generateBeginnerRecommendations();
        }
    }

    /**
     * Generate beginner-level recommendations
     */
    generateBeginnerRecommendations() {
        return {
            difficulty: 'beginner',
            problemTypes: [
                { type: 'small_sets', weight: 0.5 },
                { type: 'no_overlap', weight: 0.3 },
                { type: 'partial_overlap', weight: 0.2 }
            ],
            setSize: { min: 2, max: 4 },
            valueRange: { min: 1, max: 10 },
            overlapRange: { min: 0, max: 1 },
            problemCount: 10,
            timeLimit: 300,
            hintsEnabled: true,
            reasoning: '초보 학습자를 위한 기본 문제부터 시작합니다.'
        };
    }

    /**
     * Calculate overall accuracy
     */
    calculateAccuracy(attempts) {
        if (attempts.length === 0) return 0;
        const correct = attempts.filter(a => a.isCorrect).length;
        return (correct / attempts.length) * 100;
    }

    /**
     * Calculate average time per problem
     */
    calculateAverageTime(attempts) {
        if (attempts.length === 0) return 0;
        const totalTime = attempts.reduce((sum, a) => sum + (a.timeSpent || 0), 0);
        return totalTime / attempts.length;
    }

    /**
     * Identify strength areas
     */
    async identifyStrengths(attempts) {
        const areaPerformance = {};

        for (const attempt of attempts) {
            const problem = await storageManager.get('problems', attempt.problemId);
            if (!problem) continue;

            const area = this.classifyProblem(problem);
            if (!areaPerformance[area]) {
                areaPerformance[area] = { correct: 0, total: 0 };
            }

            areaPerformance[area].total++;
            if (attempt.isCorrect) {
                areaPerformance[area].correct++;
            }
        }

        // Find areas with > 80% accuracy
        const strengths = [];
        for (const [area, stats] of Object.entries(areaPerformance)) {
            const accuracy = (stats.correct / stats.total) * 100;
            if (accuracy > 80 && stats.total >= 3) {
                strengths.push({
                    area: area,
                    accuracy: accuracy,
                    attempts: stats.total
                });
            }
        }

        return strengths.sort((a, b) => b.accuracy - a.accuracy);
    }

    /**
     * Identify weakness areas
     */
    async identifyWeaknesses(attempts) {
        const areaPerformance = {};

        for (const attempt of attempts) {
            const problem = await storageManager.get('problems', attempt.problemId);
            if (!problem) continue;

            const area = this.classifyProblem(problem);
            if (!areaPerformance[area]) {
                areaPerformance[area] = { correct: 0, total: 0 };
            }

            areaPerformance[area].total++;
            if (attempt.isCorrect) {
                areaPerformance[area].correct++;
            }
        }

        // Find areas with < 60% accuracy
        const weaknesses = [];
        for (const [area, stats] of Object.entries(areaPerformance)) {
            const accuracy = (stats.correct / stats.total) * 100;
            if (accuracy < 60 && stats.total >= 3) {
                weaknesses.push({
                    area: area,
                    accuracy: accuracy,
                    attempts: stats.total
                });
            }
        }

        return weaknesses.sort((a, b) => a.accuracy - b.accuracy);
    }

    /**
     * Classify problem into skill area
     */
    classifyProblem(problem) {
        const setASize = problem.setA.length;
        const setBSize = problem.setB.length;
        const overlapSize = this.calculateOverlap(problem.setA, problem.setB);

        // Classify by set size
        if (Math.max(setASize, setBSize) <= 4) {
            return 'small_sets';
        } else if (Math.max(setASize, setBSize) <= 7) {
            return 'medium_sets';
        } else {
            return 'large_sets';
        }

        // Can also classify by overlap, patterns, etc.
    }

    /**
     * Calculate overlap between two sets
     */
    calculateOverlap(setA, setB) {
        const intersection = setA.filter(x => setB.includes(x));
        return intersection.length;
    }

    /**
     * Analyze learning trend
     */
    analyzeLearningTrend(attempts) {
        if (attempts.length < 5) {
            return 'insufficient_data';
        }

        // Sort attempts by time
        const sortedAttempts = attempts.sort((a, b) =>
            new Date(a.attemptedAt) - new Date(b.attemptedAt)
        );

        // Split into two halves
        const midpoint = Math.floor(sortedAttempts.length / 2);
        const firstHalf = sortedAttempts.slice(0, midpoint);
        const secondHalf = sortedAttempts.slice(midpoint);

        const firstAccuracy = this.calculateAccuracy(firstHalf);
        const secondAccuracy = this.calculateAccuracy(secondHalf);

        const improvement = secondAccuracy - firstAccuracy;

        if (improvement > 10) return 'improving';
        if (improvement < -10) return 'declining';
        return 'stable';
    }

    /**
     * Assess appropriate difficulty level
     */
    assessDifficultyLevel(progress, recentAttempts) {
        const accuracy = this.calculateAccuracy(recentAttempts);
        const skillLevel = progress.skillLevel || 1;

        // Adaptive difficulty based on accuracy
        if (accuracy >= 90) {
            return this.increaseDifficulty(skillLevel);
        } else if (accuracy < 50) {
            return this.decreaseDifficulty(skillLevel);
        } else {
            return this.difficultyLevels[Math.min(skillLevel - 1, this.difficultyLevels.length - 1)];
        }
    }

    /**
     * Increase difficulty level
     */
    increaseDifficulty(currentLevel) {
        const currentIndex = Math.min(currentLevel - 1, this.difficultyLevels.length - 1);
        const nextIndex = Math.min(currentIndex + 1, this.difficultyLevels.length - 1);
        return this.difficultyLevels[nextIndex];
    }

    /**
     * Decrease difficulty level
     */
    decreaseDifficulty(currentLevel) {
        const currentIndex = Math.max(currentLevel - 1, 0);
        const prevIndex = Math.max(currentIndex - 1, 0);
        return this.difficultyLevels[prevIndex];
    }

    /**
     * Determine focus areas for practice
     */
    async determineFocusAreas(recentAttempts) {
        const weaknesses = await this.identifyWeaknesses(recentAttempts);

        if (weaknesses.length > 0) {
            // Focus on weaknesses
            return weaknesses.map(w => ({
                area: w.area,
                priority: 1 - (w.accuracy / 100), // Lower accuracy = higher priority
                reason: `정확도 ${w.accuracy.toFixed(1)}% - 집중 학습 필요`
            }));
        } else {
            // Expand to new areas
            return [
                {
                    area: 'large_sets',
                    priority: 0.7,
                    reason: '더 복잡한 문제로 도전'
                }
            ];
        }
    }

    /**
     * Generate personalized recommendations
     */
    async generateRecommendations(analysis, progress) {
        const recommendations = {
            difficulty: analysis.difficultyLevel,
            problemTypes: [],
            setSize: { min: 2, max: 4 },
            valueRange: { min: 1, max: 20 },
            overlapRange: { min: 0, max: 3 },
            problemCount: 10,
            timeLimit: 300,
            hintsEnabled: analysis.overallAccuracy < 70,
            reasoning: this.generateReasoning(analysis)
        };

        // Adjust set size based on difficulty
        switch (analysis.difficultyLevel) {
            case 'beginner':
                recommendations.setSize = { min: 2, max: 4 };
                recommendations.valueRange = { min: 1, max: 10 };
                break;
            case 'easy':
                recommendations.setSize = { min: 3, max: 5 };
                recommendations.valueRange = { min: 1, max: 15 };
                break;
            case 'medium':
                recommendations.setSize = { min: 4, max: 7 };
                recommendations.valueRange = { min: 1, max: 20 };
                break;
            case 'hard':
                recommendations.setSize = { min: 6, max: 9 };
                recommendations.valueRange = { min: 1, max: 30 };
                break;
            case 'expert':
                recommendations.setSize = { min: 8, max: 12 };
                recommendations.valueRange = { min: 1, max: 50 };
                break;
        }

        // Prioritize problem types based on weaknesses
        if (analysis.weaknessAreas.length > 0) {
            // 70% weakness areas, 30% mixed
            const weaknessWeight = 0.7 / analysis.weaknessAreas.length;
            analysis.weaknessAreas.forEach(weakness => {
                recommendations.problemTypes.push({
                    type: weakness.area,
                    weight: weaknessWeight
                });
            });

            // Add some variety
            recommendations.problemTypes.push({
                type: 'mixed',
                weight: 0.3
            });
        } else {
            // Balanced mix for practice
            recommendations.problemTypes = [
                { type: 'small_sets', weight: 0.3 },
                { type: 'medium_sets', weight: 0.4 },
                { type: 'large_sets', weight: 0.3 }
            ];
        }

        return recommendations;
    }

    /**
     * Generate reasoning text
     */
    generateReasoning(analysis) {
        const parts = [];

        parts.push(`현재 정확도: ${analysis.overallAccuracy.toFixed(1)}%`);

        if (analysis.learningTrend === 'improving') {
            parts.push('실력이 향상되고 있습니다! 👏');
        } else if (analysis.learningTrend === 'declining') {
            parts.push('좀 더 기초를 다져보세요.');
        }

        if (analysis.weaknessAreas.length > 0) {
            const weakArea = analysis.weaknessAreas[0].area;
            parts.push(`${weakArea} 영역 집중 학습을 권장합니다.`);
        }

        return parts.join(' ');
    }

    /**
     * Save recommendations
     */
    async saveRecommendations(userId, recommendations, analysis) {
        const record = {
            userId: userId,
            recommendations: recommendations,
            analysis: analysis,
            createdAt: new Date().toISOString(),
            applied: false
        };

        await storageManager.add('recommendations', record);
    }

    /**
     * Get recent sessions
     */
    async getRecentSessions(userId, count = 5) {
        const sessions = await storageManager.getAllByIndex('sessions', 'userId', userId);
        return sessions
            .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
            .slice(0, count);
    }

    /**
     * Get recent attempts
     */
    async getRecentAttempts(userId, count = 20) {
        const attempts = await storageManager.getAllByIndex('attempts', 'userId', userId);
        return attempts
            .sort((a, b) => new Date(b.attemptedAt) - new Date(a.attemptedAt))
            .slice(0, count);
    }

    /**
     * Update user skill level based on performance
     */
    async updateSkillLevel(userId) {
        const progress = await storageManager.get('userProgress', userId);
        if (!progress) return;

        const recentAttempts = await this.getRecentAttempts(userId, 20);
        const accuracy = this.calculateAccuracy(recentAttempts);

        // Calculate new skill level
        let newLevel = progress.skillLevel || 1;

        if (accuracy >= 90 && recentAttempts.length >= 10) {
            newLevel = Math.min(newLevel + 1, 5);
        } else if (accuracy < 50 && recentAttempts.length >= 10) {
            newLevel = Math.max(newLevel - 1, 1);
        }

        if (newLevel !== progress.skillLevel) {
            progress.skillLevel = newLevel;
            progress.experiencePoints += (newLevel - progress.skillLevel) * 100;
            await storageManager.update('userProgress', progress);
        }
    }
}

// Create singleton instance
const recommendationEngine = new RecommendationEngine();
