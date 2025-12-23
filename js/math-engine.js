/**
 * Math Engine for Dual Derivative Sync
 * Handles mathematical computations, function parsing, and numerical derivatives
 */

class MathEngine {
    constructor() {
        this.h = 0.0001; // Small value for numerical differentiation
    }

    /**
     * Parse and evaluate mathematical expressions
     * @param {string} expr - Mathematical expression (e.g., "x^2", "sin(x)")
     * @param {number} x - Value to evaluate at
     * @returns {number} Result of evaluation
     */
    evaluate(expr, x) {
        try {
            // Replace mathematical functions and operators
            let sanitized = expr
                .replace(/\^/g, '**')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/exp/g, 'Math.exp')
                .replace(/log/g, 'Math.log')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/abs/g, 'Math.abs')
                .replace(/x/g, `(${x})`);

            // Use Function constructor for safe evaluation
            const func = new Function('return ' + sanitized);
            const result = func();

            if (isNaN(result) || !isFinite(result)) {
                return 0;
            }

            return result;
        } catch (error) {
            console.error('Evaluation error:', error);
            return 0;
        }
    }

    /**
     * Calculate numerical derivative using central difference method
     * @param {string} expr - Function expression
     * @param {number} x - Point to calculate derivative at
     * @returns {number} Derivative value
     */
    derivative(expr, x) {
        try {
            const fxh = this.evaluate(expr, x + this.h);
            const fx_h = this.evaluate(expr, x - this.h);

            // Central difference: f'(x) ≈ [f(x+h) - f(x-h)] / 2h
            return (fxh - fx_h) / (2 * this.h);
        } catch (error) {
            console.error('Derivative error:', error);
            return 0;
        }
    }

    /**
     * Generate symbolic derivative expression (basic cases)
     * @param {string} expr - Function expression
     * @returns {string} Derivative expression
     */
    symbolicDerivative(expr) {
        // Basic symbolic differentiation for common cases
        const patterns = [
            { pattern: /^x\^(\d+)$/, derivative: (match) => {
                const n = parseInt(match[1]);
                if (n === 2) return 'x';
                if (n === 1) return '1';
                return `${n}*x^${n-1}`;
            }},
            { pattern: /^(\d+)\*x\^(\d+)$/, derivative: (match) => {
                const a = parseInt(match[1]);
                const n = parseInt(match[2]);
                return `${a*n}*x^${n-1}`;
            }},
            { pattern: /^sin\(x\)$/, derivative: () => 'cos(x)' },
            { pattern: /^cos\(x\)$/, derivative: () => '-sin(x)' },
            { pattern: /^exp\(x\)$/, derivative: () => 'exp(x)' },
            { pattern: /^log\(x\)$/, derivative: () => '1/x' },
        ];

        for (const {pattern, derivative} of patterns) {
            const match = expr.match(pattern);
            if (match) {
                return derivative(match);
            }
        }

        return "f'(x)"; // Fallback
    }

    /**
     * Generate array of x,y points for plotting
     * @param {string} expr - Function expression
     * @param {number} xMin - Minimum x value
     * @param {number} xMax - Maximum x value
     * @param {number} points - Number of points to generate
     * @returns {Array} Array of {x, y} objects
     */
    generatePoints(expr, xMin, xMax, points = 100) {
        const data = [];
        const step = (xMax - xMin) / points;

        for (let i = 0; i <= points; i++) {
            const x = xMin + (i * step);
            const y = this.evaluate(expr, x);
            data.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
        }

        return data;
    }

    /**
     * Generate derivative function points
     * @param {string} expr - Original function expression
     * @param {number} xMin - Minimum x value
     * @param {number} xMax - Maximum x value
     * @param {number} points - Number of points to generate
     * @returns {Array} Array of {x, y} objects for derivative
     */
    generateDerivativePoints(expr, xMin, xMax, points = 100) {
        const data = [];
        const step = (xMax - xMin) / points;

        for (let i = 0; i <= points; i++) {
            const x = xMin + (i * step);
            const y = this.derivative(expr, x);
            data.push({ x: parseFloat(x.toFixed(4)), y: parseFloat(y.toFixed(4)) });
        }

        return data;
    }

    /**
     * Calculate tangent line at a specific point
     * @param {string} expr - Function expression
     * @param {number} x0 - Point of tangency
     * @returns {Object} Tangent line data {slope, point, equation}
     */
    getTangentLine(expr, x0) {
        const y0 = this.evaluate(expr, x0);
        const slope = this.derivative(expr, x0);

        // Tangent line: y - y0 = m(x - x0) => y = mx - mx0 + y0
        const tangentFunc = (x) => slope * (x - x0) + y0;

        return {
            slope: parseFloat(slope.toFixed(4)),
            point: { x: x0, y: y0 },
            equation: `y = ${slope.toFixed(2)}(x - ${x0.toFixed(2)}) + ${y0.toFixed(2)}`,
            evaluate: tangentFunc
        };
    }

    /**
     * Get function statistics
     * @param {string} expr - Function expression
     * @param {number} xMin - Minimum x value
     * @param {number} xMax - Maximum x value
     * @returns {Object} Statistics about the function
     */
    getFunctionStats(expr, xMin, xMax) {
        const points = this.generatePoints(expr, xMin, xMax, 100);
        const yValues = points.map(p => p.y);

        return {
            min: Math.min(...yValues),
            max: Math.max(...yValues),
            range: Math.max(...yValues) - Math.min(...yValues)
        };
    }

    /**
     * Validate function expression
     * @param {string} expr - Expression to validate
     * @returns {Object} {valid: boolean, error: string}
     */
    validateExpression(expr) {
        if (!expr || expr.trim() === '') {
            return { valid: false, error: '함수를 입력해주세요.' };
        }

        try {
            // Test evaluation at x=1
            const result = this.evaluate(expr, 1);
            if (isNaN(result)) {
                return { valid: false, error: '유효하지 않은 수식입니다.' };
            }
            return { valid: true, error: null };
        } catch (error) {
            return { valid: false, error: '수식 파싱 오류: ' + error.message };
        }
    }

    /**
     * Format number for display
     * @param {number} num - Number to format
     * @param {number} decimals - Number of decimal places
     * @returns {string} Formatted number
     */
    formatNumber(num, decimals = 2) {
        if (isNaN(num) || !isFinite(num)) {
            return '0.00';
        }
        return num.toFixed(decimals);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathEngine;
}
