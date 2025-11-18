/**
 * Math Engine for Existence Color
 * 방정식의 근을 찾고 분석하는 핵심 엔진
 */

class MathEngine {
    /**
     * 이차방정식 분석: ax² + bx + c = 0
     * @param {number} a - x² 계수
     * @param {number} b - x 계수
     * @param {number} c - 상수항
     * @returns {Object} 분석 결과
     */
    static analyzeQuadratic(a, b, c) {
        // a가 0이면 이차방정식이 아님
        if (Math.abs(a) < 1e-10) {
            if (Math.abs(b) < 1e-10) {
                return {
                    type: 'invalid',
                    message: '유효한 방정식이 아닙니다.',
                    color: '#9E9E9E',
                    colorName: '회색'
                };
            }
            // 일차방정식
            return {
                type: 'linear',
                roots: [-c / b],
                rootCount: 1,
                discriminant: null,
                message: '일차방정식입니다.',
                color: '#2196F3',
                colorName: '파란색',
                description: '실근 1개'
            };
        }

        // 판별식 계산: D = b² - 4ac
        const discriminant = b * b - 4 * a * c;
        const epsilon = 1e-10; // 부동소수점 오차 허용범위

        let result = {
            type: 'quadratic',
            discriminant: discriminant,
            a: a,
            b: b,
            c: c
        };

        if (discriminant > epsilon) {
            // D > 0: 서로 다른 실근 2개
            const sqrtD = Math.sqrt(discriminant);
            const root1 = (-b + sqrtD) / (2 * a);
            const root2 = (-b - sqrtD) / (2 * a);

            result.rootType = 'distinct_real';
            result.roots = [root1, root2];
            result.rootCount = 2;
            result.color = '#4CAF50'; // 초록색
            result.colorName = '초록색';
            result.description = '서로 다른 실근 2개';
            result.message = `판별식 D = ${discriminant.toFixed(2)} > 0`;

        } else if (Math.abs(discriminant) <= epsilon) {
            // D = 0: 중근
            const root = -b / (2 * a);

            result.rootType = 'repeated_real';
            result.roots = [root];
            result.rootCount = 1;
            result.color = '#2196F3'; // 파란색
            result.colorName = '파란색';
            result.description = '중근 (실근 1개)';
            result.message = `판별식 D = ${discriminant.toFixed(2)} = 0`;

        } else {
            // D < 0: 복소근 2개
            const realPart = -b / (2 * a);
            const imaginaryPart = Math.sqrt(-discriminant) / (2 * a);

            result.rootType = 'complex';
            result.roots = [
                { real: realPart, imag: imaginaryPart },
                { real: realPart, imag: -imaginaryPart }
            ];
            result.rootCount = 2;
            result.color = '#9C27B0'; // 보라색
            result.colorName = '보라색';
            result.description = '복소근 2개';
            result.message = `판별식 D = ${discriminant.toFixed(2)} < 0`;
        }

        return result;
    }

    /**
     * 삼차방정식 분석: ax³ + bx² + cx + d = 0
     * Cardano's formula를 사용한 해석적 해법
     * @param {number} a - x³ 계수
     * @param {number} b - x² 계수
     * @param {number} c - x 계수
     * @param {number} d - 상수항
     * @returns {Object} 분석 결과
     */
    static analyzeCubic(a, b, c, d) {
        if (Math.abs(a) < 1e-10) {
            return this.analyzeQuadratic(b, c, d);
        }

        // 정규화: x³ + px + q = 0 형태로 변환
        // 변수 치환: x = t - b/(3a)
        const p = (3 * a * c - b * b) / (3 * a * a);
        const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);

        // 판별식: Δ = -4p³ - 27q²
        const discriminant = -4 * p * p * p - 27 * q * q;
        const epsilon = 1e-8;

        let roots = [];
        let result = {
            type: 'cubic',
            discriminant: discriminant,
            a: a,
            b: b,
            c: c,
            d: d
        };

        if (discriminant > epsilon) {
            // Δ > 0: 서로 다른 실근 3개
            // Vieta's formula와 삼각 함수 방법 사용
            const m = 2 * Math.sqrt(-p / 3);
            const theta = Math.acos((3 * q) / (p * m)) / 3;
            const offset = -b / (3 * a);

            roots = [
                m * Math.cos(theta) + offset,
                m * Math.cos(theta - 2 * Math.PI / 3) + offset,
                m * Math.cos(theta - 4 * Math.PI / 3) + offset
            ];

            result.rootType = 'three_real';
            result.roots = roots;
            result.rootCount = 3;
            result.color = '#FF9800'; // 주황색
            result.colorName = '주황색';
            result.description = '서로 다른 실근 3개';
            result.message = `판별식 Δ = ${discriminant.toFixed(2)} > 0`;

        } else if (Math.abs(discriminant) <= epsilon) {
            // Δ = 0: 중근 포함
            const offset = -b / (3 * a);
            if (Math.abs(p) < epsilon && Math.abs(q) < epsilon) {
                // 삼중근
                roots = [offset];
                result.rootCount = 1;
                result.description = '삼중근';
            } else {
                // 단순근 1개 + 이중근 1개
                const r1 = (3 * q) / p + offset;
                const r2 = (-3 * q) / (2 * p) + offset;
                roots = [r1, r2];
                result.rootCount = 2;
                result.description = '실근 (중근 포함)';
            }

            result.rootType = 'repeated_real';
            result.roots = roots;
            result.color = '#2196F3'; // 파란색
            result.colorName = '파란색';
            result.message = `판별식 Δ = ${discriminant.toFixed(2)} = 0`;

        } else {
            // Δ < 0: 실근 1개 + 복소근 2개
            // Cardano's formula
            const Q = (p / 3);
            const R = (q / 2);
            const S = Math.sqrt(R * R + Q * Q * Q);

            const A = Math.cbrt(-R + S);
            const B = Math.cbrt(-R - S);

            const offset = -b / (3 * a);
            const realRoot = A + B + offset;

            // 복소근
            const realPart = -(A + B) / 2 + offset;
            const imaginaryPart = (A - B) * Math.sqrt(3) / 2;

            roots = [
                realRoot,
                { real: realPart, imag: imaginaryPart },
                { real: realPart, imag: -imaginaryPart }
            ];

            result.rootType = 'one_real_two_complex';
            result.roots = roots;
            result.rootCount = 3;
            result.color = '#F44336'; // 빨간색
            result.colorName = '빨간색';
            result.description = '실근 1개 + 복소근 2개';
            result.message = `판별식 Δ = ${discriminant.toFixed(2)} < 0`;
        }

