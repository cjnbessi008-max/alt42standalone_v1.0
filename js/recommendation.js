/**
 * RecommendationEngine - AI 기반 문제 추천 시스템
 * 학습자의 수준, 학습 이력, 정답률을 분석하여 최적의 문제를 추천
 */

class RecommendationEngine {
    constructor(storage) {
        this.storage = storage;
        this.userLevel = 'beginner'; // beginner, intermediate, advanced
        this.learningStyle = 'adaptive'; // adaptive, sequential, random
    }

    /**
     * 사용자 수준 분석
     */
    async analyzeUserLevel() {
        const stats = await this.storage.getTotalStatistics();

        if (stats.totalAttempts === 0) {
            this.userLevel = 'beginner';
            return this.userLevel;
        }

        const successRate = parseFloat(stats.successRate);
        const avgGrade = stats.averageGrade;

        // 수준 결정 알고리즘
        if (successRate >= 80 && avgGrade >= 80) {
            this.userLevel = 'advanced';
        } else if (successRate >= 60 && avgGrade >= 60) {
            this.userLevel = 'intermediate';
        } else {
            this.userLevel = 'beginner';
        }

        return this.userLevel;
    }

    /**
     * 다음 문제 추천
     */
    async recommendNextProblem() {
        await this.analyzeUserLevel();

        const allProblems = await this.storage.getAllProblems();
        if (allProblems.length === 0) {
            // 기본 문제 생성
            return this.generateDefaultProblem();
        }

        // 학습 스타일에 따라 추천
        switch (this.learningStyle) {
            case 'adaptive':
                return this.adaptiveRecommendation(allProblems);
            case 'sequential':
                return this.sequentialRecommendation(allProblems);
            case 'random':
                return this.randomRecommendation(allProblems);
            default:
                return this.adaptiveRecommendation(allProblems);
        }
    }

    /**
     * 적응형 추천 (난이도 조절)
     */
    async adaptiveRecommendation(problems) {
        // 최근 성적 분석
        const recentStats = await this.getRecentPerformance();

        // 난이도 매핑
        const difficultyMap = {
            'beginner': 'easy',
            'intermediate': 'medium',
            'advanced': 'hard'
        };

        let targetDifficulty = difficultyMap[this.userLevel];

        // 최근 성적이 좋으면 난이도 상승
        if (recentStats.recentSuccessRate > 85) {
            targetDifficulty = this.increaseDifficulty(targetDifficulty);
        }
        // 최근 성적이 나쁘면 난이도 하락
        else if (recentStats.recentSuccessRate < 50) {
            targetDifficulty = this.decreaseDifficulty(targetDifficulty);
        }

        // 해당 난이도의 문제 중에서 선택
        const candidateProblems = problems.filter(p => p.difficulty === targetDifficulty);

        if (candidateProblems.length === 0) {
            // 해당 난이도 문제가 없으면 가장 가까운 난이도 선택
            return this.selectNearestDifficulty(problems, targetDifficulty);
        }

        // 아직 시도하지 않은 문제 우선
        const untriedProblems = await this.filterUntriedProblems(candidateProblems);

        if (untriedProblems.length > 0) {
            return this.selectBySpacedRepetition(untriedProblems);
        }

        // 복습이 필요한 문제 (오래 전에 시도했거나 틀렸던 문제)
        return this.selectForReview(candidateProblems);
    }

    /**
     * 순차적 추천
     */
    async sequentialRecommendation(problems) {
        // 난이도별로 정렬
        const sortedProblems = problems.sort((a, b) => {
            const difficultyOrder = { 'easy': 1, 'medium': 2, 'hard': 3 };
            return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        });

        // 아직 시도하지 않은 첫 문제
        const untriedProblems = await this.filterUntriedProblems(sortedProblems);

        if (untriedProblems.length > 0) {
            return untriedProblems[0];
        }

        // 모든 문제를 시도했으면 처음부터 다시
        return sortedProblems[0];
    }

    /**
     * 랜덤 추천
     */
    async randomRecommendation(problems) {
        const randomIndex = Math.floor(Math.random() * problems.length);
        return problems[randomIndex];
    }

