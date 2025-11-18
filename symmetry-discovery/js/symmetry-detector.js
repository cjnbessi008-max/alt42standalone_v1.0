/**
 * Symmetry Detector
 * Detects when shapes are rotated to reveal symmetry lines
 */

class SymmetryDetector {
    constructor() {
        this.discoveredSymmetries = new Set();
        this.currentShape = null;
        this.lastCheckAngle = null;
    }

    /**
     * Normalize angle to 0-360 range
     */
    normalizeAngle(angle) {
        angle = angle % 360;
        if (angle < 0) angle += 360;
        return angle;
    }

    /**
     * Calculate the minimum angular distance between two angles
     */
    angleDifference(angle1, angle2) {
        angle1 = this.normalizeAngle(angle1);
        angle2 = this.normalizeAngle(angle2);

        let diff = Math.abs(angle1 - angle2);
        if (diff > 180) diff = 360 - diff;

        return diff;
    }

    /**
     * Check if current rotation reveals a symmetry line
     * @param {number} currentAngle - Current rotation angle
     * @param {Object} shape - Shape object with symmetryLines
     * @returns {Object|null} - Symmetry line object if found, null otherwise
     */
    checkSymmetry(currentAngle, shape) {
        if (!shape || !shape.symmetryLines) return null;

        currentAngle = this.normalizeAngle(currentAngle);

        for (let symmetryLine of shape.symmetryLines) {
            const symmetryKey = `${shape.id}-${symmetryLine.angle}`;

            // Skip if already discovered
            if (this.discoveredSymmetries.has(symmetryKey)) {
                continue;
            }

            const diff = this.angleDifference(currentAngle, symmetryLine.angle);

            if (diff <= symmetryLine.tolerance) {
                return {
                    symmetryLine: symmetryLine,
                    key: symmetryKey,
                    accuracy: 100 - (diff / symmetryLine.tolerance) * 100
                };
            }
        }

        return null;
    }

    /**
     * Mark a symmetry as discovered
     */
    discoverSymmetry(symmetryKey) {
        this.discoveredSymmetries.add(symmetryKey);
    }

    /**
     * Reset discovered symmetries for new shape
     */
    resetForNewShape(shape) {
        this.discoveredSymmetries.clear();
        this.currentShape = shape;
        this.lastCheckAngle = null;
    }

    /**
     * Get number of discovered symmetries for current shape
     */
    getDiscoveredCount(shape) {
        if (!shape) return 0;

        let count = 0;
        for (let symmetryLine of shape.symmetryLines) {
            const symmetryKey = `${shape.id}-${symmetryLine.angle}`;
            if (this.discoveredSymmetries.has(symmetryKey)) {
                count++;
            }
        }
        return count;
    }

    /**
     * Check if all symmetries are discovered for current shape
     */
    allSymmetriesDiscovered(shape) {
        if (!shape) return false;
        return this.getDiscoveredCount(shape) === shape.symmetryLines.length;
    }

    /**
     * Get hint - return the closest undiscovered symmetry line angle
     */
    getHint(currentAngle, shape) {
        if (!shape || !shape.symmetryLines) return null;

        let closestSymmetry = null;
        let minDistance = Infinity;

        for (let symmetryLine of shape.symmetryLines) {
            const symmetryKey = `${shape.id}-${symmetryLine.angle}`;

            // Skip if already discovered
            if (this.discoveredSymmetries.has(symmetryKey)) {
                continue;
            }

            const distance = this.angleDifference(currentAngle, symmetryLine.angle);
            if (distance < minDistance) {
                minDistance = distance;
                closestSymmetry = symmetryLine;
            }
        }

        return closestSymmetry;
    }

    /**
     * Get direction hint (clockwise or counterclockwise)
     */
    getDirectionHint(currentAngle, targetAngle) {
        currentAngle = this.normalizeAngle(currentAngle);
        targetAngle = this.normalizeAngle(targetAngle);

        const diff = targetAngle - currentAngle;

        if (diff > 0 && diff <= 180) return 'clockwise';
        if (diff > 180) return 'counterclockwise';
        if (diff < 0 && diff >= -180) return 'counterclockwise';
        return 'clockwise';
    }

    /**
     * Calculate score based on accuracy
     */
    calculateScore(accuracy, difficulty) {
        const baseScore = 100;
        const difficultyMultiplier = difficulty || 1;
        const accuracyBonus = Math.floor(accuracy);

        return (baseScore + accuracyBonus) * difficultyMultiplier;
    }
}

/**
 * Symmetry Line Renderer
 * Handles visual rendering of symmetry lines
 */
class SymmetryLineRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.animationFrame = 0;
        this.glowIntensity = 0;
        this.revealedLines = [];
    }

    /**
     * Draw a symmetry line with glow effect
     */
    drawSymmetryLine(centerX, centerY, angle, length, intensity = 1) {
        const ctx = this.ctx;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((angle * Math.PI) / 180);

        // Animated glow
        const glowSize = 20 + Math.sin(this.animationFrame * 0.1) * 5;

        // Outer glow
        for (let i = 5; i > 0; i--) {
            ctx.beginPath();
            ctx.moveTo(0, -length);
            ctx.lineTo(0, length);
            ctx.strokeStyle = `rgba(255, 215, 0, ${0.1 * i * intensity})`;
            ctx.lineWidth = glowSize * i * 0.3;
            ctx.stroke();
        }

        // Main line
        ctx.beginPath();
        ctx.moveTo(0, -length);
        ctx.lineTo(0, length);

        const gradient = ctx.createLinearGradient(0, -length, 0, length);
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0)');
        gradient.addColorStop(0.5, `rgba(255, 255, 0, ${intensity})`);
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.stroke();

        // Sparkle points
        for (let i = -length; i <= length; i += 20) {
            const sparkleIntensity = Math.sin(this.animationFrame * 0.2 + i * 0.1) * 0.5 + 0.5;
            ctx.beginPath();
            ctx.arc(0, i, 3, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${sparkleIntensity * intensity})`;
            ctx.fill();
        }

        ctx.restore();
    }

    /**
     * Reveal symmetry line with animation
     */
    revealSymmetryLine(centerX, centerY, angle, length) {
        this.revealedLines.push({
            centerX,
            centerY,
            angle,
            length,
            intensity: 0,
            revealed: false
        });
    }

    /**
     * Update and render all revealed symmetry lines
     */
    update(centerX, centerY) {
        this.animationFrame++;

        // Update intensities
        this.revealedLines.forEach(line => {
            if (!line.revealed) {
                line.intensity = Math.min(line.intensity + 0.05, 1);
                if (line.intensity >= 1) {
                    line.revealed = true;
                }
            }
        });

        // Draw all revealed lines
        this.revealedLines.forEach(line => {
            this.drawSymmetryLine(line.centerX, line.centerY, line.angle, line.length, line.intensity);
        });
    }

    /**
     * Clear all revealed lines
     */
    clear() {
        this.revealedLines = [];
        this.animationFrame = 0;
    }

    /**
     * Get number of revealed lines
     */
    getRevealedCount() {
        return this.revealedLines.filter(line => line.revealed).length;
    }
}
