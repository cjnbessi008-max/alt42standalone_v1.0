/**
 * Feature Spotlight - Mathematical Analysis Engine
 *
 * Analyzes mathematical functions to detect key calculus features:
 * - 증감 (Increasing/Decreasing intervals)
 * - 극값 (Local maxima and minima)
 * - 변곡점 (Inflection points)
 *
 * Uses numerical methods for derivative approximation
 */

class MathAnalyzer {
    constructor(options = {}) {
        this.epsilon = options.epsilon || 0.0001; // Step size for numerical derivative
        this.zeroThreshold = options.zeroThreshold || 0.001; // Threshold for considering value as zero
        this.samplePoints = options.samplePoints || 1000;
        this.xMin = options.xMin || -10;
        this.xMax = options.xMax || 10;
    }

    /**
     * Parse and evaluate a mathematical function
     * Supports basic operations: +, -, *, /, ^, sin, cos, tan, exp, ln, sqrt, abs
     *
     * @param {string} expression - Mathematical expression (e.g., "x^2 - 4*x + 3")
     * @param {number} x - Input value
     * @returns {number} - Function value at x
     */
    evaluateFunction(expression, x) {
        try {
            // Replace common math notation
            let expr = expression
                .replace(/\^/g, '**') // Power operator
                .replace(/(\d+)([a-zA-Z])/g, '$1*$2') // Implicit multiplication: 2x -> 2*x
                .replace(/\)(\d+)/g, ')*$1') // )(2 -> )*(2
                .replace(/\)([a-zA-Z])/g, ')*$1') // )(x -> )*(x
                .replace(/([a-zA-Z])\(/g, '$1*('); // x( -> x*(

            // Replace mathematical functions
            expr = expr
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/exp/g, 'Math.exp')
                .replace(/ln/g, 'Math.log')
                .replace(/log/g, 'Math.log10')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/abs/g, 'Math.abs')
                .replace(/pi/gi, 'Math.PI')
                .replace(/e(?![a-z])/gi, 'Math.E');

            // Replace variable x with actual value
            expr = expr.replace(/x/g, `(${x})`);

            // Evaluate using Function constructor (safer than eval)
            const result = new Function('return ' + expr)();

            if (!isFinite(result)) {
                return NaN;
            }

            return result;
        } catch (error) {
            console.error('Error evaluating function:', error);
            return NaN;
        }
    }

    /**
     * Calculate numerical first derivative using central difference
     *
     * @param {string} func - Mathematical function expression
     * @param {number} x - Point at which to calculate derivative
     * @returns {number} - Approximate derivative value
     */
    firstDerivative(func, x) {
        const h = this.epsilon;
        const f_plus = this.evaluateFunction(func, x + h);
        const f_minus = this.evaluateFunction(func, x - h);

        return (f_plus - f_minus) / (2 * h);
    }

    /**
     * Calculate numerical second derivative
     *
     * @param {string} func - Mathematical function expression
     * @param {number} x - Point at which to calculate derivative
     * @returns {number} - Approximate second derivative value
     */
    secondDerivative(func, x) {
        const h = this.epsilon;
        const f_center = this.evaluateFunction(func, x);
        const f_plus = this.evaluateFunction(func, x + h);
        const f_minus = this.evaluateFunction(func, x - h);

        return (f_plus - 2 * f_center + f_minus) / (h * h);
    }

    /**
     * Find critical points where first derivative is approximately zero
     *
     * @param {string} func - Mathematical function expression
     * @returns {Array} - Array of {x, y, type} objects
     */
    findCriticalPoints(func) {
        const criticalPoints = [];
        const step = (this.xMax - this.xMin) / this.samplePoints;

        for (let x = this.xMin; x <= this.xMax; x += step) {
            const derivative = this.firstDerivative(func, x);

            // Check if derivative is approximately zero
            if (Math.abs(derivative) < this.zeroThreshold) {
                const y = this.evaluateFunction(func, x);
                const secondDeriv = this.secondDerivative(func, x);

                let type = 'critical';
                if (secondDeriv > this.zeroThreshold) {
                    type = 'local_minimum';
                } else if (secondDeriv < -this.zeroThreshold) {
                    type = 'local_maximum';
                } else {
                    type = 'saddle_point';
                }

                // Avoid duplicates (points too close together)
                const isDuplicate = criticalPoints.some(pt =>
                    Math.abs(pt.x - x) < step * 2
                );

                if (!isDuplicate && isFinite(y)) {
                    criticalPoints.push({
                        x: parseFloat(x.toFixed(4)),
                        y: parseFloat(y.toFixed(4)),
                        type: type
                    });
                }
            }
        }

        return criticalPoints;
    }

    /**
     * Find inflection points where second derivative changes sign
     *
     * @param {string} func - Mathematical function expression
     * @returns {Array} - Array of {x, y} objects
     */
    findInflectionPoints(func) {
        const inflectionPoints = [];
        const step = (this.xMax - this.xMin) / this.samplePoints;
        let prevSecondDeriv = this.secondDerivative(func, this.xMin);

        for (let x = this.xMin + step; x <= this.xMax; x += step) {
            const secondDeriv = this.secondDerivative(func, x);

            // Check if second derivative changes sign
            if (prevSecondDeriv * secondDeriv < 0 && isFinite(secondDeriv)) {
                const y = this.evaluateFunction(func, x);

                if (isFinite(y)) {
                    inflectionPoints.push({
                        x: parseFloat(x.toFixed(4)),
                        y: parseFloat(y.toFixed(4))
                    });
                }
            }

            prevSecondDeriv = secondDeriv;
        }

        return inflectionPoints;
    }

    /**
     * Determine intervals where function is increasing or decreasing
     *
     * @param {string} func - Mathematical function expression
     * @returns {Object} - {increasing: [[x1, x2], ...], decreasing: [[x1, x2], ...]}
     */
    findMonotonicIntervals(func) {
        const intervals = {
            increasing: [],
            decreasing: []
        };

        const step = (this.xMax - this.xMin) / this.samplePoints;
        let currentType = null;
        let intervalStart = this.xMin;

        for (let x = this.xMin; x <= this.xMax; x += step) {
            const derivative = this.firstDerivative(func, x);

            let newType = null;
            if (derivative > this.zeroThreshold) {
                newType = 'increasing';
            } else if (derivative < -this.zeroThreshold) {
                newType = 'decreasing';
            }

            // Interval changed
            if (newType !== currentType && currentType !== null) {
                if (currentType === 'increasing') {
                    intervals.increasing.push([
                        parseFloat(intervalStart.toFixed(4)),
                        parseFloat(x.toFixed(4))
                    ]);
                } else if (currentType === 'decreasing') {
                    intervals.decreasing.push([
                        parseFloat(intervalStart.toFixed(4)),
                        parseFloat(x.toFixed(4))
                    ]);
                }
                intervalStart = x;
            }

            currentType = newType;
        }

        // Add final interval
        if (currentType === 'increasing') {
            intervals.increasing.push([
                parseFloat(intervalStart.toFixed(4)),
                parseFloat(this.xMax.toFixed(4))
            ]);
        } else if (currentType === 'decreasing') {
            intervals.decreasing.push([
                parseFloat(intervalStart.toFixed(4)),
                parseFloat(this.xMax.toFixed(4))
            ]);
        }

        return intervals;
    }

    /**
     * Comprehensive analysis of a mathematical function
     * Finds all key features: extrema, inflection points, monotonic intervals
     *
     * @param {string} func - Mathematical function expression
     * @returns {Object} - Complete analysis results
     */
    analyzeFunction(func) {
        console.log('Analyzing function:', func);

        const criticalPoints = this.findCriticalPoints(func);
        const inflectionPoints = this.findInflectionPoints(func);
        const intervals = this.findMonotonicIntervals(func);

        // Separate maxima and minima
        const localMaxima = criticalPoints.filter(pt => pt.type === 'local_maximum');
        const localMinima = criticalPoints.filter(pt => pt.type === 'local_minimum');

        const results = {
            function: func,
            range: {
                xMin: this.xMin,
                xMax: this.xMax
            },
            features: {
                local_maxima: localMaxima,
                local_minima: localMinima,
                inflection_points: inflectionPoints,
                increasing_intervals: intervals.increasing,
                decreasing_intervals: intervals.decreasing,
                critical_points: criticalPoints
            },
            summary: {
                total_maxima: localMaxima.length,
                total_minima: localMinima.length,
                total_inflection_points: inflectionPoints.length,
                increasing_interval_count: intervals.increasing.length,
                decreasing_interval_count: intervals.decreasing.length
            },
            timestamp: new Date().toISOString()
        };

        console.log('Analysis complete:', results);
        return results;
    }

    /**
     * Generate sample points for plotting the function
     *
     * @param {string} func - Mathematical function expression
     * @param {number} points - Number of points to generate
     * @returns {Array} - Array of {x, y} coordinates
     */
    generatePlotData(func, points = 200) {
        const plotData = [];
        const step = (this.xMax - this.xMin) / points;

        for (let x = this.xMin; x <= this.xMax; x += step) {
            const y = this.evaluateFunction(func, x);
            if (isFinite(y)) {
                plotData.push({
                    x: parseFloat(x.toFixed(4)),
                    y: parseFloat(y.toFixed(4))
                });
            }
        }

        return plotData;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathAnalyzer;
}
