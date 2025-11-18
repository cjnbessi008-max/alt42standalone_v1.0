/**
 * Extrema Calculator
 * 함수의 극값(극대, 극소)을 계산하는 모듈
 */

class ExtremaCalculator {
    constructor() {
        this.epsilon = 1e-6; // 미분 계산 시 사용할 작은 값
        this.tolerance = 1e-4; // 극값 판정 임계값
    }

    /**
     * 문자열로 된 수식을 JavaScript 함수로 변환
     * @param {string} expression - 수식 문자열 (예: "x^2 - 4*x + 3")
     * @returns {Function} - 평가 가능한 함수
     */
    parseExpression(expression) {
        try {
            // 수식 정리: ^를 **로 변환 (JavaScript 거듭제곱 연산자)
            let cleanExpr = expression
                .replace(/\^/g, '**')
                .replace(/(\d)([a-z])/gi, '$1*$2') // 2x -> 2*x
                .replace(/\)\(/g, ')*(') // )(  -> )*(
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/log/g, 'Math.log')
                .replace(/exp/g, 'Math.exp');

            // Function 생성 (x 값을 받아서 수식 평가)
            return new Function('x', `return ${cleanExpr};`);
        } catch (error) {
            console.error('수식 파싱 오류:', error);
            throw new Error('수식을 파싱할 수 없습니다: ' + expression);
        }
    }

    /**
     * 수치 미분 계산 (중앙 차분법)
     * @param {Function} f - 함수
     * @param {number} x - 미분할 점
     * @returns {number} - 도함수 값 f'(x)
     */
    derivative(f, x) {
        return (f(x + this.epsilon) - f(x - this.epsilon)) / (2 * this.epsilon);
    }

    /**
     * 2차 도함수 계산 (수치적 방법)
     * @param {Function} f - 함수
     * @param {number} x - 계산할 점
     * @returns {number} - 2차 도함수 값 f''(x)
     */
    secondDerivative(f, x) {
        const h = this.epsilon;
        return (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
    }

    /**
     * Newton-Raphson 방법으로 f'(x) = 0인 점 찾기
     * @param {Function} f - 함수
     * @param {number} x0 - 초기 추정값
     * @param {number} maxIterations - 최대 반복 횟수
     * @returns {number|null} - 임계점 또는 null
     */
    findCriticalPoint(f, x0, maxIterations = 50) {
        let x = x0;

        for (let i = 0; i < maxIterations; i++) {
            const df = this.derivative(f, x);
            const ddf = this.secondDerivative(f, x);

            if (Math.abs(ddf) < this.epsilon) {
                // 2차 도함수가 0에 가까우면 변곡점일 수 있음
                break;
            }

            const dx = df / ddf;
            x = x - dx;

            // 수렴 확인
            if (Math.abs(dx) < this.tolerance) {
                return x;
            }
        }

        return null;
    }

    /**
     * 주어진 범위에서 극값 찾기
     * @param {string} expression - 수식 문자열
     * @param {number} xMin - 범위 최소값
     * @param {number} xMax - 범위 최대값
     * @param {number} samples - 샘플링 개수
     * @returns {Array} - 극값 배열 [{x, y, type: 'maximum'|'minimum'}, ...]
     */
    findExtrema(expression, xMin, xMax, samples = 100) {
        const f = this.parseExpression(expression);
        const extrema = [];
        const step = (xMax - xMin) / samples;
        const criticalPoints = new Set();

        // 1단계: 그리드 샘플링으로 도함수 부호 변화 지점 찾기
        for (let i = 0; i < samples; i++) {
            const x1 = xMin + i * step;
            const x2 = xMin + (i + 1) * step;

            try {
                const df1 = this.derivative(f, x1);
                const df2 = this.derivative(f, x2);

                // 도함수 부호가 바뀌는 구간 발견
                if (df1 * df2 < 0) {
                    // Newton-Raphson으로 정확한 임계점 찾기
                    const criticalPoint = this.findCriticalPoint(f, (x1 + x2) / 2);

                    if (criticalPoint !== null &&
                        criticalPoint >= xMin &&
                        criticalPoint <= xMax) {
                        // 중복 제거 (이미 찾은 점과 가까운지 확인)
                        let isDuplicate = false;
                        for (let cp of criticalPoints) {
                            if (Math.abs(cp - criticalPoint) < step / 2) {
                                isDuplicate = true;
                                break;
                            }
                        }

                        if (!isDuplicate) {
                            criticalPoints.add(criticalPoint);
                        }
                    }
                }
            } catch (error) {
                // 함수 평가 오류 무시 (불연속점 등)
                continue;
            }
        }

        // 2단계: 각 임계점이 극대인지 극소인지 판별
        for (let x of criticalPoints) {
            try {
                const y = f(x);
                const ddf = this.secondDerivative(f, x);

                // 2차 도함수 테스트
                if (ddf > this.tolerance) {
                    // f''(x) > 0 => 극소
                    extrema.push({
                        x: parseFloat(x.toFixed(4)),
                        y: parseFloat(y.toFixed(4)),
                        type: 'minimum',
                        label: '극소'
                    });
                } else if (ddf < -this.tolerance) {
                    // f''(x) < 0 => 극대
                    extrema.push({
                        x: parseFloat(x.toFixed(4)),
                        y: parseFloat(y.toFixed(4)),
                        type: 'maximum',
                        label: '극대'
                    });
                }
                // ddf ≈ 0인 경우는 변곡점이므로 무시
            } catch (error) {
                continue;
            }
        }

        return extrema.sort((a, b) => a.x - b.x);
    }

    /**
     * 함수 값 배열 생성 (그래프 그리기용)
     * @param {string} expression - 수식 문자열
     * @param {number} xMin - 범위 최소값
     * @param {number} xMax - 범위 최대값
     * @param {number} points - 점 개수
     * @returns {Object} - {x: [], y: []} 형태의 데이터
     */
    generatePoints(expression, xMin, xMax, points = 300) {
        const f = this.parseExpression(expression);
        const xValues = [];
        const yValues = [];
        const step = (xMax - xMin) / points;

        for (let i = 0; i <= points; i++) {
            const x = xMin + i * step;
            try {
                const y = f(x);
                // NaN이나 Infinity 체크
                if (isFinite(y)) {
                    xValues.push(x);
                    yValues.push(y);
                }
            } catch (error) {
                // 함수 평가 오류 시 건너뛰기
                continue;
            }
        }

        return { x: xValues, y: yValues };
    }
}

// 전역 인스턴스 생성
const extremaCalculator = new ExtremaCalculator();
