/**
 * Learning Analytics
 * 학습 분석 및 인사이트 제공
 */

class LearningAnalytics {
    constructor() {
        this.performanceThreshold = {
            excellent: 90,
            good: 75,
            average: 60,
            needsImprovement: 0
        };
    }

    /**
     * 전체 학습 분석 리포트
     */
    generateAnalyticsReport() {
        const user = storage.get('user');
        const stats = storage.get('statistics');
        const history = storage.getLearningHistory(100);

        return {
            overview: this.getOverview(user, stats),
            performance: this.getPerformanceMetrics(stats),
            progress: this.getProgressAnalysis(history),
            categoryInsights: this.getCategoryInsights(stats),
            timeAnalysis: this.getTimeAnalysis(history),
            achievements: this.getAchievements(stats, history),
            recommendations: this.getRecommendations(stats, history)
        };
    }

    /**
     * 개요 정보
     */
    getOverview(user, stats) {
        const accuracy = stats.totalProblems > 0
            ? (stats.correctAnswers / stats.totalProblems) * 100
            : 0;

        return {
            userName: user.name,
            level: user.level,
            totalPoints: stats.totalPoints,
            totalProblems: stats.totalProblems,
            accuracy: accuracy.toFixed(1),
            streak: user.streak,
            memberSince: new Date(user.createdAt).toLocaleDateString('ko-KR')
        };
    }

    /**
     * 성과 지표
     */
    getPerformanceMetrics(stats) {
        const totalProblems = stats.totalProblems || 0;
        const correctAnswers = stats.correctAnswers || 0;
        const accuracy = totalProblems > 0 ? (correctAnswers / totalProblems) * 100 : 0;

        let performanceLevel;
        if (accuracy >= this.performanceThreshold.excellent) {
            performanceLevel = 'excellent';
        } else if (accuracy >= this.performanceThreshold.good) {
            performanceLevel = 'good';
        } else if (accuracy >= this.performanceThreshold.average) {
            performanceLevel = 'average';
        } else {
            performanceLevel = 'needsImprovement';
        }

        return {
            accuracy,
            performanceLevel,
            correctRate: accuracy,
            incorrectRate: 100 - accuracy,
            totalAttempts: totalProblems,
            successCount: correctAnswers,
            failureCount: stats.incorrectAnswers || 0
        };
    }

    /**
     * 진행 상황 분석
     */
    getProgressAnalysis(history) {
        if (history.length === 0) {
            return {
                trend: 'neutral',
                recentAccuracy: 0,
                improvementRate: 0,
                consistencyScore: 0
            };
        }

        // 최근 10문제와 그 이전 10문제 비교
        const recent10 = history.slice(0, 10);
        const previous10 = history.slice(10, 20);

        const recentCorrect = recent10.filter(h => h.isCorrect).length;
        const recentAccuracy = (recentCorrect / recent10.length) * 100;

        let trend = 'neutral';
        let improvementRate = 0;

        if (previous10.length > 0) {
            const previousCorrect = previous10.filter(h => h.isCorrect).length;
            const previousAccuracy = (previousCorrect / previous10.length) * 100;

            improvementRate = recentAccuracy - previousAccuracy;

            if (improvementRate > 10) {
                trend = 'improving';
            } else if (improvementRate < -10) {
                trend = 'declining';
            }
        }

        // 일관성 점수 (표준편차 기반)
        const consistencyScore = this.calculateConsistencyScore(recent10);

        return {
            trend,
            recentAccuracy,
            improvementRate,
            consistencyScore,
            recentProblems: recent10.length
        };
    }

    /**
     * 카테고리별 인사이트
     */
    getCategoryInsights(stats) {
        const insights = [];

        for (const [category, data] of Object.entries(stats.problemsByCategory)) {
            const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;

            let status;
            if (accuracy >= 80) {
                status = 'mastered';
            } else if (accuracy >= 60) {
                status = 'proficient';
            } else if (accuracy >= 40) {
                status = 'learning';
            } else {
                status = 'struggling';
            }

            insights.push({
                category,
                total: data.total,
                correct: data.correct,
                accuracy: accuracy.toFixed(1),
                status,
                needsPractice: status === 'struggling' || status === 'learning'
            });
        }

        // 정확도순 정렬
        insights.sort((a, b) => parseFloat(b.accuracy) - parseFloat(a.accuracy));

        return insights;
    }

