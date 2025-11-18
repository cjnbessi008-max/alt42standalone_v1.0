/**
 * AI Recommendation Engine
 * 머신러닝 기반 적응형 문제 추천 시스템
 */

class RecommendationEngine {
    constructor() {
        this.algorithmWeights = {
            weaknessTarget: 0.4,      // 약점 보완 40%
            difficultyProgression: 0.3, // 난이도 진행 30%
            varietyBonus: 0.2,         // 다양성 20%
            recentPerformance: 0.1     // 최근 성과 10%
        };

        this.recentlySolvedLimit = 10; // 최근 푼 문제 제외
    }

    /**
     * 메인 추천 함수
     * @returns {Object} 추천된 문제와 추천 이유
     */
    recommendProblem() {
        const stats = storage.get('statistics');
        const prefs = storage.get('userPreferences');
        const history = storage.getLearningHistory(50);

        // 최근 푼 문제 ID 목록
        const recentProblemIds = history.slice(0, this.recentlySolvedLimit)
            .map(h => h.problemId);

        // 1. 약점 카테고리 우선 추천
        const weaknessProblems = this.getWeaknessTargetedProblems(
            prefs.weakCategories,
            recentProblemIds
        );

        // 2. 적응형 난이도 추천
        const difficultyProblems = this.getAdaptiveDifficultyProblems(
            history,
            stats,
            recentProblemIds
        );

        // 3. 다양성 기반 추천
        const varietyProblems = this.getVarietyProblems(
            stats,
            recentProblemIds
        );

        // 4. 최근 성과 기반 추천
        const performanceProblems = this.getPerformanceBasedProblems(
            history,
            recentProblemIds
        );

        // 모든 후보 문제 수집
        const candidates = [
            ...this.scoreCandidates(weaknessProblems, this.algorithmWeights.weaknessTarget),
            ...this.scoreCandidates(difficultyProblems, this.algorithmWeights.difficultyProgression),
            ...this.scoreCandidates(varietyProblems, this.algorithmWeights.varietyBonus),
            ...this.scoreCandidates(performanceProblems, this.algorithmWeights.recentPerformance)
        ];

        // 점수별로 정렬
        candidates.sort((a, b) => b.score - a.score);

        // 상위 후보 중 랜덤 선택 (다양성 보장)
        const topCandidates = candidates.slice(0, 5);
        const selected = topCandidates.length > 0
            ? topCandidates[Math.floor(Math.random() * Math.min(3, topCandidates.length))]
            : null;

        if (!selected) {
            // 후보가 없으면 랜덤 선택
            return {
                problem: problemDB.getRandomProblem({ excludeIds: recentProblemIds }),
                reason: '새로운 도전을 위한 랜덤 문제입니다.',
                type: '랜덤 추천'
            };
        }

        return {
            problem: selected.problem,
            reason: this.generateRecommendationReason(selected),
            type: selected.type,
            score: selected.score
        };
    }

    /**
     * 약점 보완 문제 추천
     */
    getWeaknessTargetedProblems(weakCategories, excludeIds) {
        if (!weakCategories || weakCategories.length === 0) {
            return [];
        }

        const problems = [];

        weakCategories.slice(0, 3).forEach(category => {
            const categoryProblems = problemDB.getProblems({
                category,
                excludeIds
            });

            problems.push(...categoryProblems);
        });

        return problems.map(p => ({
            problem: p,
            type: '약점 보완',
            reason: `${p.category} 분야의 정확도를 높이기 위한 문제입니다.`
        }));
    }

    /**
     * 적응형 난이도 문제 추천
     */
    getAdaptiveDifficultyProblems(history, stats, excludeIds) {
        const recentHistory = history.slice(0, 10);

        if (recentHistory.length === 0) {
            // 처음 시작하는 사용자 - 쉬운 문제부터
            return problemDB.getProblemsByDifficulty('easy')
                .filter(p => !excludeIds.includes(p.id))
                .map(p => ({
                    problem: p,
                    type: '입문 단계',
                    reason: '학습을 시작하기 좋은 기본 문제입니다.'
                }));
        }

        // 최근 10문제의 정답률 계산
        const recentCorrect = recentHistory.filter(h => h.isCorrect).length;
        const recentAccuracy = (recentCorrect / recentHistory.length) * 100;

        let targetDifficulty;
        let reason;

        if (recentAccuracy >= 80) {
            // 80% 이상 - 난이도 상승
            const currentDiff = recentHistory[0].difficulty;
            targetDifficulty = this.increaseDifficulty(currentDiff);
            reason = `최근 정답률 ${recentAccuracy.toFixed(0)}%로 다음 단계로 도전합니다!`;
        } else if (recentAccuracy >= 60) {
            // 60-80% - 현재 난이도 유지
            targetDifficulty = recentHistory[0].difficulty;
            reason = `현재 난이도에서 실력을 더 다져봅시다.`;
        } else {
            // 60% 미만 - 난이도 하락
            const currentDiff = recentHistory[0].difficulty;
            targetDifficulty = this.decreaseDifficulty(currentDiff);
            reason = `기본을 다시 다지기 위한 문제입니다.`;
        }

        const problems = problemDB.getProblemsByDifficulty(targetDifficulty)
            .filter(p => !excludeIds.includes(p.id));

        return problems.map(p => ({
            problem: p,
            type: '적응형 난이도',
            reason
        }));
    }

