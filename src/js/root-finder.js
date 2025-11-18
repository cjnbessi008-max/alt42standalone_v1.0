/**
 * Root Finder - 근 찾기 알고리즘
 */

class RootFinder {
    /**
     * Newton-Raphson 방법으로 근 찾기
     * @param {Function} fn - 함수
     * @param {number} x0 - 초기값
     * @param {number} tolerance - 허용 오차
     * @param {number} maxIterations - 최대 반복 횟수
     * @returns {Object|null} - {root, iterations, error}
     */
    static newtonRaphson(fn, x0, tolerance = 1e-6, maxIterations = 100) {
        let x = x0;
        let iterations = 0;

        while (iterations < maxIterations) {
            const fx = MathUtils.evaluate(fn, x);
            const fpx = MathUtils.derivative(fn, x);

            if (fx === null || fpx === null || Math.abs(fpx) < 1e-10) {
                return null;  // 수렴 실패
            }

            const xNext = x - fx / fpx;
            const error = Math.abs(xNext - x);

            x = xNext;
            iterations++;

            if (error < tolerance) {
                return {
                    root: x,
                    iterations: iterations,
                    error: error
                };
            }
        }

        return null;  // 최대 반복 횟수 초과
    }

    /**
     * 이분법으로 근 찾기
     * @param {Function} fn - 함수
     * @param {number} a - 구간 시작
     * @param {number} b - 구간 끝
     * @param {number} tolerance - 허용 오차
     * @returns {Object|null} - {root, iterations}
     */
    static bisection(fn, a, b, tolerance = 1e-6) {
        let fa = MathUtils.evaluate(fn, a);
        let fb = MathUtils.evaluate(fn, b);

        if (fa === null || fb === null || fa * fb > 0) {
            return null;  // 부호가 같으면 근이 없을 수 있음
        }

        let iterations = 0;
        const maxIterations = 100;

        while (iterations < maxIterations && (b - a) > tolerance) {
            const c = (a + b) / 2;
            const fc = MathUtils.evaluate(fn, c);

            if (fc === null) return null;

            if (Math.abs(fc) < tolerance) {
                return {
                    root: c,
                    iterations: iterations
                };
            }

            if (fa * fc < 0) {
                b = c;
                fb = fc;
            } else {
                a = c;
                fa = fc;
            }

            iterations++;
        }

        return {
            root: (a + b) / 2,
            iterations: iterations
        };
    }

    /**
     * 구간 내 모든 근 찾기 (하이브리드 방법)
     * @param {Function} fn - 함수
     * @param {number} xMin - 최소 x
     * @param {number} xMax - 최대 x
     * @param {number} step - 검색 간격
     * @returns {Array} - 근의 배열
     */
    static findAllRoots(fn, xMin = -10, xMax = 10, step = 0.5) {
        const roots = [];
        const foundRoots = new Set();

        // 1단계: 부호 변화 지점 찾기
        for (let x = xMin; x < xMax; x += step) {
            if (MathUtils.signChange(fn, x, x + step)) {
                // 이분법으로 정확한 근 찾기
                const result = this.bisection(fn, x, x + step);

                if (result) {
                    const roundedRoot = Math.round(result.root * 1e6) / 1e6;

                    // 중복 제거 (매우 가까운 근)
                    let isDuplicate = false;
                    for (const existingRoot of foundRoots) {
                        if (Math.abs(existingRoot - roundedRoot) < 0.01) {
                            isDuplicate = true;
                            break;
                        }
                    }

                    if (!isDuplicate) {
                        foundRoots.add(roundedRoot);
                        roots.push({
                            x: result.root,
                            y: 0,
                            method: 'bisection',
                            iterations: result.iterations
                        });
                    }
                }
            }
        }

        // 2단계: Newton-Raphson으로 추가 근 찾기 (여러 초기값)
        const initialPoints = MathUtils.linspace(xMin, xMax, 20);

        for (const x0 of initialPoints) {
            const result = this.newtonRaphson(fn, x0);

            if (result && result.root >= xMin && result.root <= xMax) {
                const roundedRoot = Math.round(result.root * 1e6) / 1e6;

                // 중복 제거
                let isDuplicate = false;
                for (const existingRoot of foundRoots) {
                    if (Math.abs(existingRoot - roundedRoot) < 0.01) {
                        isDuplicate = true;
                        break;
                    }
                }

                if (!isDuplicate) {
                    foundRoots.add(roundedRoot);
                    roots.push({
                        x: result.root,
                        y: 0,
                        method: 'newton',
                        iterations: result.iterations
                    });
                }
            }
        }

        // 근 정렬
        roots.sort((a, b) => a.x - b.x);

        return roots;
    }

    /**
     * 단일 근 검증
     * @param {Function} fn - 함수
     * @param {number} x - 검증할 x 값
     * @param {number} tolerance - 허용 오차
     * @returns {boolean} - 근 여부
     */
    static verifyRoot(fn, x, tolerance = 1e-6) {
        const fx = MathUtils.evaluate(fn, x);
        return fx !== null && Math.abs(fx) < tolerance;
    }

    /**
     * 근의 다중도 확인
     * @param {Function} fn - 함수
     * @param {number} x - 근
     * @returns {number} - 다중도 (1, 2, 3, ...)
     */
    static rootMultiplicity(fn, x) {
        const tolerance = 1e-6;
        let multiplicity = 0;

        // 함수와 미분값 확인
        let currentFn = fn;

        for (let i = 0; i < 5; i++) {
            const value = MathUtils.evaluate(currentFn, x);

            if (value === null || Math.abs(value) > tolerance) {
                break;
            }

            multiplicity++;

            // 다음 미분 준비 (간단한 근사)
            const h = 1e-4;
            currentFn = ((f) => (x) => (f(x + h) - f(x)) / h)(currentFn);
        }

        return multiplicity || 1;
    }
}

// 전역 객체로 노출
window.RootFinder = RootFinder;
