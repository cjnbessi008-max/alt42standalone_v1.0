/**
 * 그래프 유틸리티 함수
 * 수학 함수를 그래프 데이터로 변환
 */

const GraphUtils = {
    /**
     * 수학 함수 문자열을 평가하여 점 배열 생성
     * @param {string} functionStr - 수학 함수 문자열 (예: "x^2", "2*x + 1", "sin(x)")
     * @param {number} xMin - X축 최소값
     * @param {number} xMax - X축 최대값
     * @param {number} steps - 점의 개수
     * @returns {Object} - { points, xMin, xMax, yMin, yMax }
     */
    generatePoints(functionStr, xMin = -5, xMax = 5, steps = 100) {
        const points = [];
        const step = (xMax - xMin) / steps;

        let yMin = Infinity;
        let yMax = -Infinity;

        for (let i = 0; i <= steps; i++) {
            const x = xMin + i * step;
            const y = this.evaluateFunction(functionStr, x);

            if (!isNaN(y) && isFinite(y)) {
                points.push({ x, y });
                yMin = Math.min(yMin, y);
                yMax = Math.max(yMax, y);
            }
        }

        // Y축 범위 조정 (여백 추가)
        const yPadding = (yMax - yMin) * 0.1 || 1;
        yMin -= yPadding;
        yMax += yPadding;

        return {
            points,
            xMin,
            xMax,
            yMin,
            yMax
        };
    },

    /**
     * 수학 함수 문자열 평가
     * @param {string} functionStr - 수학 함수 문자열
     * @param {number} x - X 값
     * @returns {number} - 계산된 Y 값
     */
    evaluateFunction(functionStr, x) {
        try {
            // 함수 문자열 전처리
            let processedStr = functionStr
                .replace(/\^/g, '**')  // x^2 -> x**2
                .replace(/(\d)([x])/g, '$1*$2')  // 2x -> 2*x
                .replace(/(\))(\d|x|\()/g, '$1*$2')  // )(2 -> )*(2
                .replace(/(\d|\))(\()/g, '$1*$2');  // 2( -> 2*(

            // Math 함수들을 사용할 수 있도록 준비
            const mathFunctions = {
                sin: Math.sin,
                cos: Math.cos,
                tan: Math.tan,
                sqrt: Math.sqrt,
                abs: Math.abs,
                log: Math.log,
                exp: Math.exp,
                pow: Math.pow,
                PI: Math.PI,
                E: Math.E,
                x: x
            };

            // 안전한 함수 평가를 위한 컨텍스트 생성
            const func = new Function(...Object.keys(mathFunctions), `return ${processedStr}`);
            return func(...Object.values(mathFunctions));
        } catch (error) {
            console.error('함수 평가 오류:', error);
            return NaN;
        }
    },

    /**
     * 미리 정의된 샘플 그래프 가져오기
     * @returns {Array} - 샘플 그래프 배열
     */
    getSampleGraphs() {
        return [
            {
                id: 1,
                name: '이차 함수',
                function: 'x**2',
                xMin: -3,
                xMax: 3,
                difficulty: '쉬움',
                correctArea: 18  // 대략적인 넓이
            },
            {
                id: 2,
                name: '일차 함수',
                function: '2*x + 1',
                xMin: 0,
                xMax: 4,
                difficulty: '쉬움',
                correctArea: 24
            },
            {
                id: 3,
                name: '삼차 함수',
                function: 'x**3 - 2*x',
                xMin: -2,
                xMax: 2,
                difficulty: '보통',
                correctArea: 8
            },
            {
                id: 4,
                name: '사인 함수',
                function: 'sin(x) + 2',
                xMin: 0,
                xMax: 6.28,
                difficulty: '보통',
                correctArea: 12.56
            },
            {
                id: 5,
                name: '제곱근 함수',
                function: 'sqrt(x)',
                xMin: 0,
                xMax: 9,
                difficulty: '보통',
                correctArea: 18
            },
            {
                id: 6,
                name: '복합 함수',
                function: 'x**2 - 4*x + 5',
                xMin: 0,
                xMax: 4,
                difficulty: '어려움',
                correctArea: 10.67
            },
            {
                id: 7,
                name: '절댓값 함수',
                function: 'abs(x - 2) + 1',
                xMin: -2,
                xMax: 6,
                difficulty: '보통',
                correctArea: 24
            },
            {
                id: 8,
                name: '코사인 함수',
                function: 'cos(x) + 1.5',
                xMin: 0,
                xMax: 6.28,
                difficulty: '보통',
                correctArea: 9.42
            }
        ];
    },

    /**
     * 문제 데이터로부터 그래프 데이터 생성
     * @param {Object} problem - 문제 객체
     * @returns {Object} - 그래프 데이터
     */
    createGraphDataFromProblem(problem) {
        const functionStr = problem.function || 'x**2';
        const xMin = problem.xMin || -5;
        const xMax = problem.xMax || 5;

        const graphData = this.generatePoints(functionStr, xMin, xMax, 150);

        return {
            ...graphData,
            problemId: problem.id,
            problemName: problem.name,
            difficulty: problem.difficulty,
            correctArea: problem.correctArea
        };
    },

    /**
     * 랜덤 문제 선택
     * @param {number} difficulty - 난이도 (1: 쉬움, 2: 보통, 3: 어려움)
     * @returns {Object} - 문제 객체
     */
    getRandomProblem(difficulty = null) {
        const samples = this.getSampleGraphs();

        if (difficulty !== null) {
            const difficultyMap = { 1: '쉬움', 2: '보통', 3: '어려움' };
            const targetDifficulty = difficultyMap[difficulty];
            const filtered = samples.filter(s => s.difficulty === targetDifficulty);

            if (filtered.length > 0) {
                return filtered[Math.floor(Math.random() * filtered.length)];
            }
        }

        return samples[Math.floor(Math.random() * samples.length)];
    },

    /**
     * 정확도 계산
     * @param {number} userAnswer - 사용자 답안
     * @param {number} correctAnswer - 정답
     * @param {number} tolerance - 허용 오차 (%)
     * @returns {Object} - { isCorrect, accuracy }
     */
    checkAnswer(userAnswer, correctAnswer, tolerance = 5) {
        const difference = Math.abs(userAnswer - correctAnswer);
        const percentDifference = (difference / correctAnswer) * 100;
        const accuracy = Math.max(0, 100 - percentDifference);

        return {
            isCorrect: percentDifference <= tolerance,
            accuracy: accuracy.toFixed(2),
            difference: difference.toFixed(2)
        };
    }
};

// 전역 객체로 노출
window.GraphUtils = GraphUtils;