        return result;
    }

    /**
     * 근을 문자열로 포맷팅
     * @param {number|Object} root - 실수 또는 {real, imag} 객체
     * @returns {string} 포맷팅된 근
     */
    static formatRoot(root) {
        if (typeof root === 'number') {
            return root.toFixed(4);
        } else if (root.real !== undefined && root.imag !== undefined) {
            const real = root.real.toFixed(4);
            const imag = Math.abs(root.imag).toFixed(4);
            const sign = root.imag >= 0 ? '+' : '-';
            return `${real} ${sign} ${imag}i`;
        }
        return 'Unknown';
    }

    /**
     * 방정식을 LaTeX 형식으로 포맷팅
     * @param {string} type - 'quadratic' 또는 'cubic'
     * @param {Object} coefficients - 계수 객체
     * @returns {string} LaTeX 문자열
     */
    static formatEquationLatex(type, coefficients) {
        if (type === 'quadratic') {
            const { a, b, c } = coefficients;
            let latex = '';

            // ax² 항
            if (a !== 0) {
                if (a === 1) latex += 'x^2';
                else if (a === -1) latex += '-x^2';
                else latex += `${a}x^2`;
            }

            // bx 항
            if (b !== 0) {
                if (latex !== '') {
                    latex += b > 0 ? ' + ' : ' - ';
                    const absB = Math.abs(b);
                    latex += absB === 1 ? 'x' : `${absB}x`;
                } else {
                    latex += b === 1 ? 'x' : b === -1 ? '-x' : `${b}x`;
                }
            }

            // c 항
            if (c !== 0) {
                if (latex !== '') {
                    latex += c > 0 ? ' + ' : ' - ';
                    latex += Math.abs(c);
                } else {
                    latex += c;
                }
            }

            if (latex === '') latex = '0';
            return `$$${latex} = 0$$`;

        } else if (type === 'cubic') {
            const { a, b, c, d } = coefficients;
            let latex = '';

            // ax³ 항
            if (a !== 0) {
                if (a === 1) latex += 'x^3';
                else if (a === -1) latex += '-x^3';
                else latex += `${a}x^3`;
            }

            // bx² 항
            if (b !== 0) {
                if (latex !== '') {
                    latex += b > 0 ? ' + ' : ' - ';
                    const absB = Math.abs(b);
                    latex += absB === 1 ? 'x^2' : `${absB}x^2`;
                } else {
                    latex += b === 1 ? 'x^2' : b === -1 ? '-x^2' : `${b}x^2`;
                }
            }

            // cx 항
            if (c !== 0) {
                if (latex !== '') {
                    latex += c > 0 ? ' + ' : ' - ';
                    const absC = Math.abs(c);
                    latex += absC === 1 ? 'x' : `${absC}x`;
                } else {
                    latex += c === 1 ? 'x' : c === -1 ? '-x' : `${c}x`;
                }
            }

            // d 항
            if (d !== 0) {
                if (latex !== '') {
                    latex += d > 0 ? ' + ' : ' - ';
                    latex += Math.abs(d);
                } else {
                    latex += d;
                }
            }

            if (latex === '') latex = '0';
            return `$$${latex} = 0$$`;
        }

        return '$$0 = 0$$';
    }

    /**
     * 그래프 그리기를 위한 함수 값 계산
     * @param {string} type - 'quadratic' 또는 'cubic'
     * @param {Object} coefficients - 계수
     * @param {number} x - x 값
     * @returns {number} y 값
     */
    static evaluatePolynomial(type, coefficients, x) {
        if (type === 'quadratic') {
            const { a, b, c } = coefficients;
            return a * x * x + b * x + c;
        } else if (type === 'cubic') {
            const { a, b, c, d } = coefficients;
            return a * x * x * x + b * x * x + c * x + d;
        }
        return 0;
    }

    /**
     * 그래프 범위 자동 결정
     * @param {Array} roots - 근 배열
     * @returns {Object} {xMin, xMax, yMin, yMax}
     */
    static calculateGraphBounds(roots) {
        const realRoots = roots.filter(r => typeof r === 'number');

        if (realRoots.length === 0) {
            return { xMin: -10, xMax: 10, yMin: -10, yMax: 10 };
        }

        const minRoot = Math.min(...realRoots);
        const maxRoot = Math.max(...realRoots);
        const range = maxRoot - minRoot;
        const padding = Math.max(range * 0.5, 2);

        return {
            xMin: minRoot - padding,
            xMax: maxRoot + padding,
            yMin: -10,
            yMax: 10
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathEngine;
}