    /**
     * 다양성 기반 문제 추천
     */
    getVarietyProblems(stats, excludeIds) {
        const categoryCounts = stats.problemsByCategory;

        // 적게 푼 카테고리 찾기
        const allCategories = problemDB.getCategories();
        const underExploredCategories = allCategories
            .map(cat => ({
                category: cat,
                count: categoryCounts[cat]?.total || 0
            }))
            .sort((a, b) => a.count - b.count)
            .slice(0, 3)
            .map(c => c.category);

        const problems = [];

        underExploredCategories.forEach(category => {
            const catProblems = problemDB.getProblems({
                category,
                excludeIds
            });
            problems.push(...catProblems);
        });

        return problems.map(p => ({
            problem: p,
            type: '다양성 확대',
            reason: `${p.category} 분야를 더 탐험해보세요.`
        }));
    }

    /**
     * 최근 성과 기반 추천
     */
    getPerformanceBasedProblems(history, excludeIds) {
        const recent5 = history.slice(0, 5);

        if (recent5.length === 0) {
            return [];
        }

        const correctCount = recent5.filter(h => h.isCorrect).length;

        if (correctCount >= 4) {
            // 연승 중 - 도전적인 문제
            const hardProblems = problemDB.getProblemsByDifficulty('hard')
                .filter(p => !excludeIds.includes(p.id));

            return hardProblems.map(p => ({
                problem: p,
                type: '도전 과제',
                reason: '연속 정답! 더 어려운 문제에 도전해보세요.'
            }));
        } else if (correctCount <= 1) {
            // 어려움 겪는 중 - 쉬운 문제로 자신감 회복
            const easyProblems = problemDB.getProblemsByDifficulty('easy')
                .filter(p => !excludeIds.includes(p.id));

            return easyProblems.map(p => ({
                problem: p,
                type: '자신감 회복',
                reason: '기본 문제로 자신감을 되찾아봅시다.'
            }));
        }

        return [];
    }

    /**
     * 후보 문제에 점수 부여
     */
    scoreCandidates(candidates, weight) {
        return candidates.map(c => ({
            ...c,
            score: (c.score || 1) * weight
        }));
    }

    /**
     * 추천 이유 생성
     */
    generateRecommendationReason(selected) {
        const { problem, type, reason } = selected;

        const difficultyText = {
            'easy': '쉬움',
            'medium': '보통',
            'hard': '어려움'
        }[problem.difficulty];

        return `
            <p><strong>📌 추천 유형:</strong> ${type}</p>
            <p><strong>📊 난이도:</strong> ${difficultyText}</p>
            <p><strong>📚 카테고리:</strong> ${problem.category}</p>
            <p><strong>💡 추천 이유:</strong> ${reason}</p>
        `;
    }

    /**
     * 난이도 증가
     */
    increaseDifficulty(currentDifficulty) {
        const levels = ['easy', 'medium', 'hard'];
        const currentIndex = levels.indexOf(currentDifficulty);

        if (currentIndex < levels.length - 1) {
            return levels[currentIndex + 1];
        }

        return currentDifficulty;
    }

    /**
     * 난이도 감소
     */
    decreaseDifficulty(currentDifficulty) {
        const levels = ['easy', 'medium', 'hard'];
        const currentIndex = levels.indexOf(currentDifficulty);

        if (currentIndex > 0) {
            return levels[currentIndex - 1];
        }

        return currentDifficulty;
    }

