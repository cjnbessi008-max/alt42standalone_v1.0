/**
 * Factor Lego - Lego Engine
 * 인수분해 로직 및 레고 조각 관리 엔진
 */

class LegoEngine {
    constructor() {
        this.currentProblem = null;
        this.studentAnswer = [];
        this.legoTypes = {
            variable: { color: '#3498db', label: '변수' },
            coefficient: { color: '#e74c3c', label: '계수' },
            operator: { color: '#f39c12', label: '연산자' },
            parenthesis: { color: '#34495e', label: '괄호' },
            sign: { color: '#9b59b6', label: '부호' },
            exponent: { color: '#16a085', label: '지수' }
        };
    }

    /**
     * 문제 로드
     * @param {number} problemId - 문제 ID
     */
    async loadProblem(problemId) {
        try {
            const response = await fetch(`../api/problem_api.php?problem_id=${problemId}`);
            const data = await response.json();

            if (data.success) {
                this.currentProblem = data.problem;
                return this.currentProblem;
            } else {
                throw new Error(data.error || 'Problem loading failed');
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            throw error;
        }
    }

    /**
     * 표현식을 레고 조각으로 파싱
     * @param {string} expression - 수식 (예: "x^2 + 5x + 6")
     * @returns {Array} 레고 조각 배열
     */
    parseExpression(expression) {
        const pieces = [];
        const tokens = this.tokenize(expression);

        tokens.forEach((token, index) => {
            pieces.push(this.createLegoPiece(token, index));
        });

        return pieces;
    }

    /**
     * 표현식을 토큰으로 분리
     * @param {string} expression
     * @returns {Array} 토큰 배열
     */
    tokenize(expression) {
        const tokens = [];
        // 공백 제거
        expression = expression.replace(/\s+/g, '');

        // 정규식으로 토큰 추출
        const regex = /(\d+)|([a-z])|(\^)|(\+)|(\-)|(\*)|(\()|(\))/gi;
        let match;

        while ((match = regex.exec(expression)) !== null) {
            tokens.push(match[0]);
        }

        return tokens;
    }

    /**
     * 레고 조각 생성
     * @param {string} value - 조각 값
     * @param {number} id - 고유 ID
     * @returns {Object} 레고 조각 객체
     */
    createLegoPiece(value, id) {
        let type = this.determineType(value);

        return {
            id: `piece-${id}-${Date.now()}`,
            value: value,
            type: type,
            color: this.legoTypes[type].color,
            label: this.legoTypes[type].label
        };
    }

    /**
     * 값의 타입 결정
     * @param {string} value
     * @returns {string} 타입
     */
    determineType(value) {
        if (/^[a-z]$/i.test(value)) return 'variable';
        if (/^\d+$/.test(value)) return 'coefficient';
        if (value === '^') return 'exponent';
        if (['+', '-'].includes(value)) return 'sign';
        if (value === '*') return 'operator';
        if (['(', ')'].includes(value)) return 'parenthesis';
        return 'variable';
    }

    /**
     * 인수분해 문제에 필요한 레고 조각 팔레트 생성
     * @param {string} expression - 문제 수식
     * @returns {Array} 필요한 레고 조각 배열
     */
    generatePalette(expression) {
        const palette = [];

        // 기본 괄호 조각 (항상 필요)
        palette.push(
            this.createLegoPiece('(', 'paren-open-1'),
            this.createLegoPiece(')', 'paren-close-1'),
            this.createLegoPiece('(', 'paren-open-2'),
            this.createLegoPiece(')', 'paren-close-2')
        );

        // 표현식 분석하여 필요한 변수와 계수 추출
        const variables = new Set();
        const coefficients = new Set();

        const tokens = this.tokenize(expression);
        tokens.forEach(token => {
            if (/^[a-z]$/i.test(token)) {
                variables.add(token);
            } else if (/^\d+$/.test(token)) {
                coefficients.add(parseInt(token));
            }
        });

        // 변수 조각 추가
        variables.forEach(v => {
            palette.push(
                this.createLegoPiece(v, `var-${v}-1`),
                this.createLegoPiece(v, `var-${v}-2`)
            );
        });

        // 계수 조각 추가 (1부터 10까지)
        for (let i = 1; i <= 10; i++) {
            palette.push(this.createLegoPiece(i.toString(), `coef-${i}`));
        }

        // 연산자 조각 추가
        palette.push(
            this.createLegoPiece('+', 'plus-1'),
            this.createLegoPiece('-', 'minus-1'),
            this.createLegoPiece('+', 'plus-2'),
            this.createLegoPiece('-', 'minus-2')
        );

        return palette;
    }

    /**
     * 학생 답안 검증
     * @param {Array} studentPieces - 학생이 조립한 레고 조각 배열
     * @param {Array} correctFactors - 정답 인수 배열
     * @returns {Object} 검증 결과
     */
    validateAnswer(studentPieces, correctFactors) {
        // 학생 답안을 문자열로 변환
        const studentAnswer = this.piecesToString(studentPieces);

        // 정답과 비교
        const isCorrect = this.compareFactors(studentAnswer, correctFactors);

        return {
            isCorrect: isCorrect,
            studentAnswer: studentAnswer,
            feedback: this.generateFeedback(isCorrect, studentAnswer, correctFactors)
        };
    }

    /**
     * 레고 조각 배열을 문자열로 변환
     * @param {Array} pieces - 레고 조각 배열
     * @returns {string} 수식 문자열
     */
    piecesToString(pieces) {
        return pieces.map(p => p.value).join('');
    }

    /**
     * 인수 비교
     * @param {string} studentAnswer - 학생 답안
     * @param {Array} correctFactors - 정답 배열
     * @returns {boolean} 정답 여부
     */
    compareFactors(studentAnswer, correctFactors) {
        // 공백 제거
        studentAnswer = studentAnswer.replace(/\s+/g, '');

        // 여러 가능한 정답 형태 확인
        const possibleAnswers = this.generatePossibleAnswers(correctFactors);

        return possibleAnswers.some(answer =>
            answer.replace(/\s+/g, '') === studentAnswer
        );
    }

    /**
     * 가능한 정답 형태 생성 (순서가 바뀐 경우 등)
     * @param {Array} correctFactors - 정답 인수 배열
     * @returns {Array} 가능한 정답 배열
     */
    generatePossibleAnswers(correctFactors) {
        const answers = [];

        // 기본 형태
        answers.push(correctFactors.join(''));

        // 순서를 바꾼 형태
        if (correctFactors.length === 2) {
            answers.push(correctFactors[1] + correctFactors[0]);
        }

        // 곱셈 기호 포함 형태
        answers.push(correctFactors.join('*'));
        answers.push(correctFactors.join('×'));

        if (correctFactors.length === 2) {
            answers.push(correctFactors[1] + '*' + correctFactors[0]);
            answers.push(correctFactors[1] + '×' + correctFactors[0]);
        }

        return answers;
    }

    /**
     * 피드백 생성
     * @param {boolean} isCorrect - 정답 여부
     * @param {string} studentAnswer - 학생 답안
     * @param {Array} correctFactors - 정답
     * @returns {Object} 피드백 객체
     */
    generateFeedback(isCorrect, studentAnswer, correctFactors) {
        if (isCorrect) {
            return {
                message: '🎉 정답입니다! 훌륭해요!',
                type: 'success',
                details: '완벽하게 인수분해를 했어요!'
            };
        } else {
            const hints = [];

            // 괄호 검사
            if (!this.hasMatchingParentheses(studentAnswer)) {
                hints.push('괄호를 확인해보세요. 여는 괄호와 닫는 괄호의 개수가 맞나요?');
            }

            // 인수 개수 검사
            const studentFactorCount = (studentAnswer.match(/\(/g) || []).length;
            if (studentFactorCount !== correctFactors.length) {
                hints.push(`인수의 개수를 확인해보세요. 정답은 ${correctFactors.length}개의 인수로 이루어져 있어요.`);
            }

            return {
                message: '❌ 다시 한번 시도해보세요!',
                type: 'error',
                hints: hints,
                details: '조금만 더 생각해보면 할 수 있어요!'
            };
        }
    }

    /**
     * 괄호 짝 확인
     * @param {string} expression
     * @returns {boolean}
     */
    hasMatchingParentheses(expression) {
        let count = 0;
        for (let char of expression) {
            if (char === '(') count++;
            if (char === ')') count--;
            if (count < 0) return false;
        }
        return count === 0;
    }

    /**
     * 답안 제출
     * @param {number} studentId - 학생 ID
     * @param {number} problemId - 문제 ID
     * @param {Array} pieces - 조립한 레고 조각
     * @param {Object} metadata - 추가 정보 (시간, 상호작용 횟수 등)
     */
    async submitAnswer(studentId, problemId, pieces, metadata) {
        const payload = {
            student_id: studentId,
            problem_id: problemId,
            answer: pieces.map(p => p.value),
            time_spent: metadata.timeSpent || 0,
            interactions_count: metadata.interactionsCount || 0
        };

        try {
            const response = await fetch('../api/problem_api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error submitting answer:', error);
            throw error;
        }
    }

    /**
     * 힌트 가져오기
     * @returns {Array} 힌트 배열
     */
    getHints() {
        if (!this.currentProblem || !this.currentProblem.hints) {
            return ['문제를 먼저 로드해주세요.'];
        }
        return this.currentProblem.hints;
    }

    /**
     * 문제 난이도별 색상 가져오기
     * @param {string} difficulty - 난이도
     * @returns {string} 색상 코드
     */
    getDifficultyColor(difficulty) {
        const colors = {
            'easy': '#2ecc71',
            'medium': '#f39c12',
            'hard': '#e74c3c'
        };
        return colors[difficulty] || '#95a5a6';
    }
}

// 전역 인스턴스 생성
const legoEngine = new LegoEngine();
