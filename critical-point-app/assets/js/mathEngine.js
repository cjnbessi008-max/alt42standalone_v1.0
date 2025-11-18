/**
 * Math Engine for Critical Point Detection
 * Handles function evaluation, derivative calculation, and critical point finding
 */

class MathEngine {
    constructor() {
        this.currentFunction = null;
        this.criticalPoints = [];
    }

    /**
     * Evaluate a mathematical function at a given x value
     * @param {Function} func - The function to evaluate
     * @param {number} x - The x value
     * @returns {number} The y value
     */
    evaluate(func, x) {
        try {
            return func(x);
        } catch (e) {
            console.error('Function evaluation error:', e);
            return NaN;
        }
    }

    /**
     * Numerical derivative using central difference method
     * @param {Function} func - The function
     * @param {number} x - The point at which to find derivative
     * @param {number} h - Step size
     * @returns {number} The derivative
     */
    derivative(func, x, h = 0.0001) {
        return (func(x + h) - func(x - h)) / (2 * h);
    }

    /**
     * Second derivative for concavity test
     * @param {Function} func - The function
     * @param {number} x - The point
     * @returns {number} The second derivative
     */
    secondDerivative(func, x, h = 0.0001) {
        return (func(x + h) - 2 * func(x) + func(x - h)) / (h * h);
    }

    /**
     * Find critical points in a given range
     * @param {Function} func - The function
     * @param {number} xMin - Start of range
     * @param {number} xMax - End of range
     * @param {number} step - Step size for searching
     * @returns {Array} Array of critical points with type (max/min)
     */
    findCriticalPoints(func, xMin = -5, xMax = 5, step = 0.1) {
        const criticalPoints = [];
        const tolerance = 0.05; // Tolerance for derivative being close to zero

        // Scan the range looking for sign changes in derivative
        for (let x = xMin; x <= xMax; x += step) {
            const derivative = this.derivative(func, x);

            // Check if derivative is close to zero
            if (Math.abs(derivative) < tolerance) {
                const secondDeriv = this.secondDerivative(func, x);
                const y = func(x);

                // Determine if it's a max or min
                let type = 'inflection';
                if (secondDeriv < -0.01) {
                    type = 'maximum';
                } else if (secondDeriv > 0.01) {
                    type = 'minimum';
                }

                // Check if we already have a nearby critical point
                const isDuplicate = criticalPoints.some(cp =>
                    Math.abs(cp.x - x) < step * 2
                );

                if (!isDuplicate && type !== 'inflection') {
                    criticalPoints.push({
                        x: parseFloat(x.toFixed(3)),
                        y: parseFloat(y.toFixed(3)),
                        type: type,
                        derivative: parseFloat(derivative.toFixed(5)),
                        secondDerivative: parseFloat(secondDeriv.toFixed(5))
                    });
                }
            }
        }

        // Refine critical points using Newton's method
        this.criticalPoints = criticalPoints.map(cp => this.refineCriticalPoint(func, cp));
        return this.criticalPoints;
    }

    /**
     * Refine a critical point using Newton's method
     * @param {Function} func - The function
     * @param {Object} roughPoint - Initial estimate of critical point
     * @returns {Object} Refined critical point
     */
    refineCriticalPoint(func, roughPoint) {
        let x = roughPoint.x;
        const maxIterations = 10;
        const tolerance = 0.0001;

        for (let i = 0; i < maxIterations; i++) {
            const d1 = this.derivative(func, x);
            const d2 = this.secondDerivative(func, x);

            if (Math.abs(d2) < 1e-10) break; // Avoid division by zero

            const dx = d1 / d2;
            x = x - dx;

            if (Math.abs(dx) < tolerance) break;
        }

        const y = func(x);
        const secondDeriv = this.secondDerivative(func, x);

        return {
            x: parseFloat(x.toFixed(4)),
            y: parseFloat(y.toFixed(4)),
            type: secondDeriv < 0 ? 'maximum' : 'minimum',
            derivative: parseFloat(this.derivative(func, x).toFixed(6)),
            secondDerivative: parseFloat(secondDeriv.toFixed(4))
        };
    }

    /**
     * Get a sample mathematical function
     * @param {number} type - Type of function (1-5)
     * @returns {Object} Function object with func and description
     */
    getSampleFunction(type = 1) {
        const functions = [
            {
                id: 1,
                name: '이차 함수',
                equation: 'f(x) = -x² + 4x + 1',
                func: (x) => -x * x + 4 * x + 1,
                description: '기본적인 이차 함수입니다. 극댓값을 찾아보세요!'
            },
            {
                id: 2,
                name: '삼차 함수',
                equation: 'f(x) = x³ - 6x² + 9x + 1',
                func: (x) => x * x * x - 6 * x * x + 9 * x + 1,
                description: '삼차 함수는 극댓값과 극솟값을 모두 가질 수 있습니다!'
            },
            {
                id: 3,
                name: '사차 함수',
                equation: 'f(x) = 0.1x⁴ - x² + 2',
                func: (x) => 0.1 * Math.pow(x, 4) - x * x + 2,
                description: '사차 함수에서 극값들을 찾아보세요!'
            },
            {
                id: 4,
                name: '삼각 함수',
                equation: 'f(x) = 2sin(x) + cos(2x)',
                func: (x) => 2 * Math.sin(x) + Math.cos(2 * x),
                description: '삼각 함수는 주기적으로 극값이 나타납니다!'
            },
            {
                id: 5,
                name: '복합 함수',
                equation: 'f(x) = x³ - 3x² - 9x + 5',
                func: (x) => x * x * x - 3 * x * x - 9 * x + 5,
                description: '조금 더 복잡한 삼차 함수입니다. 극값이 2개 있어요!'
            }
        ];

        const index = (type - 1) % functions.length;
        this.currentFunction = functions[index];
        return this.currentFunction;
    }

    /**
     * Get current function
     * @returns {Object} Current function object
     */
    getCurrentFunction() {
        return this.currentFunction || this.getSampleFunction(1);
    }

    /**
     * Get critical points found
     * @returns {Array} Array of critical points
     */
    getCriticalPoints() {
        return this.criticalPoints;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathEngine;
}
