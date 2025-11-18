/**
 * AI Recommendation Engine (Client Side)
 * Analyzes student performance and suggests optimal problems
 */

class RecommendationEngine {
    constructor() {
        this.userProfile = {
            level: 1,
            strengths: [],
            weaknesses: [],
            recentPerformance: [],
            preferredTypes: []
        };
    }

    async init() {
        try {
            const response = await api.getPersonalizedRecommendation();
            if (response.profile) {
                this.userProfile = { ...this.userProfile, ...response.profile };
            }
        } catch (error) {
            console.warn('Could not load recommendation profile:', error);
        }
    }

    async getRecommendation() {
        try {
            // Try to get server-side recommendation
            const recommendation = await api.getRecommendedProblem();
            return recommendation;
        } catch (error) {
            console.warn('Server recommendation failed, using local:', error);
            return this.getLocalRecommendation();
        }
    }

    getLocalRecommendation() {
        // Fallback: local recommendation algorithm
        const { level, strengths, weaknesses, recentPerformance } = this.userProfile;

        // Determine difficulty based on recent performance
        let difficulty = Math.max(1, Math.min(5, level));

        if (recentPerformance.length > 0) {
            const avgAccuracy = recentPerformance.reduce((sum, p) => sum + p.accuracy, 0) / recentPerformance.length;

            if (avgAccuracy > 0.85) {
                difficulty = Math.min(5, difficulty + 1); // Increase difficulty
            } else if (avgAccuracy < 0.60) {
                difficulty = Math.max(1, difficulty - 1); // Decrease difficulty
            }
        }

        // Choose sequence type
        let sequenceType = 'fibonacci';

        if (weaknesses.length > 0) {
            // Focus on weak areas
            sequenceType = weaknesses[0];
        } else if (strengths.length > 0) {
            // Reinforce strengths occasionally
            if (Math.random() < 0.3) {
                sequenceType = strengths[Math.floor(Math.random() * strengths.length)];
            } else {
                // Try new types
                const allTypes = ['fibonacci', 'arithmetic', 'geometric', 'square', 'prime'];
                const untriedTypes = allTypes.filter(t => !strengths.includes(t) && !weaknesses.includes(t));
                if (untriedTypes.length > 0) {
                    sequenceType = untriedTypes[Math.floor(Math.random() * untriedTypes.length)];
                }
            }
        }

        // Determine petal count based on difficulty
        const petalCount = Math.min(12, Math.max(4, 5 + difficulty));

        return {
            sequenceType,
            difficulty,
            petalCount,
            reason: this.generateReason(sequenceType, difficulty)
        };
    }

    generateReason(sequenceType, difficulty) {
        const reasons = {
            fibonacci: [
                '피보나치 수열은 패턴 인식 능력을 향상시킵니다.',
                '자연에서 가장 많이 나타나는 수열을 학습하세요.',
                '수학적 아름다움이 담긴 피보나치를 마스터하세요.'
            ],
            arithmetic: [
                '등차수열로 기본기를 다져보세요.',
                '일정한 패턴을 찾는 연습이 필요합니다.',
                '산술 능력 향상에 최적화된 문제입니다.'
            ],
            geometric: [
                '등비수열로 배수 개념을 익혀보세요.',
                '지수적 성장 패턴을 이해하는 것이 중요합니다.',
                '급속한 변화 패턴에 도전해보세요.'
            ],
            square: [
                '제곱수로 수감각을 키워보세요.',
                '기하학적 패턴 인식 능력을 향상시킵니다.',
                '제곱의 개념을 확실히 이해하세요.'
            ],
            prime: [
                '소수 찾기로 논리적 사고력을 키워보세요.',
                '수의 본질을 이해하는 고급 문제입니다.',
                '패턴이 없는 것에서 패턴을 찾는 도전입니다.'
            ]
        };

        const typeReasons = reasons[sequenceType] || reasons['arithmetic'];
        return typeReasons[Math.floor(Math.random() * typeReasons.length)];
    }

