/**
 * Color Utilities
 * Manages smooth color gradients for overlapping regions
 */

class ColorUtils {
    /**
     * Blend multiple RGB colors with smooth gradient
     * @param {Array<Array<number>>} colors - Array of [r, g, b] colors
     * @param {number} intensity - Color intensity (0-1)
     * @returns {string} RGBA color string
     */
    static blendColors(colors, intensity = 0.7) {
        if (colors.length === 0) {
            return 'rgba(255, 255, 255, 0)';
        }

        if (colors.length === 1) {
            const [r, g, b] = colors[0];
            return `rgba(${r}, ${g}, ${b}, ${intensity * 0.3})`;
        }

        // Calculate average color
        let r = 0, g = 0, b = 0;

        for (const color of colors) {
            r += color[0];
            g += color[1];
            b += color[2];
        }

        r = Math.round(r / colors.length);
        g = Math.round(g / colors.length);
        b = Math.round(b / colors.length);

        // Alpha increases with overlap count (smooth transition)
        const overlapFactor = Math.min(colors.length / 3, 1);
        const alpha = intensity * (0.3 + overlapFactor * 0.6);

        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Create a smooth gradient color based on overlap count
     * @param {number} overlapCount - Number of overlapping inequalities
     * @param {number} maxOverlap - Maximum possible overlap
     * @param {number} intensity - Base intensity
     * @returns {string} RGBA color string
     */
    static createOverlapGradient(overlapCount, maxOverlap, intensity = 0.7) {
        if (overlapCount === 0) {
            return 'rgba(255, 255, 255, 0)';
        }

        // Create a gradient from light blue to deep purple
        const ratio = overlapCount / maxOverlap;

        // HSL color space for smooth transitions
        const hue = 240 - (ratio * 60); // Blue (240) to Purple (180)
        const saturation = 50 + (ratio * 30); // Increase saturation
        const lightness = 70 - (ratio * 40); // Decrease lightness
        const alpha = intensity * (0.3 + ratio * 0.6);

        return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alpha})`;
    }

    /**
     * Get color for specific inequality
     * @param {number} index - Inequality index
     * @param {number} alpha - Alpha value
     * @returns {string} RGBA color string
     */
    static getInequalityColor(index, alpha = 0.3) {
        const colors = [
            [255, 99, 132],   // Red
            [54, 162, 235],   // Blue
            [255, 206, 86],   // Yellow
            [75, 192, 192],   // Teal
            [153, 102, 255],  // Purple
            [255, 159, 64],   // Orange
            [199, 199, 199],  // Grey
            [83, 102, 255],   // Indigo
            [255, 99, 255],   // Pink
            [99, 255, 132]    // Green
        ];

        const [r, g, b] = colors[index % colors.length];
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Convert RGB to HSL
     * @param {number} r - Red (0-255)
     * @param {number} g - Green (0-255)
     * @param {number} b - Blue (0-255)
     * @returns {Array<number>} [h, s, l]
     */
    static rgbToHsl(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

            switch (max) {
                case r:
                    h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
                    break;
                case g:
                    h = ((b - r) / d + 2) / 6;
                    break;
                case b:
                    h = ((r - g) / d + 4) / 6;
                    break;
            }
        }

        return [h * 360, s * 100, l * 100];
    }

    /**
     * Create a heat map color
     * @param {number} value - Value between 0 and 1
     * @param {number} intensity - Color intensity
     * @returns {string} RGBA color string
     */
    static heatMapColor(value, intensity = 0.7) {
        // Blue -> Cyan -> Green -> Yellow -> Red
        const h = (1 - value) * 240; // 240 (blue) to 0 (red)
        const s = 100;
        const l = 50;
        const alpha = intensity * (0.4 + value * 0.5);

        return `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
    }

    /**
     * Interpolate between two colors
     * @param {Array<number>} color1 - [r, g, b]
     * @param {Array<number>} color2 - [r, g, b]
     * @param {number} factor - Interpolation factor (0-1)
     * @returns {Array<number>} Interpolated [r, g, b]
     */
    static interpolateColor(color1, color2, factor) {
        const r = Math.round(color1[0] + factor * (color2[0] - color1[0]));
        const g = Math.round(color1[1] + factor * (color2[1] - color1[1]));
        const b = Math.round(color1[2] + factor * (color2[2] - color1[2]));

        return [r, g, b];
    }

    /**
     * Create gradient palette
     * @param {number} steps - Number of gradient steps
     * @returns {Array<string>} Array of color strings
     */
    static createGradientPalette(steps = 10) {
        const palette = [];
        for (let i = 0; i < steps; i++) {
            const ratio = i / (steps - 1);
            palette.push(this.heatMapColor(ratio));
        }
        return palette;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ColorUtils;
}
