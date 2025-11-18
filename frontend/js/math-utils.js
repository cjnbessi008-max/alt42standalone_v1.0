/**
 * Mathematical Utilities for Inverse Function Calculations
 */

class MathUtils {
    /**
     * Parse function string and evaluate at given x
     */
    static evaluateFunction(functionStr, x) {
        try {
            // Replace common mathematical notations
            let expr = functionStr
                .replace(/\^/g, '**')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/log2/g, 'Math.log2')
                .replace(/log10/g, 'Math.log10')
                .replace(/ln/g, 'Math.log')
                .replace(/exp/g, 'Math.exp')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan');

            // Replace x with actual value
            expr = expr.replace(/x/g, `(${x})`);

            // Evaluate using math.js if available, otherwise use eval
            if (typeof math !== 'undefined') {
                return math.evaluate(functionStr.replace(/x/g, x.toString()));
            } else {
                return eval(expr);
            }
        } catch (error) {
            console.error('Error evaluating function:', error);
            return null;
        }
    }

    /**
     * Generate points for function plot
     */
    static generateFunctionPoints(functionStr, xMin, xMax, numPoints = 100) {
        const points = [];
        const step = (xMax - xMin) / numPoints;

        for (let i = 0; i <= numPoints; i++) {
            const x = xMin + (i * step);
            const y = this.evaluateFunction(functionStr, x);

            if (y !== null && !isNaN(y) && isFinite(y)) {
                points.push({ x, y });
            }
        }

        return points;
    }

    /**
     * Reflect point across y=x line
     * The reflection of (a, b) across y=x is (b, a)
     */
    static reflectPointAcrossYX(point) {
        return {
            x: point.y,
            y: point.x
        };
    }

    /**
     * Calculate distance between two points
     */
    static distance(p1, p2) {
        return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    }

    /**
     * Find closest point on function to given coordinates
     */
    static findClosestPoint(functionPoints, targetX, targetY) {
        let closestPoint = functionPoints[0];
        let minDistance = Infinity;

        for (const point of functionPoints) {
            const dist = this.distance(point, { x: targetX, y: targetY });
            if (dist < minDistance) {
                minDistance = dist;
                closestPoint = point;
            }
        }

        return closestPoint;
    }

    /**
     * Verify if f(f^-1(x)) = x
     */
    static verifyInverse(originalFunc, inverseFunc, testX) {
        try {
            const y = this.evaluateFunction(originalFunc, testX);
            const xReconstructed = this.evaluateFunction(inverseFunc, y);

            const tolerance = 0.001;
            return Math.abs(xReconstructed - testX) < tolerance;
        } catch (error) {
            return false;
        }
    }

    /**
     * Format number for display
     */
    static formatNumber(num, decimals = 2) {
        if (num === null || isNaN(num) || !isFinite(num)) {
            return 'undefined';
        }
        return Number(num).toFixed(decimals);
    }

    /**
     * Parse function expression for display
     */
    static formatFunctionExpression(funcStr) {
        return funcStr
            .replace(/\*\*/g, '^')
            .replace(/Math\./g, '')
            .replace(/sqrt/g, '√')
            .replace(/\*/g, '·');
    }

    /**
     * Calculate interpolated points for smooth animation
     */
    static interpolatePoints(start, end, numSteps = 20) {
        const points = [];
        for (let i = 0; i <= numSteps; i++) {
            const t = i / numSteps;
            points.push({
                x: start.x + (end.x - start.x) * t,
                y: start.y + (end.y - start.y) * t
            });
        }
        return points;
    }

    /**
     * Calculate perpendicular distance from point to line y=x
     */
    static distanceToYXLine(point) {
        // Distance from point (x0, y0) to line y=x (or x-y=0)
        // Formula: |x0 - y0| / sqrt(2)
        return Math.abs(point.x - point.y) / Math.sqrt(2);
    }

    /**
     * Find projection of point onto y=x line
     */
    static projectOntoYXLine(point) {
        // Projection of (x, y) onto y=x is ((x+y)/2, (x+y)/2)
        const avg = (point.x + point.y) / 2;
        return { x: avg, y: avg };
    }
}
