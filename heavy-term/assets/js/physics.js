/**
 * Heavy Term Physics Engine
 * Implements gravity effect where larger terms have stronger gravitational pull
 */

class PhysicsEngine {
    constructor(canvas, config) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.config = config;
        this.terms = [];
        this.running = false;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsUpdateTime = 0;

        // Physics parameters
        this.gravity = config.gravity_strength || 9.8;
        this.gravityMultiplier = config.gravity_multiplier || 2.0;
        this.bounceDamping = config.bounce_damping || 0.7;
        this.frictionCoefficient = config.friction_coefficient || 0.98;
        this.maxVelocity = config.max_velocity || 500;
        this.enableGravity = config.enable_gravity !== false;
        this.enableCollisions = config.enable_collisions !== false;

        this.setupCanvas();
    }

    setupCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }

    /**
     * Add a term to the physics simulation
     * @param {Term} term Term object
     */
    addTerm(term) {
        // Initialize position if not set
        if (term.x === null || term.y === null) {
            term.x = Math.random() * (this.width - term.width);
            term.y = Math.random() * (this.height / 2); // Start in upper half
        }

        this.terms.push(term);
    }

    /**
     * Remove a term from the simulation
     * @param {Term} term Term to remove
     */
    removeTerm(term) {
        const index = this.terms.indexOf(term);
        if (index > -1) {
            this.terms.splice(index, 1);
        }
    }

    /**
     * Clear all terms
     */
    clearTerms() {
        this.terms = [];
    }

    /**
     * Update physics parameters
     * @param {Object} params Parameters to update
     */
    updateParams(params) {
        if (params.gravity_strength !== undefined) {
            this.gravity = parseFloat(params.gravity_strength);
        }
        if (params.gravity_multiplier !== undefined) {
            this.gravityMultiplier = parseFloat(params.gravity_multiplier);
        }
        if (params.bounce_damping !== undefined) {
            this.bounceDamping = parseFloat(params.bounce_damping);
        }
        if (params.friction_coefficient !== undefined) {
            this.frictionCoefficient = parseFloat(params.friction_coefficient);
        }
        if (params.max_velocity !== undefined) {
            this.maxVelocity = parseFloat(params.max_velocity);
        }
        if (params.enable_gravity !== undefined) {
            this.enableGravity = params.enable_gravity;
        }
        if (params.enable_collisions !== undefined) {
            this.enableCollisions = params.enable_collisions;
        }
    }

    /**
     * Calculate gravitational force between two terms
     * Heavy Term effect: Larger terms have stronger gravity
     * @param {Term} term1 First term
     * @param {Term} term2 Second term
     * @returns {Object} Force vector {x, y}
     */
    calculateGravitationalForce(term1, term2) {
        const dx = term2.x + term2.width / 2 - (term1.x + term1.width / 2);
        const dy = term2.y + term2.height / 2 - (term1.y + term1.height / 2);
        const distanceSquared = dx * dx + dy * dy;
        const distance = Math.sqrt(distanceSquared);

        // Avoid division by zero and terms that are too close
        if (distance < 50) {
            return { x: 0, y: 0 };
        }

        // Gravitational constant (scaled for visual effect)
        const G = 0.5;

        // Mass is proportional to term size (squared for stronger effect)
        const mass1 = Math.pow(term1.size, 2);
        const mass2 = Math.pow(term2.size, 2);

        // Newton's law of gravitation: F = G * (m1 * m2) / r^2
        // Modified with gravity multiplier for "Heavy Term" effect
        const forceMagnitude = (G * mass1 * mass2 * this.gravityMultiplier) / distanceSquared;

        // Normalize and apply force
        const forceX = (dx / distance) * forceMagnitude;
        const forceY = (dy / distance) * forceMagnitude;

        return { x: forceX, y: forceY };
    }

    /**
     * Apply downward gravity to a term
     * Gravity strength increases with term size
     * @param {Term} term Term to apply gravity to
     * @param {number} deltaTime Time delta in seconds
     */
    applyDownwardGravity(term, deltaTime) {
        if (!this.enableGravity) return;

        // Base gravity acceleration
        const baseGravity = this.gravity;

        // Larger terms fall faster (Heavy Term effect)
        const sizeMultiplier = 1 + (term.size - 1) * 0.1; // 10% increase per size level
        const effectiveGravity = baseGravity * sizeMultiplier;

        // Apply gravity to velocity
        term.vy += effectiveGravity * deltaTime;
    }

    /**
     * Apply gravitational attraction between terms
     * @param {Term} term Term to apply forces to
     * @param {number} deltaTime Time delta in seconds
     */
    applyGravitationalAttraction(term, deltaTime) {
        if (!this.enableGravity) return;

        // Calculate forces from all other terms
        for (const otherTerm of this.terms) {
            if (otherTerm === term) continue;
            if (otherTerm.isDragging || term.isDragging) continue;

            const force = this.calculateGravitationalForce(term, otherTerm);

            // Apply force as acceleration (F = ma, assuming mass = size)
            const mass = Math.max(1, term.size);
            term.vx += (force.x / mass) * deltaTime;
            term.vy += (force.y / mass) * deltaTime;
        }
    }

    /**
     * Check collision between two terms
     * @param {Term} term1 First term
     * @param {Term} term2 Second term
     * @returns {boolean} True if colliding
     */
    checkCollision(term1, term2) {
        return (
            term1.x < term2.x + term2.width &&
            term1.x + term1.width > term2.x &&
            term1.y < term2.y + term2.height &&
            term1.y + term1.height > term2.y
        );
    }

    /**
     * Resolve collision between two terms
     * @param {Term} term1 First term
     * @param {Term} term2 Second term
     */
    resolveCollision(term1, term2) {
        if (!this.enableCollisions) return;

        // Calculate collision normal
        const dx = (term2.x + term2.width / 2) - (term1.x + term1.width / 2);
        const dy = (term2.y + term2.height / 2) - (term1.y + term1.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance === 0) return;

        // Normalize
        const nx = dx / distance;
        const ny = dy / distance;

        // Relative velocity
        const dvx = term2.vx - term1.vx;
        const dvy = term2.vy - term1.vy;

        // Relative velocity in collision normal direction
        const dvn = dvx * nx + dvy * ny;

        // Do not resolve if velocities are separating
        if (dvn >= 0) return;

        // Collision impulse
        const mass1 = Math.max(1, term1.size);
        const mass2 = Math.max(1, term2.size);
        const restitution = this.bounceDamping;

        const impulse = -(1 + restitution) * dvn / (1 / mass1 + 1 / mass2);

        // Apply impulse
        term1.vx -= (impulse / mass1) * nx;
        term1.vy -= (impulse / mass1) * ny;
        term2.vx += (impulse / mass2) * nx;
        term2.vy += (impulse / mass2) * ny;

        // Separate overlapping terms
        const overlap = (term1.width / 2 + term2.width / 2) - distance;
        if (overlap > 0) {
            const separationX = (overlap / 2) * nx;
            const separationY = (overlap / 2) * ny;

            term1.x -= separationX;
            term1.y -= separationY;
            term2.x += separationX;
            term2.y += separationY;
        }
    }

    /**
     * Update term physics
     * @param {Term} term Term to update
     * @param {number} deltaTime Time delta in seconds
     */
    updateTerm(term, deltaTime) {
        if (term.isDragging) {
            // Reset velocity when dragging
            term.vx = 0;
            term.vy = 0;
            return;
        }

        // Apply downward gravity
        this.applyDownwardGravity(term, deltaTime);

        // Apply gravitational attraction to other terms
        this.applyGravitationalAttraction(term, deltaTime);

        // Apply friction
        term.vx *= this.frictionCoefficient;
        term.vy *= this.frictionCoefficient;

        // Limit velocity
        const speed = Math.sqrt(term.vx * term.vx + term.vy * term.vy);
        if (speed > this.maxVelocity) {
            term.vx = (term.vx / speed) * this.maxVelocity;
            term.vy = (term.vy / speed) * this.maxVelocity;
        }

        // Update position
        term.x += term.vx * deltaTime;
        term.y += term.vy * deltaTime;

        // Boundary collision
        this.handleBoundaryCollision(term);
    }

    /**
     * Handle collision with screen boundaries
     * @param {Term} term Term to check
     */
    handleBoundaryCollision(term) {
        // Left boundary
        if (term.x < 0) {
            term.x = 0;
            term.vx = -term.vx * this.bounceDamping;
        }

        // Right boundary
        if (term.x + term.width > this.width) {
            term.x = this.width - term.width;
            term.vx = -term.vx * this.bounceDamping;
        }

        // Top boundary
        if (term.y < 0) {
            term.y = 0;
            term.vy = -term.vy * this.bounceDamping;
        }

        // Bottom boundary
        if (term.y + term.height > this.height) {
            term.y = this.height - term.height;
            term.vy = -term.vy * this.bounceDamping;

            // Extra friction on ground
            term.vx *= 0.95;

            // Stop small bounces
            if (Math.abs(term.vy) < 5) {
                term.vy = 0;
            }
        }
    }

    /**
     * Main update loop
     * @param {number} currentTime Current timestamp
     */
    update(currentTime) {
        if (!this.running) return;

        // Calculate delta time
        const deltaTime = this.lastTime ? (currentTime - this.lastTime) / 1000 : 0;
        this.lastTime = currentTime;

        // Update FPS
        this.frameCount++;
        if (currentTime - this.fpsUpdateTime > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsUpdateTime = currentTime;
        }

        // Clear canvas
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw debug info (gravitational field lines)
        if (this.terms.length > 0) {
            this.drawGravityField();
        }

        // Update all terms
        for (const term of this.terms) {
            this.updateTerm(term, deltaTime);
        }

        // Check term-to-term collisions
        if (this.enableCollisions) {
            for (let i = 0; i < this.terms.length; i++) {
                for (let j = i + 1; j < this.terms.length; j++) {
                    if (this.checkCollision(this.terms[i], this.terms[j])) {
                        this.resolveCollision(this.terms[i], this.terms[j]);
                    }
                }
            }
        }

        // Continue loop
        requestAnimationFrame((time) => this.update(time));
    }

    /**
     * Draw gravity field visualization
     */
    drawGravityField() {
        this.ctx.strokeStyle = 'rgba(74, 144, 226, 0.1)';
        this.ctx.lineWidth = 1;

        // Draw lines between terms to show gravitational attraction
        for (let i = 0; i < this.terms.length; i++) {
            for (let j = i + 1; j < this.terms.length; j++) {
                const term1 = this.terms[i];
                const term2 = this.terms[j];

                const x1 = term1.x + term1.width / 2;
                const y1 = term1.y + term1.height / 2;
                const x2 = term2.x + term2.width / 2;
                const y2 = term2.y + term2.height / 2;

                const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

                // Only draw for nearby terms
                if (distance < 200) {
                    const opacity = 1 - distance / 200;
                    this.ctx.strokeStyle = `rgba(74, 144, 226, ${opacity * 0.2})`;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x1, y1);
                    this.ctx.lineTo(x2, y2);
                    this.ctx.stroke();
                }
            }
        }
    }

    /**
     * Start physics simulation
     */
    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = 0;
        requestAnimationFrame((time) => this.update(time));
    }

    /**
     * Stop physics simulation
     */
    stop() {
        this.running = false;
    }

    /**
     * Reset all terms to initial positions
     */
    reset() {
        for (const term of this.terms) {
            term.x = Math.random() * (this.width - term.width);
            term.y = Math.random() * (this.height / 2);
            term.vx = 0;
            term.vy = 0;
        }
    }

    /**
     * Get current FPS
     * @returns {number} Current FPS
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Get active term count
     * @returns {number} Number of active terms
     */
    getTermCount() {
        return this.terms.length;
    }
}
