/**
 * Math Utilities - 수학 함수 파싱 및 계산
 */

class MathUtils {
    /**
     * 문자열 함수식을 JavaScript 함수로 변환
     * @param {string} expression - 수식 문자열 (예: "x^2 - 4")
     * @returns {Function} - 계산 가능한 함수
     */
    static parseFunction(expression) {
        // 수식 정리
        let cleanExpr = expression
            .replace(/\s+/g, '')  // 공백 제거
            .replace(/\^/g, '**')  // ^ 를 ** 로 변환
            .replace(/(\d)([a-z])/gi, '$1*$2')  // 2x -> 2*x
            .replace(/\)(\d)/g, ')*$1')  // )(숫자) -> )*(숫자)
            .replace(/(\d)\(/g, '$1*(');  // (숫자)( -> (숫자)*(

        // Math 함수 지원
        cleanExpr = cleanExpr
            .replace(/sin/g, 'Math.sin')
            .replace(/cos/g, 'Math.cos')
            .replace(/tan/g, 'Math.tan')
            .replace(/sqrt/g, 'Math.sqrt')
            .replace(/abs/g, 'Math.abs')
            .replace(/log/g, 'Math.log')
            .replace(/exp/g, 'Math.exp');

        try {
            // 안전한 함수 생성
            return new Function('x', `return ${cleanExpr};`);
        } catch (error) {
            console.error('함수 파싱 오류:', error);
            return null;
        }
    }

    /**
     * 함수 값 계산
     * @param {Function} fn - 함수
     * @param {number} x - x 값
     * @returns {number} - f(x) 값
     */
    static evaluate(fn, x) {
        try {
            const result = fn(x);
            return isFinite(result) ? result : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 함수의 미분 근사 계산 (수치 미분)
     * @param {Function} fn - 함수
     * @param {number} x - x 값
     * @param {number} h - 미소 변화량
     * @returns {number} - f'(x) 근사값
     */
    static derivative(fn, x, h = 0.0001) {
        const fx1 = this.evaluate(fn, x + h);
        const fx2 = this.evaluate(fn, x - h);

        if (fx1 === null || fx2 === null) return null;

        return (fx1 - fx2) / (2 * h);
    }

    /**
     * 함수의 범위 내 최대/최소값 찾기
     * @param {Function} fn - 함수
     * @param {number} xMin - 최소 x
     * @param {number} xMax - 최대 x
     * @param {number} step - 샘플링 간격
     * @returns {Object} - {min, max, minX, maxX}
     */
    static findRange(fn, xMin, xMax, step = 0.1) {
        let min = Infinity;
        let max = -Infinity;
        let minX = xMin;
        let maxX = xMax;

        for (let x = xMin; x <= xMax; x += step) {
            const y = this.evaluate(fn, x);
            if (y !== null) {
                if (y < min) {
                    min = y;
                    minX = x;
                }
                if (y > max) {
                    max = y;
                    maxX = x;
                }
            }
        }

        return { min, max, minX, maxX };
    }

    /**
     * 두 점 사이의 부호 변화 확인
     * @param {Function} fn - 함수
     * @param {number} x1 - 점 1
     * @param {number} x2 - 점 2
     * @returns {boolean} - 부호 변화 여부
     */
    static signChange(fn, x1, x2) {
        const y1 = this.evaluate(fn, x1);
        const y2 = this.evaluate(fn, x2);

        if (y1 === null || y2 === null) return false;

        return (y1 * y2) < 0;
    }

    /**
     * 숫자를 적절한 정밀도로 포맷
     * @param {number} num - 숫자
     * @param {number} precision - 소수점 자릿수
     * @returns {string} - 포맷된 문자열
     */
    static formatNumber(num, precision = 4) {
        if (!isFinite(num)) return 'N/A';

        // 매우 작은 수는 0으로
        if (Math.abs(num) < 1e-10) return '0';

        // 정수는 그대로
        if (Number.isInteger(num)) return num.toString();

        // 소수점 포맷
        return parseFloat(num.toFixed(precision)).toString();
    }

    /**
     * 함수식을 LaTeX 형식으로 변환
     * @param {string} expression - 수식 문자열
     * @returns {string} - LaTeX 문자열
     */
    static toLatex(expression) {
        return expression
            .replace(/\^/g, '^')
            .replace(/\*/g, ' \\cdot ')
            .replace(/sqrt/g, '\\sqrt')
            .replace(/sin/g, '\\sin')
            .replace(/cos/g, '\\cos')
            .replace(/tan/g, '\\tan');
    }

    /**
     * 구간 내 균등 샘플링
     * @param {number} start - 시작값
     * @param {number} end - 끝값
     * @param {number} count - 샘플 개수
     * @returns {Array} - 샘플 배열
     */
    static linspace(start, end, count) {
        const step = (end - start) / (count - 1);
        return Array.from({ length: count }, (_, i) => start + step * i);
    }
}

// 전역 객체로 노출
window.MathUtils = MathUtils;