    /**
     * 최근 성적 분석
     */
    async getRecentPerformance(count = 10) {
        const tx = this.storage.db.transaction(['answers'], 'readonly');
        const store = tx.objectStore('answers');
        const index = store.index('timestamp');

        return new Promise((resolve, reject) => {
            const request = index.openCursor(null, 'prev');
            const recentAnswers = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;

                if (cursor && recentAnswers.length < count) {
                    recentAnswers.push(cursor.value);
                    cursor.continue();
                } else {
                    const correct = recentAnswers.filter(a => a.isCorrect).length;
                    const recentSuccessRate = recentAnswers.length > 0
                        ? (correct / recentAnswers.length) * 100
                        : 0;

                    resolve({
                        recentAnswers,
                        recentSuccessRate,
                        totalRecent: recentAnswers.length
                    });
                }
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 시도하지 않은 문제 필터링
     */
    async filterUntriedProblems(problems) {
        const triedProblemIds = new Set();

        const tx = this.storage.db.transaction(['answers'], 'readonly');
        const store = tx.objectStore('answers');

        return new Promise((resolve, reject) => {
            const request = store.getAll();

            request.onsuccess = () => {
                const answers = request.result;
                answers.forEach(answer => triedProblemIds.add(answer.problemId));

                const untried = problems.filter(p => !triedProblemIds.has(p.id));
                resolve(untried);
            };

            request.onerror = () => reject(request.error);
        });
    }

    /**
     * 간격 반복 학습법 적용
     */
    selectBySpacedRepetition(problems) {
        // 로그 밑이 작은 순서부터 (쉬운 것부터)
        return problems.sort((a, b) => a.base - b.base)[0];
    }

    /**
     * 복습용 문제 선택
     */
    async selectForReview(problems) {
        const problemStats = await Promise.all(
            problems.map(async (problem) => {
                const stats = await this.storage.getProblemStatistics(problem.id);
                return {
                    problem,
                    stats,
                    reviewPriority: this.calculateReviewPriority(stats)
                };
            })
        );

        // 복습 우선순위가 높은 순으로 정렬
        problemStats.sort((a, b) => b.reviewPriority - a.reviewPriority);

        return problemStats[0].problem;
    }

    /**
     * 복습 우선순위 계산
     */
    calculateReviewPriority(stats) {
        let priority = 0;

        // 틀린 문제는 우선순위 높음
        if (stats.correct === 0) {
            priority += 100;
        } else {
            // 정답률이 낮을수록 우선순위 높음
            const successRate = (stats.correct / stats.attempts) * 100;
            priority += (100 - successRate);
        }

        // 오래 전에 시도한 문제 우선순위 높음
        const daysSinceLastAttempt = (Date.now() - stats.lastAttempt) / (1000 * 60 * 60 * 24);
        priority += Math.min(daysSinceLastAttempt * 2, 50);

        return priority;
    }

    /**
     * 난이도 상승
     */
    increaseDifficulty(current) {
        const order = ['easy', 'medium', 'hard'];
        const index = order.indexOf(current);
        return index < order.length - 1 ? order[index + 1] : current;
    }

    /**
     * 난이도 하락
     */
    decreaseDifficulty(current) {
        const order = ['easy', 'medium', 'hard'];
        const index = order.indexOf(current);
        return index > 0 ? order[index - 1] : current;
    }

    /**
     * 가장 가까운 난이도 문제 선택
     */
    selectNearestDifficulty(problems, targetDifficulty) {
        const difficultyOrder = ['easy', 'medium', 'hard'];
        const targetIndex = difficultyOrder.indexOf(targetDifficulty);

        // 인접한 난이도 순서로 탐색
        for (let offset = 1; offset <= 2; offset++) {
            const lowerIndex = targetIndex - offset;
            const higherIndex = targetIndex + offset;

            if (lowerIndex >= 0) {
                const lowerProblems = problems.filter(p => p.difficulty === difficultyOrder[lowerIndex]);
                if (lowerProblems.length > 0) {
                    return lowerProblems[0];
                }
            }

            if (higherIndex < difficultyOrder.length) {
                const higherProblems = problems.filter(p => p.difficulty === difficultyOrder[higherIndex]);
                if (higherProblems.length > 0) {
                    return higherProblems[0];
                }
            }
        }

        // 그래도 없으면 첫 번째 문제
        return problems[0];
    }

    /**
     * 기본 문제 생성 (데이터가 없을 때)
     */
    generateDefaultProblem() {
        const defaultProblems = [
            { id: 'default_1', title: 'log₂(4)', base: 2, value: 4, correct_answer: 2, difficulty: 'easy' },
            { id: 'default_2', title: 'log₂(8)', base: 2, value: 8, correct_answer: 3, difficulty: 'easy' },
            { id: 'default_3', title: 'log₃(9)', base: 3, value: 9, correct_answer: 2, difficulty: 'easy' },
            { id: 'default_4', title: 'log₂(16)', base: 2, value: 16, correct_answer: 4, difficulty: 'medium' },
            { id: 'default_5', title: 'log₅(25)', base: 5, value: 25, correct_answer: 2, difficulty: 'medium' }
        ];

        // 사용자 수준에 맞는 문제 선택
        const levelMap = {
            'beginner': 'easy',
            'intermediate': 'medium',
            'advanced': 'hard'
        };

        const targetDifficulty = levelMap[this.userLevel];
        const suitableProblems = defaultProblems.filter(p => p.difficulty === targetDifficulty);

        return suitableProblems.length > 0 ? suitableProblems[0] : defaultProblems[0];
    }

    /**
     * 학습 경로 생성
     */
    async generateLearningPath(count = 10) {
        const path = [];

        for (let i = 0; i < count; i++) {
            const problem = await this.recommendNextProblem();
            path.push(problem);

            // 가상으로 시도한 것으로 표시 (중복 방지)
            await this.storage.saveProgress(problem.id, {
                planned: true,
                position: i
            });
        }

        return path;
    }

    /**
     * 약점 분석
     */
    async analyzeWeaknesses() {
        const allProblems = await this.storage.getAllProblems();
        const weaknesses = [];

        for (const problem of allProblems) {
            const stats = await this.storage.getProblemStatistics(problem.id);

            if (stats.attempts > 0) {
                const successRate = (stats.correct / stats.attempts) * 100;

                if (successRate < 60) {
                    weaknesses.push({
                        problem,
                        successRate,
                        attempts: stats.attempts,
                        suggestion: this.generateWeaknessSuggestion(problem, successRate)
                    });
                }
            }
        }

        // 성공률이 낮은 순으로 정렬
        weaknesses.sort((a, b) => a.successRate - b.successRate);

        return weaknesses;
    }

    /**
     * 약점 개선 제안 생성
     */
    generateWeaknessSuggestion(problem, successRate) {
        if (successRate < 30) {
            return `${problem.title}은(는) 매우 어려워하는 유형입니다. 기초부터 다시 학습하는 것을 권장합니다.`;
        } else if (successRate < 60) {
            return `${problem.title} 유형을 더 연습해보세요. 비슷한 문제로 반복 학습하면 좋습니다.`;
        } else {
            return `${problem.title}은(는) 조금 더 연습하면 완벽하게 마스터할 수 있습니다!`;
        }
    }

    /**
     * 학습 스타일 설정
     */
    setLearningStyle(style) {
        const validStyles = ['adaptive', 'sequential', 'random'];
        if (validStyles.includes(style)) {
            this.learningStyle = style;
        }
    }

    /**
     * 추천 이유 생성
     */
    async getRecommendationReason(problem) {
        const stats = await this.storage.getProblemStatistics(problem.id);

        if (stats.attempts === 0) {
            return '새로운 유형의 문제입니다. 도전해보세요!';
        }

        if (stats.correct === 0) {
            return '이전에 틀렸던 문제입니다. 다시 한번 도전해보세요!';
        }

        const successRate = (stats.correct / stats.attempts) * 100;

        if (successRate < 60) {
            return '복습이 필요한 문제입니다.';
        }

        if (successRate === 100) {
            return '완벽하게 풀었던 문제입니다. 실력 유지를 위한 복습용입니다.';
        }

        return `현재 수준에 적합한 문제입니다. (정답률: ${successRate.toFixed(1)}%)`;
    }
}

// 전역에서 사용 가능하도록 내보내기
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecommendationEngine;
}
