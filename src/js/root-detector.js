/**
 * Root Detector
 * 방정식 분석 및 근의 개수 감지
 */

class RootDetector {
    constructor() {
        this.currentEquation = null;
        this.currentRootCount = 0;
        this.roots = [];
        this.onRootChangeCallback = null;
    }

    /**
     * 방정식 파싱 및 근 계산
     * @param {string} equation - 방정식 문자열 (예: "x^2 + 2x + 1 = 0")
     * @returns {Object} 근 정보
     */
    analyzeEquation(equation) {
        this.currentEquation = equation;
        const result = {
            equation: equation,
            roots: [],
            rootCount: 0,
            type: 'unknown'
        };

        try {
            // 방정식 타입 감지 및 근 계산
            const parsed = this.parseEquation(equation);

            if (parsed.degree === 1) {
                // 1차 방정식: ax + b = 0
                result.roots = this.solveLinear(parsed.coefficients);
                result.type = 'linear';
            } else if (parsed.degree === 2) {
                // 2차 방정식: ax^2 + bx + c = 0
                result.roots = this.solveQuadratic(parsed.coefficients);
                result.type = 'quadratic';
            } else if (parsed.degree === 3) {
                // 3차 방정식 (수치적 방법)
                result.roots = this.solveCubic(parsed.coefficients);
                result.type = 'cubic';
            }

            result.rootCount = result.roots.length;
            this.updateRootCount(result.rootCount, result.roots);

        } catch (error) {
            console.error('방정식 분석 실패:', error);
        }

        return result;
    }

    /**
     * 방정식 문자열 파싱
     */
    parseEquation(equation) {
        // "= 0" 제거
        equation = equation.replace(/=\s*0\s*$/i, '').trim();

        // 계수 추출 (간단한 파서)
        const coefficients = {};
        let degree = 0;

        // x^n 형태 매칭
        const termRegex = /([+-]?\s*\d*\.?\d*)\s*\*?\s*x\s*\^?\s*(\d*)/gi;
        let match;

        while ((match = termRegex.exec(equation)) !== null) {
            let coef = match[1].replace(/\s/g, '');
            const exp = match[2] ? parseInt(match[2]) : 1;

            // 계수 처리
            if (coef === '' || coef === '+') coef = '1';
            if (coef === '-') coef = '-1';

            coefficients[exp] = (coefficients[exp] || 0) + parseFloat(coef);
            degree = Math.max(degree, exp);
        }

        // 상수항 추출
        const constantMatch = equation.match(/([+-]?\s*\d+\.?\d*)\s*$/);
        if (constantMatch) {
            coefficients[0] = parseFloat(constantMatch[1].replace(/\s/g, ''));
        }

        return { degree, coefficients };
    }

    /**
     * 1차 방정식 풀이: ax + b = 0
     */
    solveLinear(coefficients) {
        const a = coefficients[1] || 0;
        const b = coefficients[0] || 0;

        if (a === 0) return [];

        return [-b / a];
    }

    /**
     * 2차 방정식 풀이: ax^2 + bx + c = 0
     */
    solveQuadratic(coefficients) {
        const a = coefficients[2] || 0;
        const b = coefficients[1] || 0;
        const c = coefficients[0] || 0;

        if (a === 0) return this.solveLinear(coefficients);

        const discriminant = b * b - 4 * a * c;

        if (discriminant > 0) {
            // 두 개의 실근
            const root1 = (-b + Math.sqrt(discriminant)) / (2 * a);
            const root2 = (-b - Math.sqrt(discriminant)) / (2 * a);
            return [root1, root2];
        } else if (discriminant === 0) {
            // 중근
            return [-b / (2 * a)];
        } else {
            // 허근 (복소수)
            const realPart = -b / (2 * a);
            const imagPart = Math.sqrt(-discriminant) / (2 * a);
            return [
                { real: realPart, imag: imagPart },
                { real: realPart, imag: -imagPart }
            ];
        }
    }

    /**
     * 3차 방정식 풀이 (Cardano's formula - 간단한 구현)
     */
    solveCubic(coefficients) {
        const a = coefficients[3] || 1;
        const b = coefficients[2] || 0;
        const c = coefficients[1] || 0;
        const d = coefficients[0] || 0;

        // 정규화: x^3 + px + q = 0 형태로 변환
        const p = (3 * a * c - b * b) / (3 * a * a);
        const q = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);

        const discriminant = -(4 * p * p * p + 27 * q * q);

        if (discriminant > 0) {
            // 3개의 실근
            return this.findRootsNumerically(coefficients, 3);
        } else if (discriminant === 0) {
            // 중근 포함
            return this.findRootsNumerically(coefficients, 2);
        } else {
            // 1개의 실근, 2개의 복소근
            return this.findRootsNumerically(coefficients, 1);
        }
    }

    /**
     * 수치적 방법으로 근 찾기 (Newton-Raphson)
     */
    findRootsNumerically(coefficients, expectedCount) {
        const roots = [];
        const f = (x) => {
            let result = 0;
            for (const [exp, coef] of Object.entries(coefficients)) {
                result += coef * Math.pow(x, parseInt(exp));
            }
            return result;
        };

        // -100에서 100 범위에서 근 탐색
        for (let start = -10; start <= 10 && roots.length < expectedCount; start += 0.5) {
            const root = this.newtonRaphson(f, start);
            if (root !== null && !roots.some(r => Math.abs(r - root) < 0.001)) {
                roots.push(root);
            }
        }

        return roots;
    }

    /**
     * Newton-Raphson 방법
     */
    newtonRaphson(f, x0, maxIter = 50, tolerance = 1e-6) {
        let x = x0;
        const h = 1e-6;

        for (let i = 0; i < maxIter; i++) {
            const fx = f(x);
            const fpx = (f(x + h) - fx) / h; // 수치 미분

            if (Math.abs(fpx) < tolerance) break;

            const x1 = x - fx / fpx;

            if (Math.abs(x1 - x) < tolerance) {
                return Math.abs(f(x1)) < tolerance ? x1 : null;
            }

            x = x1;
        }

        return Math.abs(f(x)) < tolerance ? x : null;
    }

    /**
     * 근의 개수 업데이트
     */
    updateRootCount(newCount, roots) {
        const oldCount = this.currentRootCount;
        this.currentRootCount = newCount;
        this.roots = roots;

        // 변화 감지
        if (oldCount !== newCount && this.onRootChangeCallback) {
            this.onRootChangeCallback(oldCount, newCount, roots);
        }
    }

    /**
     * 근 변화 콜백 등록
     */
    onRootChange(callback) {
        this.onRootChangeCallback = callback;
    }

    /**
     * 근을 문자열로 포맷
     */
    formatRoots(roots) {
        if (roots.length === 0) return '근이 없습니다';

        return roots.map(root => {
            if (typeof root === 'number') {
                return root.toFixed(3);
            } else if (root.real !== undefined) {
                // 복소수
                const sign = root.imag >= 0 ? '+' : '';
                return `${root.real.toFixed(3)}${sign}${root.imag.toFixed(3)}i`;
            }
            return String(root);
        }).join(', ');
    }

    /**
     * 현재 상태 반환
     */
    getState() {
        return {
            equation: this.currentEquation,
            rootCount: this.currentRootCount,
            roots: this.roots,
            formattedRoots: this.formatRoots(this.roots)
        };
    }
}

// 전역 인스턴스
let rootDetector = null;

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        rootDetector = new RootDetector();
    });
}
