/**
 * Problem Database - 독립형 문제 데이터베이스
 * PHP/MySQL 대신 JavaScript 객체로 문제 관리
 */

class ProblemDatabase {
    constructor() {
        this.problems = this.initializeProblems();
        this.categories = this.getCategories();
    }

    /**
     * 문제 데이터 초기화
     */
    initializeProblems() {
        return [
            {
                id: 'PROB001',
                title: '이차함수의 근 찾기 - 기본',
                function: 'x^2 - 4',
                description: '이차함수 f(x) = x² - 4의 근을 모두 찾으세요.',
                difficulty: '쉬움',
                category: '이차함수',
                expectedRoots: [-2, 2],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '이 함수는 완전제곱식으로 인수분해할 수 있습니다.',
                    'x² - 4 = (x-2)(x+2) 형태입니다.',
                    '근은 x = 2와 x = -2입니다.'
                ]
            },
            {
                id: 'PROB002',
                title: '삼차함수의 근 찾기',
                function: 'x^3 - 6*x^2 + 11*x - 6',
                description: '삼차함수 f(x) = x³ - 6x² + 11x - 6의 근을 모두 찾으세요.',
                difficulty: '보통',
                category: '삼차함수',
                expectedRoots: [1, 2, 3],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '이 삼차함수는 세 개의 정수 근을 가집니다.',
                    '인수정리를 사용하면 (x-1)(x-2)(x-3)로 인수분해됩니다.',
                    '근은 1, 2, 3입니다.'
                ]
            },
            {
                id: 'PROB003',
                title: '이차함수 - 인수분해',
                function: 'x^2 - 2*x - 3',
                description: '이차함수 f(x) = x² - 2x - 3의 근을 찾으세요.',
                difficulty: '쉬움',
                category: '이차함수',
                expectedRoots: [-1, 3],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '십자 인수분해를 사용할 수 있습니다.',
                    '(x-3)(x+1) = 0',
                    '근은 x = 3과 x = -1입니다.'
                ]
            },
            {
                id: 'PROB004',
                title: '완전제곱식',
                function: 'x^2 - 6*x + 9',
                description: '완전제곱식 f(x) = x² - 6x + 9의 근을 찾으세요.',
                difficulty: '쉬움',
                category: '이차함수',
                expectedRoots: [3],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '이 함수는 완전제곱식입니다.',
                    '(x-3)² = 0',
                    '중근 x = 3을 가집니다.'
                ]
            },
            {
                id: 'PROB005',
                title: '삼차함수 - 중근',
                function: 'x^3 - 3*x^2 + 3*x - 1',
                description: '삼차함수 f(x) = (x-1)³의 근을 찾으세요.',
                difficulty: '보통',
                category: '삼차함수',
                expectedRoots: [1],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '이 함수는 삼중근을 가집니다.',
                    '(x-1)³ = 0',
                    '근은 x = 1 (삼중근)입니다.'
                ]
            },
            {
                id: 'PROB006',
                title: '사차함수',
                function: 'x^4 - 5*x^2 + 4',
                description: '사차함수 f(x) = x⁴ - 5x² + 4의 근을 모두 찾으세요.',
                difficulty: '보통',
                category: '사차함수',
                expectedRoots: [-2, -1, 1, 2],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    'u = x²로 치환하면 이차방정식이 됩니다.',
                    'u² - 5u + 4 = (u-1)(u-4) = 0',
                    'x² = 1 또는 x² = 4이므로 네 개의 근이 있습니다.'
                ]
            },
            {
                id: 'PROB007',
                title: '이차함수 - 실근 없음',
                function: 'x^2 + 4',
                description: '이차함수 f(x) = x² + 4의 실근을 찾으세요.',
                difficulty: '보통',
                category: '이차함수',
                expectedRoots: [],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '판별식 D = b² - 4ac를 계산해보세요.',
                    'D = 0 - 16 = -16 < 0',
                    '판별식이 음수이므로 실근이 없습니다.'
                ]
            },
            {
                id: 'PROB008',
                title: '이차함수 - 소인수분해',
                function: 'x^2 - 5*x + 6',
                description: '이차함수 f(x) = x² - 5x + 6을 인수분해하고 근을 찾으세요.',
                difficulty: '쉬움',
                category: '이차함수',
                expectedRoots: [2, 3],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '두 수의 곱이 6, 합이 5인 수를 찾아보세요.',
                    '2와 3입니다.',
                    '(x-2)(x-3) = 0이므로 근은 2, 3입니다.'
                ]
            },
            {
                id: 'PROB009',
                title: '삼차함수 응용',
                function: 'x^3 - x',
                description: '삼차함수 f(x) = x³ - x의 근을 모두 찾으세요.',
                difficulty: '보통',
                category: '삼차함수',
                expectedRoots: [-1, 0, 1],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    'x를 공통인수로 빼낼 수 있습니다.',
                    'x(x² - 1) = x(x-1)(x+1) = 0',
                    '근은 -1, 0, 1입니다.'
                ]
            },
            {
                id: 'PROB010',
                title: '삼차함수 - 복잡',
                function: 'x^3 - 7*x + 6',
                description: '삼차함수 f(x) = x³ - 7x + 6의 근을 모두 찾으세요.',
                difficulty: '어려움',
                category: '삼차함수',
                expectedRoots: [-3, 1, 2],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '인수정리를 사용해보세요. f(1)을 계산하면?',
                    'f(1) = 1 - 7 + 6 = 0이므로 (x-1)이 인수입니다.',
                    '조립제법으로 (x-1)(x²+x-6) = (x-1)(x+3)(x-2)입니다.'
                ]
            },
            {
                id: 'PROB011',
                title: '이차함수 - 음수 계수',
                function: '-x^2 + 9',
                description: '이차함수 f(x) = -x² + 9의 근을 찾으세요.',
                difficulty: '쉬움',
                category: '이차함수',
                expectedRoots: [-3, 3],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '-1을 인수로 빼면 -(x² - 9) = 0',
                    'x² - 9 = (x-3)(x+3) = 0',
                    '근은 -3, 3입니다.'
                ]
            },
            {
                id: 'PROB012',
                title: '고차 다항식',
                function: 'x^4 - 1',
                description: '사차함수 f(x) = x⁴ - 1의 근을 모두 찾으세요.',
                difficulty: '보통',
                category: '사차함수',
                expectedRoots: [-1, 1],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '차 공식을 사용할 수 있습니다.',
                    'x⁴ - 1 = (x² - 1)(x² + 1)',
                    'x² - 1 = (x-1)(x+1)이므로 실근은 -1, 1입니다.'
                ]
            },
            {
                id: 'PROB013',
                title: '삼차함수 - 대칭',
                function: 'x^3 - 4*x',
                description: '삼차함수 f(x) = x³ - 4x의 근을 찾으세요.',
                difficulty: '보통',
                category: '삼차함수',
                expectedRoots: [-2, 0, 2],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    'x를 공통인수로 빼보세요.',
                    'x(x² - 4) = x(x-2)(x+2) = 0',
                    '근은 -2, 0, 2입니다.'
                ]
            },
            {
                id: 'PROB014',
                title: '이차함수 - 분수 근',
                function: '2*x^2 - 5*x + 2',
                description: '이차함수 f(x) = 2x² - 5x + 2의 근을 찾으세요.',
                difficulty: '보통',
                category: '이차함수',
                expectedRoots: [0.5, 2],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    '근의 공식을 사용해보세요.',
                    '(2x-1)(x-2) = 0',
                    '근은 x = 1/2, x = 2입니다.'
                ]
            },
            {
                id: 'PROB015',
                title: '삼차함수 - 도전',
                function: 'x^3 + 2*x^2 - 5*x - 6',
                description: '삼차함수 f(x) = x³ + 2x² - 5x - 6의 근을 찾으세요.',
                difficulty: '어려움',
                category: '삼차함수',
                expectedRoots: [-3, -1, 2],
                tolerance: 0.01,
                minX: -10,
                maxX: 10,
                hints: [
                    'f(2) = 8 + 8 - 10 - 6 = 0이므로 (x-2)가 인수입니다.',
                    '조립제법으로 나누면 (x-2)(x²+4x+3)',
                    'x²+4x+3 = (x+1)(x+3)이므로 근은 -3, -1, 2입니다.'
                ]
            }
        ];
    }

    /**
     * 카테고리 목록 가져오기
     */
    getCategories() {
        const categories = [...new Set(this.problems.map(p => p.category))];
        return categories.sort();
    }

    /**
     * 모든 문제 가져오기
     */
    getAllProblems() {
        return this.problems;
    }

    /**
     * ID로 문제 가져오기
     */
    getProblemById(id) {
        return this.problems.find(p => p.id === id) || null;
    }

    /**
     * 랜덤 문제 가져오기
     */
    getRandomProblem(difficulty = null, category = null) {
        let filtered = this.problems;

        if (difficulty) {
            filtered = filtered.filter(p => p.difficulty === difficulty);
        }

        if (category) {
            filtered = filtered.filter(p => p.category === category);
        }

        if (filtered.length === 0) {
            return this.problems[0];
        }

        const randomIndex = Math.floor(Math.random() * filtered.length);
        return filtered[randomIndex];
    }

    /**
     * 난이도별 문제 가져오기
     */
    getProblemsByDifficulty(difficulty) {
        return this.problems.filter(p => p.difficulty === difficulty);
    }

    /**
     * 카테고리별 문제 가져오기
     */
    getProblemsByCategory(category) {
        return this.problems.filter(p => p.category === category);
    }

    /**
     * 문제 검색
     */
    searchProblems(query) {
        const lowerQuery = query.toLowerCase();
        return this.problems.filter(p =>
            p.title.toLowerCase().includes(lowerQuery) ||
            p.description.toLowerCase().includes(lowerQuery) ||
            p.function.toLowerCase().includes(lowerQuery) ||
            p.category.toLowerCase().includes(lowerQuery)
        );
    }

    /**
     * 난이도 목록
     */
    getDifficulties() {
        return ['쉬움', '보통', '어려움', '매우 어려움'];
    }

    /**
     * 문제 통계
     */
    getStatistics() {
        const stats = {
            total: this.problems.length,
            byDifficulty: {},
            byCategory: {}
        };

        this.problems.forEach(p => {
            // 난이도별
            stats.byDifficulty[p.difficulty] = (stats.byDifficulty[p.difficulty] || 0) + 1;

            // 카테고리별
            stats.byCategory[p.category] = (stats.byCategory[p.category] || 0) + 1;
        });

        return stats;
    }

    /**
     * 답안 평가
     */
    evaluateAnswer(problemId, userRoots) {
        const problem = this.getProblemById(problemId);

        if (!problem) {
            return {
                success: false,
                error: 'Problem not found'
            };
        }

        const expectedRoots = problem.expectedRoots;
        const tolerance = problem.tolerance || 0.01;

        // 근 비교
        let correctCount = 0;
        const matchedExpected = new Set();

        userRoots.forEach(userRoot => {
            expectedRoots.forEach((expected, index) => {
                if (!matchedExpected.has(index) &&
                    Math.abs(userRoot.x - expected) < tolerance) {
                    correctCount++;
                    matchedExpected.add(index);
                }
            });
        });

        // 잘못된 근 개수
        const extraRoots = userRoots.length - correctCount;
        const missingRoots = expectedRoots.length - correctCount;

        // 점수 계산 (0-100)
        let score = expectedRoots.length > 0
            ? Math.round((correctCount / expectedRoots.length) * 100)
            : 0;

        // 감점: 잘못된 근
        if (extraRoots > 0) {
            score -= extraRoots * 10;
        }

        score = Math.max(0, Math.min(100, score));

        // 피드백 생성
        const feedback = this.generateFeedback(
            correctCount,
            expectedRoots.length,
            extraRoots,
            missingRoots
        );

        return {
            success: true,
            score: score,
            correct: correctCount === expectedRoots.length && extraRoots === 0,
            correctCount: correctCount,
            totalExpected: expectedRoots.length,
            extraRoots: extraRoots,
            missingRoots: missingRoots,
            feedback: feedback
        };
    }

    /**
     * 피드백 생성
     */
    generateFeedback(correct, total, extra, missing) {
        if (correct === total && extra === 0) {
            return "🎉 완벽합니다! 모든 근을 정확하게 찾았습니다.";
        } else if (correct === total && extra > 0) {
            return `✅ 모든 근을 찾았지만, ${extra}개의 잘못된 근이 포함되어 있습니다.`;
        } else if (correct > 0) {
            return `📊 ${total}개 중 ${correct}개의 근을 찾았습니다. ${missing}개의 근이 누락되었습니다.`;
        } else {
            return "❌ 근을 찾지 못했습니다. 다시 시도해보세요!";
        }
    }
}

// 전역 객체로 노출
window.ProblemDatabase = ProblemDatabase;