    /**
     * 다중 문제 추천
     */
    recommendMultipleProblems(count = 5) {
        const recommendations = [];
        const excludeIds = [];

        for (let i = 0; i < count; i++) {
            const rec = this.recommendProblem();

            if (rec.problem) {
                recommendations.push(rec);
                excludeIds.push(rec.problem.id);
            }
        }

        return recommendations;
    }

    /**
     * 학습 경로 생성
     */
    generateLearningPath(category, targetDifficulty = 'hard') {
        const path = [];
        const difficulties = ['easy', 'medium', 'hard'];
        const targetIndex = difficulties.indexOf(targetDifficulty);

        for (let i = 0; i <= targetIndex; i++) {
            const problems = problemDB.getProblems({
                category,
                difficulty: difficulties[i]
            });

            // 각 난이도에서 3-5개 문제 선택
            const count = Math.min(5, problems.length);
            for (let j = 0; j < count; j++) {
                if (problems[j]) {
                    path.push({
                        problem: problems[j],
                        step: path.length + 1,
                        milestone: i === targetIndex
                    });
                }
            }
        }

        return path;
    }

    /**
     * 학습자 프로필 분석
     */
    analyzeLearnerProfile() {
        const stats = storage.get('statistics');
        const prefs = storage.get('userPreferences');
        const history = storage.getLearningHistory(100);

        const profile = {
            level: 'beginner',
            strengths: [],
            weaknesses: [],
            learningSpeed: 'normal',
            preferredCategories: [],
            overallAccuracy: 0,
            totalTime: 0
        };

        if (stats.totalProblems === 0) {
            return profile;
        }

        // 전체 정답률
        profile.overallAccuracy = (stats.correctAnswers / stats.totalProblems) * 100;

        // 레벨 판정
        if (stats.totalProblems < 10) {
            profile.level = 'beginner';
        } else if (stats.totalProblems < 50) {
            profile.level = 'intermediate';
        } else {
            profile.level = 'advanced';
        }

        // 강점과 약점
        profile.strengths = prefs.strongCategories || [];
        profile.weaknesses = prefs.weakCategories || [];

        // 선호 카테고리 (가장 많이 푼 카테고리)
        const categoryCounts = Object.entries(stats.problemsByCategory)
            .sort((a, b) => b[1].total - a[1].total)
            .slice(0, 3)
            .map(([cat]) => cat);

        profile.preferredCategories = categoryCounts;

        // 학습 속도 (평균 문제 풀이 시간)
        const avgTime = history.reduce((sum, h) => sum + (h.timeSpent || 60), 0) / history.length;

        if (avgTime < 30) {
            profile.learningSpeed = 'fast';
        } else if (avgTime > 90) {
            profile.learningSpeed = 'slow';
        } else {
            profile.learningSpeed = 'normal';
        }

        profile.totalTime = history.reduce((sum, h) => sum + (h.timeSpent || 60), 0);

        return profile;
    }

    /**
     * 개인화된 학습 제안
     */
    getPersonalizedSuggestions() {
        const profile = this.analyzeLearnerProfile();
        const suggestions = [];

        // 약점 보완 제안
        if (profile.weaknesses.length > 0) {
            suggestions.push({
                type: 'weakness',
                title: '약점 보완하기',
                message: `${profile.weaknesses[0]} 분야를 더 연습하면 실력이 크게 향상될 것입니다.`,
                action: 'practice_weak_category',
                priority: 'high'
            });
        }

        // 정답률 기반 제안
        if (profile.overallAccuracy < 60) {
            suggestions.push({
                type: 'difficulty',
                title: '난이도 조정',
                message: '좀 더 쉬운 문제로 기본을 다지는 것을 추천합니다.',
                action: 'lower_difficulty',
                priority: 'high'
            });
        } else if (profile.overallAccuracy > 85) {
            suggestions.push({
                type: 'challenge',
                title: '도전 과제',
                message: '실력이 많이 향상되었습니다! 더 어려운 문제에 도전해보세요.',
                action: 'increase_difficulty',
                priority: 'medium'
            });
        }

        // 다양성 제안
        const unexploredCategories = problemDB.getCategories()
            .filter(cat => !profile.preferredCategories.includes(cat));

        if (unexploredCategories.length > 0) {
            suggestions.push({
                type: 'variety',
                title: '새로운 분야 탐험',
                message: `${unexploredCategories[0]} 분야도 한번 도전해보세요.`,
                action: 'explore_new_category',
                priority: 'low'
            });
        }

        return suggestions;
    }
}

// 전역 인스턴스 생성
const recommendationEngine = new RecommendationEngine();
