/**
 * Constellation Visualization Component
 * Creates and manages the number constellation display
 */

class Constellation {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config || this.getDefaultConfig();
        this.stars = [];
        this.selectedStars = new Set();
        this.correctStars = new Set();
        this.incorrectStars = new Set();
        this.width = 0;
        this.height = 0;

        this.resize();
        this.setupEventListeners();
    }

    getDefaultConfig() {
        return {
            star_color: '#FFD700',
            prime_color: '#FF4444',
            multiple_color: '#4444FF',
            natural_color: '#44FF44',
            composite_color: '#FFAA44',
            connection_color: 'rgba(255,255,255,0.3)',
            background_color: '#000033',
            show_labels: true,
            show_connections: true
        };
    }

    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    /**
     * Generate constellation from number range
     * @param {number} start
     * @param {number} end
     * @param {string} problemType
     */
    generate(start, end, problemType) {
        this.stars = [];
        const numbers = [];

        for (let i = start; i <= end; i++) {
            numbers.push(i);
        }

        // Create stars in a spiral pattern
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const numStars = numbers.length;
        const angleStep = (Math.PI * 2) / numStars;
        const spiralTightness = 0.5;

        numbers.forEach((number, index) => {
            const angle = index * angleStep;
            const radius = 30 + (index * spiralTightness * 3);

            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;

            const star = {
                number: number,
                x: x,
                y: y,
                radius: 8,
                isPrime: MathUtils.isPrime(number),
                isComposite: MathUtils.isComposite(number),
                angle: angle
            };

            this.stars.push(star);
        });

        this.draw();
    }

    /**
     * Draw the constellation
     */
    draw() {
        // Clear canvas
        this.ctx.fillStyle = this.config.background_color;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw connections
        if (this.config.show_connections) {
            this.drawConnections();
        }

        // Draw background stars (for effect)
        this.drawBackgroundStars();

        // Draw number stars
        this.stars.forEach(star => {
            this.drawStar(star);
        });
    }

    drawBackgroundStars() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.width;
            const y = Math.random() * this.height;
            const size = Math.random() * 2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    drawConnections() {
        this.ctx.strokeStyle = this.config.connection_color;
        this.ctx.lineWidth = 1;

        for (let i = 0; i < this.stars.length - 1; i++) {
            const star1 = this.stars[i];
            const star2 = this.stars[i + 1];

            this.ctx.beginPath();
            this.ctx.moveTo(star1.x, star1.y);
            this.ctx.lineTo(star2.x, star2.y);
            this.ctx.stroke();
        }
    }

    drawStar(star) {
        const isSelected = this.selectedStars.has(star.number);
        const isCorrect = this.correctStars.has(star.number);
        const isIncorrect = this.incorrectStars.has(star.number);

        // Determine color
        let color = this.config.star_color;
        if (isCorrect) {
            color = '#44FF44';
        } else if (isIncorrect) {
            color = '#FF4444';
        } else if (isSelected) {
            color = '#4AF';
        } else if (star.isPrime) {
            color = this.config.prime_color;
        } else if (star.isComposite) {
            color = this.config.composite_color;
        }

        // Draw star glow
        const gradient = this.ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.radius * 3
        );
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'transparent');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.radius * 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw star
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw selection ring
        if (isSelected) {
            this.ctx.strokeStyle = '#4AF';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.radius + 4, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        // Draw label
        if (this.config.show_labels) {
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(star.number, star.x, star.y);
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('click', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            this.handleClick(x, y);
        });

        window.addEventListener('resize', () => {
            this.resize();
            this.draw();
        });
    }

    handleClick(x, y) {
        // Find clicked star
        const clickedStar = this.stars.find(star => {
            const dx = star.x - x;
            const dy = star.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= star.radius + 5;
        });

        if (clickedStar) {
            this.toggleSelection(clickedStar.number);
        }
    }

    toggleSelection(number) {
        if (this.selectedStars.has(number)) {
            this.selectedStars.delete(number);
        } else {
            this.selectedStars.add(number);
        }
        this.draw();

        // Trigger custom event
        const event = new CustomEvent('selectionChanged', {
            detail: { selected: Array.from(this.selectedStars) }
        });
        this.canvas.dispatchEvent(event);
    }

    clearSelection() {
        this.selectedStars.clear();
        this.correctStars.clear();
        this.incorrectStars.clear();
        this.draw();
    }

    showResults(correct, incorrect) {
        this.correctStars = new Set(correct);
        this.incorrectStars = new Set(incorrect);
        this.draw();
    }

    getSelectedNumbers() {
        return Array.from(this.selectedStars);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Constellation;
}
