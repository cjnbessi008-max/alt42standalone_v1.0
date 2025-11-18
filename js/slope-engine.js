/**
 * Slope Calculation Engine
 *
 * Calculates slope values and manages heat map color mapping
 */

class SlopeEngine {
    constructor(options = {}) {
        this.minSlope = options.minSlope || 0;
        this.maxSlope = options.maxSlope || 20;

        // Color gradient configuration
        // Blue (gentle) -> Green -> Yellow -> Orange -> Red (steep)
        this.colorStops = [
            { value: 0.0, color: { r: 33, g: 102, b: 172 } },   // Blue
            { value: 0.25, color: { r: 67, g: 160, b: 71 } },   // Green
            { value: 0.5, color: { r: 255, g: 235, b: 59 } },   // Yellow
            { value: 0.75, color: { r: 255, g: 152, b: 0 } },   // Orange
            { value: 1.0, color: { r: 244, g: 67, b: 54 } }     // Red
        ];
    }

    /**
     * Normalize slope value to 0-1 range
     * @param {number} slope - Raw slope value
     * @return {number} Normalized value (0-1)
     */
    normalize(slope) {
        return Math.max(0, Math.min(1, (slope - this.minSlope) / (this.maxSlope - this.minSlope)));
    }

    /**
     * Get color for a given slope value
     * @param {number} slope - Raw slope value
     * @return {string} RGB color string
     */
    getColor(slope) {
        const normalized = this.normalize(slope);
        return this.interpolateColor(normalized);
    }

    /**
     * Interpolate color based on normalized value
     * @param {number} value - Normalized value (0-1)
     * @return {string} RGB color string
     */
    interpolateColor(value) {
        // Find the two color stops to interpolate between
        let lowerStop = this.colorStops[0];
        let upperStop = this.colorStops[this.colorStops.length - 1];

        for (let i = 0; i < this.colorStops.length - 1; i++) {
            if (value >= this.colorStops[i].value && value <= this.colorStops[i + 1].value) {
                lowerStop = this.colorStops[i];
                upperStop = this.colorStops[i + 1];
                break;
            }
        }

        // Calculate interpolation factor
        const range = upperStop.value - lowerStop.value;
        const factor = range === 0 ? 0 : (value - lowerStop.value) / range;

        // Interpolate RGB values
        const r = Math.round(lowerStop.color.r + (upperStop.color.r - lowerStop.color.r) * factor);
        const g = Math.round(lowerStop.color.g + (upperStop.color.g - lowerStop.color.g) * factor);
        const b = Math.round(lowerStop.color.b + (upperStop.color.b - lowerStop.color.b) * factor);

        return `rgb(${r}, ${g}, ${b})`;
    }

    /**
     * Get color description for slope value
     * @param {number} slope - Raw slope value
     * @return {string} Color description
     */
    getColorDescription(slope) {
        const normalized = this.normalize(slope);

        if (normalized < 0.2) return '매우 완만 (파란색)';
        if (normalized < 0.4) return '완만 (초록색)';
        if (normalized < 0.6) return '보통 (노란색)';
        if (normalized < 0.8) return '가파름 (주황색)';
        return '매우 가파름 (빨간색)';
    }

    /**
     * Calculate slope from data points
     * @param {Array} points - Array of {x, y} points
     * @return {number} Calculated slope
     */
    static calculateSlope(points) {
        if (!points || points.length < 2) return 0;

        // Simple linear regression
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        const n = points.length;

        for (const point of points) {
            sumX += point.x;
            sumY += point.y;
            sumXY += point.x * point.y;
            sumXX += point.x * point.x;
        }

        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return isNaN(slope) ? 0 : slope;
    }
}