    async updateProfile(attemptData) {
        const { sequenceType, difficulty, correct, timeSpent, accuracy } = attemptData;

        // Update recent performance
        this.userProfile.recentPerformance.push({
            sequenceType,
            difficulty,
            correct,
            timeSpent,
            accuracy,
            timestamp: Date.now()
        });

        // Keep only last 10 attempts
        if (this.userProfile.recentPerformance.length > 10) {
            this.userProfile.recentPerformance.shift();
        }

        // Update strengths and weaknesses
        if (accuracy > 0.8) {
            if (!this.userProfile.strengths.includes(sequenceType)) {
                this.userProfile.strengths.push(sequenceType);
            }
            // Remove from weaknesses if present
            this.userProfile.weaknesses = this.userProfile.weaknesses.filter(t => t !== sequenceType);
        } else if (accuracy < 0.5) {
            if (!this.userProfile.weaknesses.includes(sequenceType)) {
                this.userProfile.weaknesses.push(sequenceType);
            }
        }

        // Adjust level
        const recentAccuracy = this.userProfile.recentPerformance
            .slice(-5)
            .reduce((sum, p) => sum + p.accuracy, 0) / Math.min(5, this.userProfile.recentPerformance.length);

        if (recentAccuracy > 0.85) {
            this.userProfile.level = Math.min(5, this.userProfile.level + 0.2);
        } else if (recentAccuracy < 0.5) {
            this.userProfile.level = Math.max(1, this.userProfile.level - 0.2);
        }

        // Send to server
        try {
            await api.updateLearningProfile({
                profile: this.userProfile,
                attemptData
            });
        } catch (error) {
            console.warn('Failed to update server profile:', error);
        }

        return this.userProfile;
    }

    getPerformanceAnalysis() {
        const { recentPerformance } = this.userProfile;

        if (recentPerformance.length === 0) {
            return {
                text: '아직 학습 데이터가 없습니다. 문제를 풀어보세요!',
                suggestions: ['다양한 수열 유형을 시도해보세요.']
            };
        }

        const avgAccuracy = recentPerformance.reduce((sum, p) => sum + p.accuracy, 0) / recentPerformance.length;
        const avgTime = recentPerformance.reduce((sum, p) => sum + p.timeSpent, 0) / recentPerformance.length;

        let analysis = '';
        let suggestions = [];

        if (avgAccuracy > 0.85) {
            analysis = '🎉 훌륭합니다! 매우 높은 정확도를 보이고 있어요. ';
            suggestions.push('더 어려운 난이도에 도전해보세요.');
            suggestions.push('새로운 유형의 수열을 시도해보세요.');
        } else if (avgAccuracy > 0.7) {
            analysis = '👍 잘하고 있어요! 꾸준히 실력이 향상되고 있습니다. ';
            suggestions.push('약한 부분을 집중적으로 연습하세요.');
        } else if (avgAccuracy > 0.5) {
            analysis = '📚 조금 더 연습이 필요해요. 기초를 다지고 있습니다. ';
            suggestions.push('쉬운 문제부터 차근차근 풀어보세요.');
            suggestions.push('힌트 기능을 적극 활용하세요.');
        } else {
            analysis = '💪 포기하지 마세요! 모든 전문가도 처음엔 초보였습니다. ';
            suggestions.push('난이도를 낮춰서 자신감을 키워보세요.');
            suggestions.push('패턴을 찾는 연습을 해보세요.');
        }

        if (avgTime > 60) {
            analysis += '시간을 충분히 들여 신중하게 접근하고 있네요.';
            suggestions.push('속도를 조금 높여보는 것도 도전해보세요.');
        } else if (avgTime < 20) {
            analysis += '매우 빠르게 문제를 풀고 있어요!';
            suggestions.push('정확도를 높이는 데 집중해보세요.');
        }

        return {
            text: analysis,
            suggestions,
            avgAccuracy: Math.round(avgAccuracy * 100),
            avgTime: Math.round(avgTime)
        };
    }

    getNextRecommendationText(currentResult) {
        const { correct, accuracy } = currentResult;

        if (accuracy > 0.9) {
            return '🚀 완벽해요! 다음은 더 도전적인 문제를 준비했습니다.';
        } else if (accuracy > 0.7) {
            return '👏 좋아요! 비슷한 난이도의 다른 유형을 시도해보세요.';
        } else {
            return '💡 연습이 필요해요. 같은 유형의 쉬운 문제로 시작해보세요.';
        }
    }
}

const recommendationEngine = new RecommendationEngine();
