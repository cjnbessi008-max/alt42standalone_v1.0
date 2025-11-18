/**
 * Problem Database
 * 독립형 웹앱용 로컬 문제 데이터베이스
 */

class ProblemDatabase {
    constructor() {
        this.problems = this.initializeProblems();
        this.categories = ['대수학', '기하학', '분수', '방정식', '도형', '확률', '통계'];
    }

    /**
     * 문제 데이터베이스 초기화
     */
    initializeProblems() {
        return [
            // === 쉬운 문제 (Easy) ===
            {
                id: 1,
                category: '대수학',
                difficulty: 'easy',
                question: '5 + 3의 값을 구하시오.',
                answer: '8',
                hint: '5개에 3개를 더하면 몇 개가 될까요?',
                explanation: '5 + 3 = 8입니다. 덧셈의 기본 문제입니다.',
                points: 10
            },
            {
                id: 2,
                category: '대수학',
                difficulty: 'easy',
                question: '12 - 7의 값을 구하시오.',
                answer: '5',
                hint: '12에서 7을 빼면 얼마가 남을까요?',
                explanation: '12 - 7 = 5입니다. 뺄셈의 기본 문제입니다.',
                points: 10
            },
            {
                id: 3,
                category: '대수학',
                difficulty: 'easy',
                question: '6 × 4의 값을 구하시오.',
                answer: '24',
                hint: '6을 4번 더하면 됩니다.',
                explanation: '6 × 4 = 24입니다. 6 + 6 + 6 + 6 = 24와 같습니다.',
                points: 10
            },
            {
                id: 4,
                category: '대수학',
                difficulty: 'easy',
                question: '20 ÷ 4의 값을 구하시오.',
                answer: '5',
                hint: '20을 4개로 나누면 각각 얼마일까요?',
                explanation: '20 ÷ 4 = 5입니다. 20을 4로 나누면 5가 됩니다.',
                points: 10
            },
            {
                id: 5,
                category: '기하학',
                difficulty: 'easy',
                question: '정사각형의 한 변이 5cm일 때, 둘레는 몇 cm인가요?',
                answer: '20',
                hint: '정사각형은 네 변이 모두 같습니다.',
                explanation: '정사각형의 둘레 = 5 × 4 = 20cm입니다.',
                points: 10
            },

            // === 중간 난이도 (Medium) ===
            {
                id: 6,
                category: '분수',
                difficulty: 'medium',
                question: '1/3 + 1/4의 값을 구하시오. (분수 또는 소수로 답하세요)',
                answer: ['7/12', '0.583', '0.58'],
                hint: '분모를 12로 통분하세요.',
                explanation: '1/3 = 4/12, 1/4 = 3/12이므로 4/12 + 3/12 = 7/12입니다.',
                points: 20
            },
            {
                id: 7,
                category: '방정식',
                difficulty: 'medium',
                question: '2x + 5 = 13일 때, x의 값을 구하시오.',
                answer: '4',
                hint: '양변에서 5를 빼고, 2로 나누세요.',
                explanation: '2x = 13 - 5 = 8, x = 8 ÷ 2 = 4입니다.',
                points: 20
            },
            {
                id: 8,
                category: '기하학',
                difficulty: 'medium',
                question: '반지름이 5cm인 원의 넓이를 구하시오. (π = 3.14)',
                answer: ['78.5', '78.50', '25π'],
                hint: '원의 넓이 = π × r²',
                explanation: '넓이 = 3.14 × 5² = 3.14 × 25 = 78.5 cm²입니다.',
                points: 20
            },
            {
                id: 9,
                category: '방정식',
                difficulty: 'medium',
                question: '3(x - 2) = 15일 때, x의 값을 구하시오.',
                answer: '7',
                hint: '먼저 괄호를 풀거나, 양변을 3으로 나누세요.',
                explanation: 'x - 2 = 5, x = 7입니다.',
                points: 20
            },
            {
                id: 10,
                category: '확률',
                difficulty: 'medium',
                question: '주사위를 한 번 던질 때, 짝수가 나올 확률은? (분수로 답하세요)',
                answer: ['1/2', '0.5', '3/6'],
                hint: '짝수는 2, 4, 6입니다.',
                explanation: '전체 6개 중 짝수는 3개이므로 3/6 = 1/2입니다.',
                points: 20
            },

            // === 어려운 문제 (Hard) ===
            {
                id: 11,
                category: '방정식',
                difficulty: 'hard',
                question: 'x² - 5x + 6 = 0일 때, x의 값을 모두 구하시오. (작은 값부터)',
                answer: ['2', '3', '2,3', '2, 3'],
                hint: '인수분해를 하면 (x-2)(x-3) = 0입니다.',
                explanation: '(x-2)(x-3) = 0이므로 x = 2 또는 x = 3입니다.',
                points: 30
            },
            {
                id: 12,
                category: '대수학',
                difficulty: 'hard',
                question: '등차수열 2, 5, 8, 11, ...의 10번째 항을 구하시오.',
                answer: '29',
                hint: '첫째항 a = 2, 공차 d = 3입니다. an = a + (n-1)d',
                explanation: 'a₁₀ = 2 + (10-1)×3 = 2 + 27 = 29입니다.',
                points: 30
            },
            {
                id: 13,
                category: '기하학',
                difficulty: 'hard',
                question: '밑변이 6cm, 높이가 8cm인 삼각형의 빗변의 길이는? (피타고라스 정리)',
                answer: '10',
                hint: 'a² + b² = c²를 사용하세요.',
                explanation: '6² + 8² = 36 + 64 = 100, √100 = 10cm입니다.',
                points: 30
            },
            {
                id: 14,
                category: '확률',
                difficulty: 'hard',
                question: '동전 3개를 동시에 던질 때, 앞면이 정확히 2개 나올 확률은? (분수로 답하세요)',
                answer: ['3/8', '0.375'],
                hint: '전체 경우의 수는 2³ = 8입니다.',
                explanation: 'HHT, HTH, THH 3가지이므로 3/8입니다.',
                points: 30
            },
            {
                id: 15,
                category: '대수학',
                difficulty: 'hard',
                question: '2ˣ = 32일 때, x의 값을 구하시오.',
                answer: '5',
                hint: '32 = 2의 몇 제곱일까요?',
                explanation: '2⁵ = 32이므로 x = 5입니다.',
                points: 30
            },

            // === 추가 중간 난이도 ===
            {
                id: 16,
                category: '분수',
                difficulty: 'medium',
                question: '2/5 × 3/4의 값을 구하시오. (기약분수로)',
                answer: ['3/10', '6/20'],
                hint: '분자끼리, 분모끼리 곱하세요.',
                explanation: '(2×3)/(5×4) = 6/20 = 3/10입니다.',
                points: 20
            },
            {
                id: 17,
                category: '도형',
                difficulty: 'medium',
                question: '가로 8cm, 세로 5cm인 직사각형의 넓이는?',
                answer: '40',
                hint: '직사각형의 넓이 = 가로 × 세로',
                explanation: '8 × 5 = 40 cm²입니다.',
                points: 20
            },
            {
                id: 18,
                category: '대수학',
                difficulty: 'medium',
                question: '15의 약수의 개수를 구하시오.',
                answer: '4',
                hint: '15를 나누어떨어지게 하는 수를 모두 찾으세요.',
                explanation: '15의 약수는 1, 3, 5, 15로 총 4개입니다.',
                points: 20
            },
            {
                id: 19,
                category: '통계',
                difficulty: 'medium',
                question: '5, 8, 6, 9, 7의 평균을 구하시오.',
                answer: '7',
                hint: '모두 더한 후 개수로 나누세요.',
                explanation: '(5+8+6+9+7) ÷ 5 = 35 ÷ 5 = 7입니다.',
                points: 20
            },
            {
                id: 20,
                category: '방정식',
                difficulty: 'medium',
                question: '5x - 3 = 2x + 9일 때, x의 값은?',
                answer: '4',
                hint: 'x가 있는 항은 왼쪽으로, 상수는 오른쪽으로 이항하세요.',
                explanation: '5x - 2x = 9 + 3, 3x = 12, x = 4입니다.',
                points: 20
            },

            // === 추가 쉬운 문제 ===
            {
                id: 21,
                category: '대수학',
                difficulty: 'easy',
                question: '7 + 8의 값을 구하시오.',
                answer: '15',
                hint: '7개에 8개를 더하면 됩니다.',
                explanation: '7 + 8 = 15입니다.',
                points: 10
            },
            {
                id: 22,
                category: '대수학',
                difficulty: 'easy',
                question: '9 × 3의 값을 구하시오.',
                answer: '27',
                hint: '9를 3번 더하면 됩니다.',
                explanation: '9 × 3 = 27입니다.',
                points: 10
            },
            {
                id: 23,
                category: '기하학',
                difficulty: 'easy',
                question: '정삼각형의 한 내각은 몇 도인가요?',
                answer: '60',
                hint: '삼각형의 내각의 합은 180도이고, 정삼각형은 모든 각이 같습니다.',
                explanation: '180 ÷ 3 = 60도입니다.',
                points: 10
            },
            {
                id: 24,
                category: '분수',
                difficulty: 'easy',
                question: '1/2 + 1/2의 값을 구하시오.',
                answer: ['1', '2/2', '1.0'],
                hint: '반 더하기 반은 하나입니다.',
                explanation: '1/2 + 1/2 = 2/2 = 1입니다.',
                points: 10
            },
            {
                id: 25,
                category: '대수학',
                difficulty: 'easy',
                question: '100 - 37의 값을 구하시오.',
                answer: '63',
                hint: '100에서 30을 빼면 70, 거기서 7을 더 빼세요.',
                explanation: '100 - 37 = 63입니다.',
                points: 10
            }
        ];
    }

