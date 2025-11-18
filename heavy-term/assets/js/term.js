/**
 * Heavy Term - Term Class
 * Represents a mathematical term with physics properties
 */

class Term {
    constructor(data) {
        this.id = data.id;
        this.text = data.term_text || data.text;
        this.size = parseInt(data.term_size || data.size || 1);
        this.weight = parseFloat(data.term_weight || data.weight || 1.0);
        this.value = parseFloat(data.term_value || 0);
        this.isAnswer = Boolean(data.is_answer);

        // Physics properties
        this.x = data.position_x || null;
        this.y = data.position_y || null;
        this.vx = parseFloat(data.velocity_x || 0);
        this.vy = parseFloat(data.velocity_y || 0);

        // Rendering properties
        this.width = 0;
        this.height = 0;
        this.element = null;
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;

        // Create DOM element
        this.createElement();
    }

    /**
     * Create DOM element for the term
     */
    createElement() {
        this.element = document.createElement('div');
        this.element.className = `term size-${this.size}`;
        this.element.textContent = this.text;
        this.element.dataset.termId = this.id;

        // Set initial position if specified
        if (this.x !== null && this.y !== null) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }

        // Measure size after adding to DOM temporarily
        document.body.appendChild(this.element);
        const rect = this.element.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;
        document.body.removeChild(this.element);
    }

    /**
     * Update term's DOM position
     */
    updatePosition() {
        if (this.element) {
            this.element.style.left = `${this.x}px`;
            this.element.style.top = `${this.y}px`;
        }
    }

    /**
     * Start dragging the term
     * @param {number} mouseX Mouse X position
     * @param {number} mouseY Mouse Y position
     */
    startDrag(mouseX, mouseY) {
        this.isDragging = true;
        this.element.classList.add('dragging');
        this.dragOffsetX = mouseX - this.x;
        this.dragOffsetY = mouseY - this.y;

        // Reset velocity
        this.vx = 0;
        this.vy = 0;
    }

    /**
     * Update drag position
     * @param {number} mouseX Mouse X position
     * @param {number} mouseY Mouse Y position
     * @param {number} containerWidth Container width for boundary checking
     * @param {number} containerHeight Container height for boundary checking
     */
    updateDrag(mouseX, mouseY, containerWidth, containerHeight) {
        if (!this.isDragging) return;

        this.x = Math.max(0, Math.min(mouseX - this.dragOffsetX, containerWidth - this.width));
        this.y = Math.max(0, Math.min(mouseY - this.dragOffsetY, containerHeight - this.height));

        this.updatePosition();
    }

    /**
     * End dragging the term
     * @param {number} releaseVelocityX Release velocity X
     * @param {number} releaseVelocityY Release velocity Y
     */
    endDrag(releaseVelocityX = 0, releaseVelocityY = 0) {
        this.isDragging = false;
        this.element.classList.remove('dragging');

        // Apply release velocity for throw effect
        this.vx = releaseVelocityX;
        this.vy = releaseVelocityY;
    }

    /**
     * Add term element to container
     * @param {HTMLElement} container Container element
     */
    addToContainer(container) {
        if (this.element && container) {
            container.appendChild(this.element);
            this.updatePosition();
        }
    }

    /**
     * Remove term element from DOM
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
    }

    /**
     * Highlight term (for answer checking)
     * @param {string} type Type of highlight (correct, incorrect, neutral)
     */
    highlight(type) {
        if (!this.element) return;

        this.element.classList.remove('correct', 'incorrect', 'neutral');
        if (type) {
            this.element.classList.add(type);
        }
    }

    /**
     * Get term data for API submission
     * @returns {Object} Term data
     */
    getData() {
        return {
            id: this.id,
            text: this.text,
            size: this.size,
            weight: this.weight,
            value: this.value,
            position_x: Math.round(this.x),
            position_y: Math.round(this.y),
            velocity_x: this.vx.toFixed(2),
            velocity_y: this.vy.toFixed(2)
        };
    }

    /**
     * Calculate kinetic energy (for interaction tracking)
     * @returns {number} Kinetic energy
     */
    getKineticEnergy() {
        const mass = this.size;
        const speedSquared = this.vx * this.vx + this.vy * this.vy;
        return 0.5 * mass * speedSquared;
    }

    /**
     * Check if term is at rest
     * @returns {boolean} True if at rest
     */
    isAtRest() {
        const velocityThreshold = 0.5;
        return Math.abs(this.vx) < velocityThreshold && Math.abs(this.vy) < velocityThreshold;
    }

    /**
     * Get distance to another term
     * @param {Term} otherTerm Other term
     * @returns {number} Distance
     */
    getDistanceTo(otherTerm) {
        const dx = (otherTerm.x + otherTerm.width / 2) - (this.x + this.width / 2);
        const dy = (otherTerm.y + otherTerm.height / 2) - (this.y + this.height / 2);
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Apply impulse to term (for interactions)
     * @param {number} impulseX Impulse X
     * @param {number} impulseY Impulse Y
     */
    applyImpulse(impulseX, impulseY) {
        const mass = Math.max(1, this.size);
        this.vx += impulseX / mass;
        this.vy += impulseY / mass;
    }

    /**
     * Clone term
     * @returns {Term} Cloned term
     */
    clone() {
        return new Term({
            id: this.id,
            term_text: this.text,
            term_size: this.size,
            term_weight: this.weight,
            term_value: this.value,
            is_answer: this.isAnswer,
            position_x: this.x,
            position_y: this.y,
            velocity_x: this.vx,
            velocity_y: this.vy
        });
    }

    /**
     * Static method to create terms from problem data
     * @param {Object} problemData Problem data from API
     * @returns {Array<Term>} Array of Term instances
     */
    static createFromProblemData(problemData) {
        if (!problemData || !problemData.terms) {
            return [];
        }

        return problemData.terms.map(termData => new Term(termData));
    }

    /**
     * Static method to parse mathematical expression into terms
     * @param {string} expression Mathematical expression
     * @returns {Array<Object>} Array of term data objects
     */
    static parseExpression(expression) {
        const terms = [];
        let termId = 1;

        // Remove HTML tags
        const cleanText = expression.replace(/<[^>]*>/g, '');

        // Patterns to match different types of mathematical terms
        const patterns = [
            /(\d+\.?\d*[a-zA-Z]?\^?\d*)/g,  // Numbers with optional variables/exponents
            /([a-zA-Z]+\d*)/g,               // Variables
            /(\([^)]+\))/g,                  // Parenthetical expressions
            /(\d+\/\d+)/g,                   // Fractions
            /([√∛∜][^+\-×÷=\s]+)/g          // Roots
        ];

        const found = new Set();

        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(cleanText)) !== null) {
                const term = match[1].trim();
                if (term && !found.has(term)) {
                    found.add(term);
                    terms.push({
                        id: termId++,
                        text: term,
                        size: Term.calculateTermSize(term),
                        weight: Term.calculateTermWeight(term)
                    });
                }
            }
        });

        return terms;
    }

    /**
     * Calculate term size based on complexity (static method)
     * @param {string} text Term text
     * @returns {number} Size (1-10)
     */
    static calculateTermSize(text) {
        let size = 1;

        // Check for exponents
        if (text.includes('^')) size += 2;

        // Check for roots
        if (/[√∛∜]/.test(text)) size += 2;

        // Check for fractions
        if (text.includes('/')) size += 1;

        // Check for parentheses
        size += (text.match(/\(/g) || []).length;

        // Length factor
        if (text.length > 10) size += 2;
        else if (text.length > 5) size += 1;

        // Numerical value factor
        const numMatch = text.match(/(\d+)/);
        if (numMatch) {
            const value = parseInt(numMatch[1]);
            if (value > 100) size += 2;
            else if (value > 10) size += 1;
        }

        return Math.min(10, Math.max(1, size));
    }

    /**
     * Calculate term weight based on value (static method)
     * @param {string} text Term text
     * @returns {number} Weight
     */
    static calculateTermWeight(text) {
        let weight = 1.0;

        const numMatch = text.match(/(\d+\.?\d*)/);
        if (numMatch) {
            const value = parseFloat(numMatch[1]);
            weight = 1.0 + Math.log10(Math.max(1, value));
        }

        return Math.round(weight * 100) / 100;
    }
}
