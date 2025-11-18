/**
 * Balance Scale Logic
 * 저울 균형 및 방정식 처리 로직
 */

class BalanceScale {
    constructor() {
        this.leftSide = null;   // 좌변 표현식
        this.rightSide = null;  // 우변 표현식
        this.steps = [];        // 풀이 단계
        this.originalEquation = '';
        this.targetVariable = 'x';
    }

    /**
     * 방정식 파싱
     * 예: "2x + 3 = 11" → left: {coefficient: 2, constant: 3}, right: {constant: 11}
     */
    parseEquation(equation) {
        this.originalEquation = equation;
        const parts = equation.replace(/\s/g, '').split('=');

        if (parts.length !== 2) {
            throw new Error('Invalid equation format');
        }

        this.leftSide = this.parseExpression(parts[0]);
        this.rightSide = this.parseExpression(parts[1]);
        this.steps = [{
            left: {...this.leftSide},
            right: {...this.rightSide},
            description: '초기 방정식'
        }];
    }

    /**
     * 표현식 파싱 (간단한 형태)
     * 예: "2x + 3" → {coefficient: 2, constant: 3}
     */
    parseExpression(expr) {
        const result = {
            coefficient: 0,  // x의 계수
            constant: 0      // 상수
        };

        // 패턴 매칭
        // 숫자x 형태
        const coefficientMatch = expr.match(/([+-]?\d*)x/);
        if (coefficientMatch) {
            const coef = coefficientMatch[1];
            if (coef === '' || coef === '+') result.coefficient = 1;
            else if (coef === '-') result.coefficient = -1;
            else result.coefficient = parseInt(coef);
        }

        // 상수 추출 (x가 없는 숫자들)
        const withoutX = expr.replace(/[+-]?\d*x/, '');
        if (withoutX) {
            // 남은 부분에서 숫자 추출
            const numbers = withoutX.match(/[+-]?\d+/g);
            if (numbers) {
                result.constant = numbers.reduce((sum, num) => sum + parseInt(num), 0);
            }
        }

        return result;
    }

    /**
     * 양쪽에 같은 값 더하기/빼기
     */
    addToSides(value) {
        this.leftSide.constant += value;
        this.rightSide.constant += value;

        this.steps.push({
            left: {...this.leftSide},
            right: {...this.rightSide},
            description: `양쪽에 ${value > 0 ? '+' : ''}${value}`
        });

        return this.getCurrentEquation();
    }

    /**
     * 양쪽에 같은 값 곱하기
     */
    multiplyBoth(value) {
        if (value === 0) {
            throw new Error('Cannot multiply by zero');
        }

        this.leftSide.coefficient *= value;
        this.leftSide.constant *= value;
        this.rightSide.coefficient *= value;
        this.rightSide.constant *= value;

        this.steps.push({
            left: {...this.leftSide},
            right: {...this.rightSide},
            description: `양쪽에 ×${value}`
        });

        return this.getCurrentEquation();
    }

    /**
     * 양쪽을 같은 값으로 나누기
     */
    divideBoth(value) {
        if (value === 0) {
            throw new Error('Cannot divide by zero');
        }

        this.leftSide.coefficient /= value;
        this.leftSide.constant /= value;
        this.rightSide.coefficient /= value;
        this.rightSide.constant /= value;

        this.steps.push({
            left: {...this.leftSide},
            right: {...this.rightSide},
            description: `양쪽을 ÷${value}`
        });

        return this.getCurrentEquation();
    }

    /**
     * 현재 방정식 문자열 생성
     */
    getCurrentEquation() {
        const leftStr = this.expressionToString(this.leftSide);
        const rightStr = this.expressionToString(this.rightSide);
        return `${leftStr} = ${rightStr}`;
    }

    /**
     * 표현식을 문자열로 변환
     */
    expressionToString(expr) {
        const parts = [];

        // x 항
        if (expr.coefficient !== 0) {
            if (expr.coefficient === 1) {
                parts.push('x');
            } else if (expr.coefficient === -1) {
                parts.push('-x');
            } else {
                parts.push(`${expr.coefficient}x`);
            }
        }

        // 상수 항
        if (expr.constant !== 0 || parts.length === 0) {
            if (parts.length > 0) {
                parts.push(expr.constant > 0 ? `+${expr.constant}` : `${expr.constant}`);
            } else {
                parts.push(`${expr.constant}`);
            }
        }

        return parts.join(' ') || '0';
    }

    /**
     * 방정식이 풀렸는지 확인 (x = 숫자 형태)
     */
    isSolved() {
        // 좌변이 x (계수 1, 상수 0)이고 우변이 숫자만 있는 경우
        return (this.leftSide.coefficient === 1 &&
                this.leftSide.constant === 0 &&
                this.rightSide.coefficient === 0) ||
               // 또는 우변이 x이고 좌변이 숫자인 경우
               (this.rightSide.coefficient === 1 &&
                this.rightSide.constant === 0 &&
                this.leftSide.coefficient === 0);
    }

    /**
     * 해 구하기
     */
    getSolution() {
        if (this.isSolved()) {
            return this.rightSide.coefficient === 0 ?
                   this.rightSide.constant :
                   this.leftSide.constant;
        }
        return null;
    }

    /**
     * 좌변과 우변의 값 계산 (x 값 대입)
     */
    evaluate(xValue) {
        const leftValue = this.leftSide.coefficient * xValue + this.leftSide.constant;
        const rightValue = this.rightSide.coefficient * xValue + this.rightSide.constant;
        return {
            left: leftValue,
            right: rightValue,
            balanced: Math.abs(leftValue - rightValue) < 0.0001
        };
    }

    /**
     * 다음 힌트 제공
     */
    getHint() {
        const hints = [];

        // 상수를 한쪽으로 모으기
        if (this.leftSide.constant !== 0) {
            hints.push(`좌변의 상수 ${this.leftSide.constant}을 우변으로 옮기세요. (양쪽에 ${-this.leftSide.constant} 더하기)`);
        }

        // 계수로 나누기
        if (this.leftSide.coefficient !== 1 && this.leftSide.coefficient !== 0 && this.leftSide.constant === 0) {
            hints.push(`양쪽을 ${this.leftSide.coefficient}로 나누세요.`);
        }

        // 우변에 변수가 있는 경우
        if (this.rightSide.coefficient !== 0) {
            hints.push(`우변의 ${this.rightSide.coefficient}x를 좌변으로 옮기세요.`);
        }

        if (hints.length === 0) {
            if (this.isSolved()) {
                hints.push('축하합니다! 방정식이 풀렸습니다! ✨');
            } else {
                hints.push('계속 진행해보세요!');
            }
        }

        return hints[0];
    }

    /**
     * 초기화
     */
    reset() {
        if (this.originalEquation) {
            this.parseEquation(this.originalEquation);
        }
    }

    /**
     * 풀이 단계 기록 가져오기
     */
    getSteps() {
        return this.steps;
    }
}