    /**
     * ID로 문제 가져오기
     */
    getProblemById(id) {
        return this.problems.find(p => p.id === id);
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
     * 필터링된 문제 가져오기
     */
    getProblems(filters = {}) {
        let filtered = this.problems;

        if (filters.difficulty) {
            filtered = filtered.filter(p => p.difficulty === filters.difficulty);
        }

        if (filters.category) {
            filtered = filtered.filter(p => p.category === filters.category);
        }

        if (filters.excludeIds) {
            filtered = filtered.filter(p => !filters.excludeIds.includes(p.id));
        }

        return filtered;
    }

    /**
     * 랜덤 문제 가져오기
     */
    getRandomProblem(filters = {}) {
        const problems = this.getProblems(filters);

        if (problems.length === 0) {
            return null;
        }

        const randomIndex = Math.floor(Math.random() * problems.length);
        return problems[randomIndex];
    }

    /**
     * 답안 체크
     */
    checkAnswer(problemId, userAnswer) {
        const problem = this.getProblemById(problemId);

        if (!problem) {
            return { isCorrect: false, message: '문제를 찾을 수 없습니다.' };
        }

        const correctAnswers = Array.isArray(problem.answer)
            ? problem.answer
            : [problem.answer];

        const normalizedUserAnswer = String(userAnswer).trim().toLowerCase();
        const isCorrect = correctAnswers.some(ans =>
            String(ans).trim().toLowerCase() === normalizedUserAnswer
        );

        return {
            isCorrect,
            correctAnswer: correctAnswers[0],
            explanation: problem.explanation,
            points: isCorrect ? problem.points : 0
        };
    }

    /**
     * 카테고리 목록 가져오기
     */
    getCategories() {
        return this.categories;
    }

    /**
     * 난이도 목록 가져오기
     */
    getDifficulties() {
        return ['easy', 'medium', 'hard'];
    }

    /**
     * 전체 문제 수
     */
    getTotalProblems() {
        return this.problems.length;
    }

    /**
     * 통계 정보
     */
    getStatistics() {
        const stats = {
            total: this.problems.length,
            byDifficulty: {},
            byCategory: {}
        };

        this.getDifficulties().forEach(diff => {
            stats.byDifficulty[diff] = this.problems.filter(p => p.difficulty === diff).length;
        });

        this.getCategories().forEach(cat => {
            stats.byCategory[cat] = this.problems.filter(p => p.category === cat).length;
        });

        return stats;
    }
}

// 전역 인스턴스 생성
const problemDB = new ProblemDatabase();
