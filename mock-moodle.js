/**
 * Moodle LMS Mock Data Simulation
 * MySQL 5.7 + PHP 7.1.9 + Moodle 3.7 환경 시뮬레이션
 */

class MoodleLMS {
    constructor() {
        this.problems = [
            {
                id: 1001,
                title: "기본 벡터 내적",
                description: "두 벡터의 내적을 계산하세요",
                vectorA: { x: 3, y: 4 },
                vectorB: { x: 2, y: 1 },
                difficulty: "easy",
                expectedAnswer: 10
            },
            {
                id: 1002,
                title: "수직 벡터 (Orthogonal Case)",
                description: "수직인 두 벡터의 내적을 계산하세요",
                vectorA: { x: 1, y: 0 },
                vectorB: { x: 0, y: 1 },
                difficulty: "medium",
                expectedAnswer: 0,
                isOrthogonal: true
            },
            {
                id: 1003,
                title: "반대 방향 벡터",
                description: "반대 방향 벡터의 내적을 계산하세요",
                vectorA: { x: 2, y: 3 },
                vectorB: { x: -2, y: -3 },
                difficulty: "medium",
                expectedAnswer: -13
            },
            {
                id: 1004,
                title: "복잡한 수직 벡터",
                description: "더 복잡한 수직 벡터의 내적을 계산하세요",
                vectorA: { x: 3, y: 4 },
                vectorB: { x: -4, y: 3 },
                difficulty: "hard",
                expectedAnswer: 0,
                isOrthogonal: true
            },
            {
                id: 1005,
                title: "소수점 벡터",
                description: "소수점이 포함된 벡터의 내적을 계산하세요",
                vectorA: { x: 1.5, y: 2.5 },
                vectorB: { x: 3.2, y: 1.8 },
                difficulty: "hard",
                expectedAnswer: 9.3
            },
            {
                id: 1006,
                title: "또 다른 수직 벡터",
                description: "또 다른 수직 벡터 쌍의 내적을 계산하세요",
                vectorA: { x: 5, y: -2 },
                vectorB: { x: 2, y: 5 },
                difficulty: "medium",
                expectedAnswer: 0,
                isOrthogonal: true
            }
        ];

        this.currentProblemIndex = 0;
        this.userProgress = {
            totalProblems: 0,
            correctAnswers: 0,
            orthogonalProblemsAttempted: 0,
            orthogonalProblemsCorrect: 0
        };
    }

    /**
     * Moodle에서 문제를 가져오는 시뮬레이션
     * 실제로는 PHP + MySQL을 통해 가져옴
     */
    async fetchProblem(problemId = null) {
        // 네트워크 지연 시뮬레이션
        await this.simulateNetworkDelay(300, 800);

        if (problemId !== null) {
            const problem = this.problems.find(p => p.id === problemId);
            if (!problem) {
                throw new Error(`Problem with ID ${problemId} not found`);
            }
            return this.formatProblemResponse(problem);
        }

        // 순차적으로 문제 제공
        const problem = this.problems[this.currentProblemIndex];
        this.currentProblemIndex = (this.currentProblemIndex + 1) % this.problems.length;

        return this.formatProblemResponse(problem);
    }

    /**
     * 랜덤 문제 가져오기
     */
    async fetchRandomProblem() {
        await this.simulateNetworkDelay(200, 600);

        const randomIndex = Math.floor(Math.random() * this.problems.length);
        const problem = this.problems[randomIndex];

        return this.formatProblemResponse(problem);
    }

    /**
     * 수직 벡터 문제만 가져오기 (Orthogonal Freeze 테스트용)
     */
    async fetchOrthogonalProblem() {
        await this.simulateNetworkDelay(200, 500);

        const orthogonalProblems = this.problems.filter(p => p.isOrthogonal);
        const randomIndex = Math.floor(Math.random() * orthogonalProblems.length);
        const problem = orthogonalProblems[randomIndex];

        return this.formatProblemResponse(problem);
    }