    /**
     * 시간 분석
     */
    getTimeAnalysis(history) {
        if (history.length === 0) {
            return {
                totalTime: 0,
                avgTimePerProblem: 0,
                efficiency: 'N/A'
            };
        }

        const totalTime = history.reduce((sum, h) => sum + (h.timeSpent || 60), 0);
        const avgTimePerProblem = totalTime / history.length;

        let efficiency;
        if (avgTimePerProblem < 30) {
            efficiency = 'fast';
        } else if (avgTimePerProblem < 60) {
            efficiency = 'optimal';
        } else if (avgTimePerProblem < 120) {
            efficiency = 'thorough';
        } else {
            efficiency = 'slow';
        }

        return {
            totalTime,
            avgTimePerProblem: avgTimePerProblem.toFixed(1),
            efficiency,
            totalMinutes: Math.floor(totalTime / 60),
            totalHours: (totalTime / 3600).toFixed(1)
        };
    }

    /**
     * 업적 시스템
     */
    getAchievements(stats, history) {
        const achievements = [];

        // 문제 풀이 수 업적
        if (stats.totalProblems >= 100) {
            achievements.push({
                id: 'century',
                title: '백 문제 돌파!',
                description: '100개 이상의 문제를 해결했습니다',
                icon: '🎯',
                unlocked: true
            });
        }

        if (stats.totalProblems >= 50) {
            achievements.push({
                id: 'halfCentury',
                title: '반백 달성',
                description: '50개 이상의 문제를 해결했습니다',
                icon: '🎯',
                unlocked: true
            });
        }

        if (stats.totalProblems >= 10) {
            achievements.push({
                id: 'firstTen',
                title: '시작이 반',
                description: '10개의 문제를 해결했습니다',
                icon: '🎯',
                unlocked: true
            });
        }

        // 정답률 업적
        const accuracy = stats.totalProblems > 0
            ? (stats.correctAnswers / stats.totalProblems) * 100
            : 0;

        if (accuracy >= 90 && stats.totalProblems >= 20) {
            achievements.push({
                id: 'perfectionist',
                title: '완벽주의자',
                description: '90% 이상의 정답률 달성',
                icon: '⭐',
                unlocked: true
            });
        }

        // 연속 학습 업적
        const user = storage.get('user');
        if (user.streak >= 7) {
            achievements.push({
                id: 'weekStreak',
                title: '일주일 연속',
                description: '7일 연속 학습 완료',
                icon: '🔥',
                unlocked: true
            });
        }

        if (user.streak >= 30) {
            achievements.push({
                id: 'monthStreak',
                title: '한 달 마스터',
                description: '30일 연속 학습 완료',
                icon: '🔥',
                unlocked: true
            });
        }

        // 점수 업적
        if (stats.totalPoints >= 1000) {
            achievements.push({
                id: 'pointMaster',
                title: '포인트 마스터',
                description: '1000점 이상 획득',
                icon: '💎',
                unlocked: true
            });
        }

        // 카테고리 마스터
        for (const [category, data] of Object.entries(stats.problemsByCategory)) {
            const accuracy = data.total > 0 ? (data.correct / data.total) * 100 : 0;

            if (accuracy >= 85 && data.total >= 10) {
                achievements.push({
                    id: `master_${category}`,
                    title: `${category} 마스터`,
                    description: `${category}에서 85% 이상 달성`,
                    icon: '👑',
                    unlocked: true
                });
            }
        }

        return achievements;
    }

