/**
 * Math Parser - Evaluates mathematical expressions safely
 * Supports: +, -, *, /, ^, sin, cos, tan, sqrt, abs, etc.
 */

class MathParser {
    constructor() {
        this.allowedFunctions = {
            'sin': Math.sin,
            'cos': Math.cos,
            'tan': Math.tan,
            'sqrt': Math.sqrt,
            'abs': Math.abs,
            'log': Math.log,
            'exp': Math.exp,
            'floor': Math.floor,
            'ceil': Math.ceil,
            'round': Math.round
        };
    }

    /**
     * Parse and evaluate a mathematical expression for a given x value
     * @param {string} expression - The mathematical expression (e.g., "x^2 - 4")
     * @param {number} x - The value of x
     * @returns {number} - The result of evaluation
     */
    evaluate(expression, x) {
        try {
            // Replace ^ with ** for exponentiation
            let processed = expression.replace(/\^/g, '**');

            // Replace mathematical functions
            Object.keys(this.allowedFunctions).forEach(func => {
                const regex = new RegExp(func + '\\(', 'g');
                processed = processed.replace(regex, `Math.${func}(`);
            });

            // Replace x with the actual value
            processed = processed.replace(/x/g, `(${x})`);

            // Replace implicit multiplication (e.g., "2x" becomes "2*x")
            processed = processed.replace(/(\d)(\()/g, '$1*$2');
            processed = processed.replace(/(\))(\d)/g, '$1*$2');
            processed = processed.replace(/(\))(\()/g, '$1*$2');

            // Evaluate the expression safely
            // Note: In production, use a proper math parser library like math.js
            const result = Function('"use strict"; return (' + processed + ')')();

            return result;
        } catch (error) {
            console.error('Error evaluating expression:', error);
            return NaN;
        }
    }

    /**
     * Validate if an expression is syntactically correct
     * @param {string} expression - The mathematical expression
     * @returns {boolean} - True if valid, false otherwise
     */
    isValid(expression) {
        try {
            // Try to evaluate with x = 0
            const result = this.evaluate(expression, 0);
            return !isNaN(result) && isFinite(result);
        } catch {
            return false;
        }
    }

    /**
     * Get the derivative of a function at a point using numerical approximation
     * @param {string} expression - The mathematical expression
     * @param {number} x - The point at which to find the derivative
     * @returns {number} - The approximate derivative
     */
    derivative(expression, x) {
        const h = 0.0001;
        const f_x_plus_h = this.evaluate(expression, x + h);
        const f_x_minus_h = this.evaluate(expression, x - h);
        return (f_x_plus_h - f_x_minus_h) / (2 * h);
    }
}

// Create a global instance
const mathParser = new MathParser();
