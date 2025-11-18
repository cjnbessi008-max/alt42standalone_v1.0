/**
 * Twin Shape Glow - Shape Renderer
 * SVG shape generation and rendering
 */

class ShapeRenderer {
    /**
     * Create shape element
     */
    static createShape(shapeData) {
        const container = document.createElement('div');
        container.className = `shape ${shapeData.size || 'medium'}`;
        container.setAttribute('data-shape-id', shapeData.id);
        container.setAttribute('data-pair-id', shapeData.pair_id);

        const svg = this.generateSVG(shapeData);
        container.innerHTML = svg;
        container.style.color = shapeData.color || '#3498db';

        return container;
    }

    /**
     * Generate SVG based on shape type
     */
    static generateSVG(shapeData) {
        const type = shapeData.type;
        const size = 100; // Base size

        // Use custom SVG path if provided
        if (shapeData.svg_path) {
            return `
                <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                    <path d="${shapeData.svg_path}" fill="currentColor" />
                </svg>
            `;
        }

        // Generate based on type
        switch (type) {
            case 'circle':
                return this.createCircle(size);
            case 'square':
                return this.createSquare(size);
            case 'triangle':
                return this.createTriangle(size);
            case 'pentagon':
                return this.createPentagon(size);
            case 'hexagon':
                return this.createHexagon(size);
            case 'star':
                return this.createStar(size);
            default:
                return this.createCircle(size);
        }
    }

    /**
     * Create circle SVG
     */
    static createCircle(size) {
        const r = size / 2 - 5;
        const c = size / 2;

        return `
            <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <circle cx="${c}" cy="${c}" r="${r}" fill="currentColor" />
            </svg>
        `;
    }

    /**
     * Create square SVG
     */
    static createSquare(size) {
        const margin = 10;
        const sideLength = size - 2 * margin;

        return `
            <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <rect x="${margin}" y="${margin}" width="${sideLength}" height="${sideLength}"
                      rx="5" fill="currentColor" />
            </svg>
        `;
    }

    /**
     * Create triangle SVG
     */
    static createTriangle(size) {
        const margin = 10;
        const points = [
            [size / 2, margin],                    // Top
            [size - margin, size - margin],        // Bottom right
            [margin, size - margin]                // Bottom left
        ];

        const pointsStr = points.map(p => p.join(',')).join(' ');

        return `
            <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <polygon points="${pointsStr}" fill="currentColor" />
            </svg>
        `;
    }

    /**
     * Create pentagon SVG
     */
    static createPentagon(size) {
        const points = this.calculatePolygonPoints(size / 2, size / 2, size / 2 - 10, 5, -Math.PI / 2);
        const pointsStr = points.map(p => p.join(',')).join(' ');

        return `
            <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <polygon points="${pointsStr}" fill="currentColor" />
            </svg>
        `;
    }

    /**
     * Create hexagon SVG
     */
    static createHexagon(size) {
        const points = this.calculatePolygonPoints(size / 2, size / 2, size / 2 - 10, 6, 0);
        const pointsStr = points.map(p => p.join(',')).join(' ');

        return `
            <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <polygon points="${pointsStr}" fill="currentColor" />
            </svg>
        `;
    }

    /**
     * Create star SVG
     */
    static createStar(size) {
        const cx = size / 2;
        const cy = size / 2;
        const outerRadius = size / 2 - 10;
        const innerRadius = outerRadius * 0.4;
        const points = [];

        for (let i = 0; i < 10; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * 2 * i) / 10 - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            points.push([x, y]);
        }

        const pointsStr = points.map(p => p.join(',')).join(' ');

        return `
            <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <polygon points="${pointsStr}" fill="currentColor" />
            </svg>
        `;
    }

    /**
     * Calculate polygon points
     */
    static calculatePolygonPoints(cx, cy, radius, sides, startAngle = 0) {
        const points = [];

        for (let i = 0; i < sides; i++) {
            const angle = startAngle + (Math.PI * 2 * i) / sides;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            points.push([x, y]);
        }

        return points;
    }

    /**
     * Create custom shape from SVG path
     */
    static createCustomShape(size, pathData) {
        return `
            <svg viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
                <path d="${pathData}" fill="currentColor" />
            </svg>
        `;
    }

    /**
     * Add glow effect to shape
     */
    static addGlowEffect(element, color, intensity = 1) {
        const filter = `drop-shadow(0 0 ${10 * intensity}px ${color}) drop-shadow(0 0 ${20 * intensity}px ${color})`;
        element.style.filter = filter;
    }

    /**
     * Remove glow effect
     */
    static removeGlowEffect(element) {
        element.style.filter = '';
    }

    /**
     * Animate shape transformation
     */
    static animateTransform(element, transformations) {
        const animation = element.animate(transformations, {
            duration: 500,
            easing: 'ease-in-out',
            fill: 'forwards'
        });

        return animation.finished;
    }

    /**
     * Create morphing effect between shapes
     */
    static morphShape(fromElement, toType, duration = 1000) {
        // This would require more complex SVG morphing
        // For now, use a simple fade transition
        fromElement.style.transition = `all ${duration}ms ease-in-out`;
        fromElement.style.opacity = '0';

        setTimeout(() => {
            fromElement.style.opacity = '1';
        }, duration / 2);
    }

    /**
     * Get shape bounds
     */
    static getShapeBounds(element) {
        return element.getBoundingClientRect();
    }

    /**
     * Check if shapes overlap
     */
    static checkOverlap(element1, element2) {
        const rect1 = element1.getBoundingClientRect();
        const rect2 = element2.getBoundingClientRect();

        return !(
            rect1.right < rect2.left ||
            rect1.left > rect2.right ||
            rect1.bottom < rect2.top ||
            rect1.top > rect2.bottom
        );
    }

    /**
     * Calculate shape area (approximate)
     */
    static calculateArea(shapeData) {
        const size = 70; // Medium size default

        switch (shapeData.type) {
            case 'circle':
                return Math.PI * Math.pow(size / 2, 2);
            case 'square':
                return size * size;
            case 'triangle':
                return (size * size) / 2;
            case 'pentagon':
            case 'hexagon':
                // Approximate as circle
                return Math.PI * Math.pow(size / 2, 2) * 0.8;
            case 'star':
                return Math.PI * Math.pow(size / 2, 2) * 0.6;
            default:
                return size * size;
        }
    }

    /**
     * Get shape color
     */
    static getShapeColor(element) {
        return window.getComputedStyle(element).color;
    }

    /**
     * Set shape color
     */
    static setShapeColor(element, color) {
        element.style.color = color;
    }

    /**
     * Create shape preview
     */
    static createPreview(shapeData, size = 50) {
        const preview = this.createShape({
            ...shapeData,
            size: 'small'
        });

        preview.style.width = `${size}px`;
        preview.style.height = `${size}px`;
        preview.style.position = 'static';

        return preview;
    }

    /**
     * Clone shape
     */
    static cloneShape(element) {
        return element.cloneNode(true);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShapeRenderer;
}