    /**
     * 추천 사항
     */
    getRecommendations(stats, history) {
        const recommendations = [];

        // 정답률 기반 추천
        const accuracy = stats.totalProblems > 0
            ? (stats.correctAnswers / stats.totalProblems) * 100
            : 0;

        if (accuracy < 60) {
            recommendations.push({
                type: 'improvement',
                priority: 'high',
                message: '기본 문제부터 차근차근 다시 시작해보세요.',
                action: 'review_basics'
            });
        } else if (accuracy > 85) {
            recommendations.push({
                type: 'challenge',
                priority: 'medium',
                message: '더 어려운 문제로 도전하세요!',
                action: 'increase_difficulty'
            });
        }

        // 학습 빈도 추천
        const recent7Days = this.getRecentDaysActivity(7);
        if (recent7Days < 3) {
            recommendations.push({
                type: 'consistency',
                priority: 'high',
                message: '꾸준한 학습이 중요합니다. 매일 조금씩 학습해보세요.',
                action: 'improve_consistency'
            });
        }

        // 카테고리 다양성 추천
        const categoriesCount = Object.keys(stats.problemsByCategory).length;
        const totalCategories = problemDB.getCategories().length;

        if (categoriesCount < totalCategories / 2) {
            recommendations.push({
                type: 'variety',
                priority: 'low',
                message: '다양한 분야의 문제를 풀어보세요.',
                action: 'explore_categories'
            });
        }

        return recommendations;
    }

    /**
     * 일관성 점수 계산
     */
    calculateConsistencyScore(recentProblems) {
        if (recentProblems.length < 5) {
            return 50; // 기본값
        }

        const correctFlags = recentProblems.map(p => p.isCorrect ? 1 : 0);
        const mean = correctFlags.reduce((a, b) => a + b, 0) / correctFlags.length;

        const variance = correctFlags.reduce((sum, val) =>
            sum + Math.pow(val - mean, 2), 0) / correctFlags.length;

        const stdDev = Math.sqrt(variance);

        // 표준편차가 낮을수록 일관성이 높음 (0-100 스케일)
        const consistency = Math.max(0, 100 - (stdDev * 200));

        return Math.round(consistency);
    }

    /**
     * 최근 N일간 활동일 수
     */
    getRecentDaysActivity(days) {
        const stats = storage.get('statistics');
        const dailyActivity = stats.dailyActivity || [];

        const today = new Date();
        const nDaysAgo = new Date(today.getTime() - (days * 24 * 60 * 60 * 1000));

        const recentActivity = dailyActivity.filter(d => {
            const activityDate = new Date(d.date);
            return activityDate >= nDaysAgo;
        });

        return recentActivity.length;
    }

    /**
     * 학습 그래프 데이터 생성
     */
    generateGraphData(period = 'week') {
        const history = storage.getLearningHistory(1000);

        let groupedData;

        if (period === 'week') {
            groupedData = this.groupByDay(history, 7);
        } else if (period === 'month') {
            groupedData = this.groupByDay(history, 30);
        } else {
            groupedData = this.groupByHour(history, 24);
        }

        return groupedData;
    }

    /**
     * 일별 그룹화
     */
    groupByDay(history, days) {
        const data = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            const dayProblems = history.filter(h => {
                const hDate = new Date(h.timestamp).toISOString().split('T')[0];
                return hDate === dateStr;
            });

            const correct = dayProblems.filter(h => h.isCorrect).length;
            const total = dayProblems.length;
            const accuracy = total > 0 ? (correct / total) * 100 : 0;

            data.push({
                label: this.formatDate(date, i === 0),
                total,
                correct,
                accuracy,
                score: Math.max(accuracy, 1) // 로그 스케일을 위해 최소값 1
            });
        }

        return data;
    }

    /**
     * 시간별 그룹화
     */
    groupByHour(history, hours) {
        const data = [];
        const now = new Date();

        for (let i = hours - 1; i >= 0; i--) {
            const hour = new Date(now);
            hour.setHours(hour.getHours() - i);

            const hourProblems = history.filter(h => {
                const hTime = new Date(h.timestamp);
                return Math.abs(hTime - hour) < 3600000; // 1시간 범위
            });

            const correct = hourProblems.filter(h => h.isCorrect).length;
            const total = hourProblems.length;
            const accuracy = total > 0 ? (correct / total) * 100 : 0;

            data.push({
                label: `${i}시간 전`,
                total,
                correct,
                accuracy,
                score: Math.max(accuracy, 1)
            });
        }

        return data;
    }

    /**
     * 날짜 포맷팅
     */
    formatDate(date, isToday) {
        if (isToday) {
            return '오늘';
        }

        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}/${day}`;
    }
}

// 전역 인스턴스 생성
const analytics = new LearningAnalytics();
