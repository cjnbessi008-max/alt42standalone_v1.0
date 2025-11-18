/**
 * AI-Based Learning Recommendation Engine
 * Analyzes learning patterns from Curvy Log data and provides personalized recommendations
 */

class RecommendationEngine {
    constructor(options = {}) {
        this.config = {
            minDataPoints: options.minDataPoints || 5,
            confidenceThreshold: options.confidenceThreshold || 0.6,
            maxRecommendations: options.maxRecommendations || 5,
            lookbackPeriod: options.lookbackPeriod || 30, // days
            ...options
        };

        this.learningPatterns = null;
        this.userProfile = null;
        this.recommendations = [];
    }

    /**
     * Analyze user learning data and generate recommendations
     */
    async generateRecommendations(userData) {
        if (!userData || userData.length < this.config.minDataPoints) {
            return {
                success: false,
                error: 'Insufficient data for recommendations',
                recommendations: []
            };
        }

        try {
            // Step 1: Analyze learning patterns
            this.learningPatterns = this.analyzeLearningPatterns(userData);

            // Step 2: Build user profile
            this.userProfile = this.buildUserProfile(userData);

            // Step 3: Calculate learning trajectory
            const trajectory = this.calculateLearningTrajectory(userData);

            // Step 4: Identify weak areas
            const weakAreas = this.identifyWeakAreas(userData);

            // Step 5: Detect learning plateaus
            const plateaus = this.detectPlateaus(userData);

            // Step 6: Generate personalized recommendations
            this.recommendations = this.createRecommendations({
                patterns: this.learningPatterns,
                profile: this.userProfile,
                trajectory,
                weakAreas,
                plateaus
            });

            return {
                success: true,
                recommendations: this.recommendations,
                insights: {
                    learningRate: trajectory.slope,
                    consistency: this.learningPatterns.consistency,
                    strongAreas: this.learningPatterns.strongAreas,
                    weakAreas,
                    plateaus
                }
            };

        } catch (error) {
            console.error('Recommendation generation failed:', error);
            return {
                success: false,
                error: error.message,
                recommendations: []
            };
        }
    }

    /**
     * Analyze learning patterns from historical data
     */
    analyzeLearningPatterns(data) {
        const scores = data.map(d => d.rawScore || d.y).filter(s => s != null);

        // Calculate statistics
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);

        // Detect trends
        const trend = this.detectTrend(scores);

        // Calculate consistency (inverse of coefficient of variation)
        const consistency = mean > 0 ? 1 - (stdDev / mean) : 0;

        // Identify strong and weak performance areas
        const threshold = mean;
        const strongAreas = data.filter(d => (d.rawScore || d.y) > threshold);
        const weakAreasData = data.filter(d => (d.rawScore || d.y) <= threshold);

