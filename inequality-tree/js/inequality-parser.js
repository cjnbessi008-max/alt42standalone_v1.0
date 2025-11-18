/**
 * Inequality Parser
 * 부등식 파싱 및 분석 엔진
 */

class InequalityParser {
    constructor() {
        this.operators = ['<', '>', '<=', '>=', '≤', '≥'];
        this.mathOperators = ['+', '-', '*', '/', '^'];
    }

    /**
     * 부등식 표현식 파싱
     * @param {string} expression - 부등식 표현식 (예: "2x + 3 < 5")
     * @returns {object} 파싱된 결과
     */
    parse(expression) {
        if (!expression || typeof expression !== 'string') {
            throw new Error('Invalid expression');
        }

        expression = expression.trim();

        // 부등호 찾기
        const operator = this.findOperator(expression);
        if (!operator) {
            throw new Error('No inequality operator found');
        }

        // 좌변과 우변 분리
        const parts = expression.split(operator.symbol);
        if (parts.length !== 2) {
            throw new Error('Invalid inequality format');
        }

        const leftSide = parts[0].trim();
        const rightSide = parts[1].trim();

        return {
            original: expression,
            operator: operator.symbol,
            operatorType: operator.type,
            leftSide: leftSide,
            rightSide: rightSide,
            leftTokens: this.tokenize(leftSide),
            rightTokens: this.tokenize(rightSide),
            variables: this.extractVariables(expression)
        };
    }

    /**
     * 부등호 연산자 찾기
     */
    findOperator(expression) {
        // 길이가 긴 연산자부터 검색 (<=, >= 먼저)
        const sortedOps = [...this.operators].sort((a, b) => b.length - a.length);

        for (const op of sortedOps) {
            if (expression.includes(op)) {
                return {
                    symbol: op,
                    type: this.getOperatorType(op)
                };
            }
        }

        return null;
    }

    /**
     * 연산자 타입 반환
     */
    getOperatorType(operator) {
        const types = {
            '<': 'less_than',
            '>': 'greater_than',
            '<=': 'less_than_or_equal',
            '>=': 'greater_than_or_equal',
            '≤': 'less_than_or_equal',
            '≥': 'greater_than_or_equal'
        };
        return types[operator] || 'unknown';
    }

    /**
     * 표현식을 토큰으로 분리
     */
    tokenize(expression) {
        const tokens = [];
        let currentToken = '';
        let isNegative = false;

        expression = expression.replace(/\s+/g, '');

        for (let i = 0; i < expression.length; i++) {
            const char = expression[i];

            if (this.mathOperators.includes(char)) {
                // 음수 처리
                if (char === '-' && (i === 0 || this.mathOperators.includes(expression[i - 1]))) {
                    isNegative = true;
                    continue;
                }

                if (currentToken) {
                    tokens.push({
                        value: isNegative ? '-' + currentToken : currentToken,
                        type: this.getTokenType(currentToken)
                    });
                    currentToken = '';
                    isNegative = false;
                }

                tokens.push({
                    value: char,
                    type: 'operator'
                });
            } else {
                currentToken += char;
            }
        }

        if (currentToken) {
            tokens.push({
                value: isNegative ? '-' + currentToken : currentToken,
                type: this.getTokenType(currentToken)
            });
        }

        return tokens;
    }

    /**
     * 토큰 타입 판별
     */
    getTokenType(token) {
        if (/^-?\d+\.?\d*$/.test(token)) {
            return 'number';
        } else if (/^-?\d*[a-zA-Z]+\d*$/.test(token)) {
            return 'variable';
        } else if (/^-?\d+[a-zA-Z]+$/.test(token)) {
            return 'coefficient_variable';
        } else {
            return 'unknown';
        }
    }

    /**
     * 변수 추출
     */
    extractVariables(expression) {
        const matches = expression.match(/[a-zA-Z]+/g);
        return matches ? [...new Set(matches)] : [];
    }

    /**
     * 표현식 단순화 (계산 가능한 부분)
     */
    simplify(expression) {
        // 간단한 계산 수행
        expression = expression.replace(/\s+/g, '');

        // 숫자만 있는 연산 계산
        const numberPattern = /(-?\d+\.?\d*)\s*([\+\-\*\/])\s*(-?\d+\.?\d*)/g;
        let simplified = expression;
        let match;

        while ((match = numberPattern.exec(simplified)) !== null) {
            const num1 = parseFloat(match[1]);
            const operator = match[2];
            const num2 = parseFloat(match[3]);
            let result;

            switch (operator) {
                case '+':
                    result = num1 + num2;
                    break;
                case '-':
                    result = num1 - num2;
                    break;
                case '*':
                    result = num1 * num2;
                    break;
                case '/':
                    result = num1 / num2;
                    break;
            }

            if (result !== undefined) {
                simplified = simplified.replace(match[0], result.toString());
            }
        }

        return simplified;
    }

    /**
     * MathJax 형식으로 변환
     */
    toMathJax(expression) {
        let mathJax = expression;

        // 부등호 변환
        mathJax = mathJax.replace(/</g, '<');
        mathJax = mathJax.replace(/>/g, '>');
        mathJax = mathJax.replace(/<=/g, '\\leq');
        mathJax = mathJax.replace(/>=/g, '\\geq');
        mathJax = mathJax.replace(/≤/g, '\\leq');
        mathJax = mathJax.replace(/≥/g, '\\geq');

        // 거듭제곱 변환
        mathJax = mathJax.replace(/\^(\d+)/g, '^{$1}');

        // 분수 변환 (간단한 경우)
        mathJax = mathJax.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}');

        return `\\(${mathJax}\\)`;
    }

    /**
     * 표현식 검증
     */
    validate(expression) {
        try {
            this.parse(expression);
            return { valid: true, message: 'Valid inequality' };
        } catch (error) {
            return { valid: false, message: error.message };
        }
    }

    /**
     * 두 표현식 비교 (정답 체크용)
     */
    compare(expr1, expr2) {
        const normalized1 = this.normalize(expr1);
        const normalized2 = this.normalize(expr2);

        return normalized1 === normalized2;
    }

    /**
     * 표현식 정규화 (비교용)
     */
    normalize(expression) {
        return expression
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/≤/g, '<=')
            .replace(/≥/g, '>=');
    }
}

// 전역 인스턴스 생성
const inequalityParser = new InequalityParser();