    /**
     * 문제 응답 포맷팅 (Moodle API 형식)
     */
    formatProblemResponse(problem) {
        return {
            success: true,
            data: {
                problem_id: problem.id,
                title: problem.title,
                description: problem.description,
                vectors: {
                    vector_a: problem.vectorA,
                    vector_b: problem.vectorB
                },
                difficulty: problem.difficulty,
                is_orthogonal: problem.isOrthogonal || false,
                metadata: {
                    course_id: 101,
                    module_id: 2001,
                    expected_answer: problem.expectedAnswer,
                    created_at: new Date().toISOString(),
                    moodle_version: "3.7",
                    php_version: "7.1.9",
                    mysql_version: "5.7"
                }
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 답안 제출 시뮬레이션
     */
    async submitAnswer(problemId, userAnswer, actualAnswer) {
        await this.simulateNetworkDelay(500, 1000);

        const problem = this.problems.find(p => p.id === problemId);
        const isCorrect = Math.abs(userAnswer - actualAnswer) < 0.01;

        // 진행상황 업데이트
        this.userProgress.totalProblems++;
        if (isCorrect) {
            this.userProgress.correctAnswers++;
        }

        if (problem && problem.isOrthogonal) {
            this.userProgress.orthogonalProblemsAttempted++;
            if (isCorrect) {
                this.userProgress.orthogonalProblemsCorrect++;
            }
        }

        return {
            success: true,
            data: {
                is_correct: isCorrect,
                user_answer: userAnswer,
                correct_answer: actualAnswer,
                feedback: this.generateFeedback(isCorrect, problem),
                points_earned: isCorrect ? this.calculatePoints(problem) : 0,
                progress: this.userProgress
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 피드백 생성
     */
    generateFeedback(isCorrect, problem) {
        if (isCorrect) {
            const messages = [
                "정답입니다! 잘하셨어요!",
                "훌륭합니다! 정확하게 계산했어요!",
                "완벽해요! 다음 문제로 넘어가세요!",
                "맞았습니다! 벡터 내적을 잘 이해하고 계시네요!"
            ];

            if (problem && problem.isOrthogonal) {
                return "정답입니다! 두 벡터가 수직(orthogonal)일 때 내적은 0이 됩니다. 완벽하게 이해하셨네요!";
            }

            return messages[Math.floor(Math.random() * messages.length)];
        } else {
            const hints = [
                "다시 한번 계산해보세요. 내적 공식: A·B = Ax×Bx + Ay×By",
                "힌트: 각 성분끼리 곱한 후 더해야 합니다.",
                "아쉽지만 틀렸습니다. 계산을 다시 확인해보세요.",
                "내적 계산법을 복습해보세요."
            ];

            if (problem && problem.isOrthogonal) {
                return "틀렸습니다. 힌트: 두 벡터가 수직이면 내적은 항상 0입니다.";
            }

            return hints[Math.floor(Math.random() * hints.length)];
        }
    }

    /**
     * 점수 계산
     */
    calculatePoints(problem) {
        const basePoints = {
            easy: 10,
            medium: 15,
            hard: 20
        };

        let points = basePoints[problem.difficulty] || 10;

        // 수직 벡터 문제는 보너스 점수
        if (problem.isOrthogonal) {
            points += 5;
        }

        return points;
    }

    /**
     * 사용자 진행 상황 조회
     */
    async fetchUserProgress() {
        await this.simulateNetworkDelay(200, 400);

        return {
            success: true,
            data: {
                ...this.userProgress,
                accuracy: this.userProgress.totalProblems > 0
                    ? (this.userProgress.correctAnswers / this.userProgress.totalProblems * 100).toFixed(1)
                    : 0,
                orthogonal_accuracy: this.userProgress.orthogonalProblemsAttempted > 0
                    ? (this.userProgress.orthogonalProblemsCorrect / this.userProgress.orthogonalProblemsAttempted * 100).toFixed(1)
                    : 0
            },
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 네트워크 지연 시뮬레이션
     */
    simulateNetworkDelay(minMs, maxMs) {
        const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    /**
     * 문제 목록 조회
     */
    async fetchAllProblems() {
        await this.simulateNetworkDelay(400, 800);

        return {
            success: true,
            data: this.problems.map(p => ({
                id: p.id,
                title: p.title,
                difficulty: p.difficulty,
                isOrthogonal: p.isOrthogonal || false
            })),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 진행 상황 초기화
     */
    resetProgress() {
        this.userProgress = {
            totalProblems: 0,
            correctAnswers: 0,
            orthogonalProblemsAttempted: 0,
            orthogonalProblemsCorrect: 0
        };
        this.currentProblemIndex = 0;
    }
}

// 전역 Moodle LMS 인스턴스 생성
const moodleLMS = new MoodleLMS();