        return {
            mean,
            median: this.calculateMedian(scores),
            stdDev,
            variance,
            trend,
            consistency: Math.max(0, Math.min(1, consistency)),
            strongAreas: strongAreas.map(d => d.quizName || d.event).filter(Boolean),
            totalAttempts: data.length,
            scoreRange: {
                min: Math.min(...scores),
                max: Math.max(...scores)
            }
        };
    }

    /**
     * Build comprehensive user profile
     */
    buildUserProfile(data) {
        const now = Date.now() / 1000;
        const recentData = data.filter(d =>
            d.timestamp && (now - d.timestamp) < (this.config.lookbackPeriod * 86400)
        );

        // Calculate study frequency
        const timestamps = data.map(d => d.timestamp).filter(Boolean).sort();
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1]);
        }
        const avgInterval = intervals.length > 0
            ? intervals.reduce((a, b) => a + b, 0) / intervals.length
            : 0;

        // Determine learning style based on patterns
        const learningStyle = this.determineLearningStyle(data);

        // Calculate engagement level
        const engagement = this.calculateEngagement(data, recentData);

        return {
            totalActivities: data.length,
            recentActivities: recentData.length,
            averageStudyInterval: avgInterval,
            studyFrequency: avgInterval > 0 ? 86400 / avgInterval : 0, // activities per day
            learningStyle,
            engagement,
            preferredDifficulty: this.estimatePreferredDifficulty(data),
            lastActivityTime: Math.max(...timestamps)
        };
    }

    /**
     * Calculate learning trajectory (slope of improvement)
     */
    calculateLearningTrajectory(data) {
        if (data.length < 2) {
            return { slope: 0, intercept: 0, r2: 0 };
        }

        const n = data.length;
        const x = data.map((_, i) => i);
        const y = data.map(d => d.rawScore || d.y);

        // Simple linear regression
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);

        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // Calculate R-squared
        const yMean = sumY / n;
        const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const ssResidual = y.reduce((sum, yi, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(yi - predicted, 2);
        }, 0);
        const r2 = 1 - (ssResidual / ssTotal);

        return {
            slope,
            intercept,
            r2,
            direction: slope > 0 ? 'improving' : slope < 0 ? 'declining' : 'stable'
        };
    }

    /**
     * Identify areas where user is struggling
     */
    identifyWeakAreas(data) {
        const threshold = this.learningPatterns.mean - this.learningPatterns.stdDev;

        const weakPerformances = data.filter(d => (d.rawScore || d.y) < threshold);

        // Group by topic/quiz name
        const weakTopics = {};
        weakPerformances.forEach(d => {
            const topic = d.quizName || d.event || 'Unknown';
            if (!weakTopics[topic]) {
                weakTopics[topic] = {
                    count: 0,
                    avgScore: 0,
                    scores: []
                };
            }
            weakTopics[topic].count++;
            weakTopics[topic].scores.push(d.rawScore || d.y);
        });

        // Calculate averages
        Object.keys(weakTopics).forEach(topic => {
            const scores = weakTopics[topic].scores;
            weakTopics[topic].avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        });

        // Sort by count (most frequent struggles first)
        return Object.entries(weakTopics)
            .sort((a, b) => b[1].count - a[1].count)
            .map(([topic, stats]) => ({
                topic,
                frequency: stats.count,
                averageScore: stats.avgScore,
                severity: (threshold - stats.avgScore) / threshold
            }));
    }

    /**
     * Detect learning plateaus (periods of no improvement)
     */
    detectPlateaus(data) {
        const windowSize = 5;
        const plateaus = [];

        for (let i = 0; i <= data.length - windowSize; i++) {
            const window = data.slice(i, i + windowSize);
            const scores = window.map(d => d.rawScore || d.y);
            const variance = this.calculateVariance(scores);

            // Low variance indicates plateau
            if (variance < this.learningPatterns.variance * 0.3) {
                const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                plateaus.push({
                    startIndex: i,
                    endIndex: i + windowSize - 1,
                    duration: windowSize,
                    averageScore: avgScore,
                    variance
                });
            }
        }

        return plateaus;
    }

    /**
     * Create personalized recommendations based on analysis
     */
    createRecommendations(analysis) {
        const recommendations = [];
        const { patterns, profile, trajectory, weakAreas, plateaus } = analysis;

        // 1. Performance-based recommendations
        if (trajectory.slope < 0) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                title: '학습 패턴 개선 필요',
                description: '최근 성적이 하락하고 있습니다. 기초 개념을 다시 복습하는 것을 추천합니다.',
                action: 'review_basics',
                confidence: Math.abs(trajectory.r2),
                icon: '📉',
                suggestedContent: ['기초 개념 복습', '이전 주제 재학습']
            });
        } else if (trajectory.slope > 0.5) {
            recommendations.push({
                type: 'performance',
                priority: 'medium',
                title: '훌륭한 진척도!',
                description: '꾸준히 향상되고 있습니다. 다음 난이도로 도전해보세요.',
                action: 'increase_difficulty',
                confidence: trajectory.r2,
                icon: '📈',
                suggestedContent: ['심화 학습', '고난이도 문제']
            });
        }

        // 2. Weak area recommendations
        if (weakAreas.length > 0) {
            const topWeakArea = weakAreas[0];
            recommendations.push({
                type: 'weak_area',
                priority: 'high',
                title: `${topWeakArea.topic} 집중 학습`,
                description: `${topWeakArea.topic}에서 어려움을 겪고 있습니다. 맞춤 학습 콘텐츠를 준비했습니다.`,
                action: 'focus_weak_area',
                confidence: topWeakArea.severity,
                icon: '🎯',
                suggestedContent: [
                    `${topWeakArea.topic} 기본 개념`,
                    `${topWeakArea.topic} 연습 문제`,
                    `${topWeakArea.topic} 실전 예제`
                ],
                metadata: {
                    topic: topWeakArea.topic,
                    currentScore: topWeakArea.averageScore
                }
            });
        }

        // 3. Plateau recommendations
        if (plateaus.length > 0) {
            const latestPlateau = plateaus[plateaus.length - 1];
            recommendations.push({
                type: 'plateau',
                priority: 'medium',
                title: '학습 정체기 돌파',
                description: '최근 성적이 정체되어 있습니다. 새로운 학습 방법을 시도해보세요.',
                action: 'break_plateau',
                confidence: 0.7,
                icon: '🚀',
                suggestedContent: [
                    '다른 접근 방식으로 학습',
                    '실전 프로젝트 도전',
                    '그룹 스터디 참여'
                ]
            });
        }

        // 4. Consistency recommendations
        if (patterns.consistency < 0.5) {
            recommendations.push({
                type: 'consistency',
                priority: 'medium',
                title: '꾸준한 학습 필요',
                description: '학습 패턴이 불규칙합니다. 규칙적인 학습 스케줄을 만들어보세요.',
                action: 'improve_consistency',
                confidence: 1 - patterns.consistency,
                icon: '📅',
                suggestedContent: [
                    '매일 30분 학습 루틴',
                    '주간 학습 계획 수립',
                    '학습 알림 설정'
                ]
            });
        }

        // 5. Engagement recommendations
        if (profile.engagement < 0.4) {
            recommendations.push({
                type: 'engagement',
                priority: 'high',
                title: '학습 동기 부여',
                description: '최근 학습 활동이 줄었습니다. 흥미로운 콘텐츠로 다시 시작해보세요.',
                action: 'boost_engagement',
                confidence: 0.8,
                icon: '💡',
                suggestedContent: [
                    '게임형 학습 콘텐츠',
                    '짧은 퀴즈 도전',
                    '보상 시스템 활용'
                ]
            });
        }

        // 6. Advanced challenge recommendations
        if (patterns.mean > 80 && trajectory.slope >= 0 && patterns.consistency > 0.7) {
            recommendations.push({
                type: 'challenge',
                priority: 'low',
                title: '고급 과정 도전',
                description: '탁월한 성과입니다! 더 높은 수준의 학습을 시작할 준비가 되었습니다.',
                action: 'advanced_challenge',
                confidence: 0.9,
                icon: '🏆',
                suggestedContent: [
                    '고급 심화 과정',
                    '프로젝트 기반 학습',
                    '경시대회 준비'
                ]
            });
        }

        // Sort by priority and confidence
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        recommendations.sort((a, b) => {
            const priorityDiff = priorityWeight[b.priority] - priorityWeight[a.priority];
            if (priorityDiff !== 0) return priorityDiff;
            return b.confidence - a.confidence;
        });

        // Limit to max recommendations
        return recommendations.slice(0, this.config.maxRecommendations);
    }

    /**
     * Helper: Detect trend in data
     */
    detectTrend(values) {
        if (values.length < 3) return 'insufficient_data';

        const firstThird = values.slice(0, Math.floor(values.length / 3));
        const lastThird = values.slice(-Math.floor(values.length / 3));

        const firstAvg = firstThird.reduce((a, b) => a + b, 0) / firstThird.length;
        const lastAvg = lastThird.reduce((a, b) => a + b, 0) / lastThird.length;

        const diff = lastAvg - firstAvg;
        const threshold = 5; // 5% change threshold

        if (diff > threshold) return 'improving';
        if (diff < -threshold) return 'declining';
        return 'stable';
    }

    /**
     * Helper: Calculate median
     */
    calculateMedian(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
    }

    /**
     * Helper: Calculate variance
     */
    calculateVariance(values) {
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }

    /**
     * Helper: Determine learning style based on patterns
     */
    determineLearningStyle(data) {
        // Analyze attempt patterns
        const attempts = data.map(d => d.attempt).filter(Boolean);
        const avgAttempts = attempts.length > 0
            ? attempts.reduce((a, b) => a + b, 0) / attempts.length
            : 1;

        // Analyze time patterns
        const times = data.map(d => d.timeTaken).filter(Boolean);
        const avgTime = times.length > 0
            ? times.reduce((a, b) => a + b, 0) / times.length
            : 0;

        if (avgAttempts < 1.5 && avgTime < 1200) {
            return 'quick_learner';
        } else if (avgAttempts > 2 && avgTime > 1800) {
            return 'thorough_learner';
        } else if (this.learningPatterns.consistency > 0.7) {
            return 'consistent_learner';
        }

        return 'adaptive_learner';
    }

    /**
     * Helper: Calculate engagement level
     */
    calculateEngagement(allData, recentData) {
        if (allData.length === 0) return 0;

        const recentRatio = recentData.length / Math.min(allData.length, 20);
        const activityDensity = recentData.length / this.config.lookbackPeriod;

        return Math.min(1, (recentRatio + activityDensity) / 2);
    }

    /**
     * Helper: Estimate preferred difficulty
     */
    estimatePreferredDifficulty(data) {
        const scores = data.map(d => d.rawScore || d.y);
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        if (avgScore >= 85) return 'hard';
        if (avgScore >= 70) return 'medium';
        return 'easy';
    }

    /**
     * Get recommendation by ID
     */
    getRecommendation(id) {
        return this.recommendations.find(r => r.id === id);
    }

    /**
     * Export recommendations as JSON
     */
    exportRecommendations() {
        return {
            timestamp: Date.now(),
            version: '1.0.0',
            userProfile: this.userProfile,
            learningPatterns: this.learningPatterns,
            recommendations: this.recommendations
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationEngine;
}
