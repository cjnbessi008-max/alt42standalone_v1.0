/**
 * Vector Star Map Visualization Engine
 * Canvas-based constellation learning path visualizer
 */

class VectorStarMap {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas element with id "${canvasId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.width = options.width || 350;
        this.height = options.height || 600;
        this.canvas.width = this.width;
        this.canvas.height = this.height;

        // Configuration
        this.config = {
            starRadius: options.starRadius || 8,
            starGlowRadius: options.starGlowRadius || 15,
            connectionWidth: options.connectionWidth || 2,
            animationDuration: options.animationDuration || 1000,
            particleCount: options.particleCount || 30,
            enableParticles: options.enableParticles !== false,
            enableGlow: options.enableGlow !== false,
            backgroundColor: options.backgroundColor || '#0a0e27',
            gridColor: options.gridColor || 'rgba(100, 100, 255, 0.1)'
        };

        // State
        this.problems = [];
        this.connections = [];
        this.stars = [];
        this.particles = [];
        this.selectedStar = null;
        this.hoveredStar = null;
        this.animationFrame = null;
        this.animationProgress = 0;

        // Colors based on status
        this.statusColors = {
            'not_started': '#4a5568',      // Gray
            'in_progress': '#f6ad55',      // Orange
            'completed': '#48bb78',        // Green
            'mastered': '#4299e1'          // Blue (bright)
        };

        this.difficultyColors = {
            1: '#68d391',  // Easy - Light green
            2: '#4fd1c5',  // Medium - Teal
            3: '#f6ad55',  // Hard - Orange
            4: '#fc8181',  // Very hard - Red
            5: '#b794f4'   // Expert - Purple
        };

        // Event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();
    }

    /**
     * Load problem data and initialize stars
     */
    async loadData(courseId = 101, studentId = 1) {
        try {
            const response = await fetch(`api/get_problems.php?course_id=${courseId}&student_id=${studentId}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to load problems');
            }

            this.problems = result.data.problems;
            this.connections = result.data.connections;

            // Convert problems to stars
            this.stars = this.problems.map(problem => this.createStar(problem));

            // Trigger entrance animation
            this.animateEntrance();

            return result;
        } catch (error) {
            console.error('Error loading star map data:', error);
            throw error;
        }
    }

    /**
     * Create a star object from problem data
     */
    createStar(problem) {
        // Map vector coordinates to canvas space
        const x = problem.vector.x * this.width;
        const y = problem.vector.y * this.height;

        return {
            id: problem.id,
            x: x,
            y: y,
            targetX: x,
            targetY: y,
            currentX: x,
            currentY: y,
            radius: this.config.starRadius,
            color: this.getStarColor(problem),
            glowColor: this.getGlowColor(problem),
            problem: problem,
            scale: 0, // For entrance animation
            targetScale: 1,
            pulse: 0
        };
    }

    /**
     * Get star color based on student progress
     */
    getStarColor(problem) {
        return this.statusColors[problem.studentStatus] || this.statusColors['not_started'];
    }

    /**
     * Get glow color based on difficulty
     */
    getGlowColor(problem) {
        return this.difficultyColors[problem.difficulty] || this.difficultyColors[1];
    }

    /**
     * Animate stars entering the canvas
     */
    animateEntrance() {
        this.animationProgress = 0;
        const duration = this.config.animationDuration;
        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            this.animationProgress = Math.min(elapsed / duration, 1);

            // Ease-out animation
            const eased = 1 - Math.pow(1 - this.animationProgress, 3);

            this.stars.forEach((star, index) => {
                const delay = index * 50; // Stagger effect
                const starProgress = Math.max(0, Math.min(1, (elapsed - delay) / duration));
                star.scale = starProgress;
            });

            if (this.animationProgress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    /**
     * Main animation loop
     */
    animate() {
        this.render();
        this.updateParticles();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    /**
     * Render the entire star map
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = this.config.backgroundColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw background grid
        this.drawGrid();

        // Draw connections (constellation lines)
        this.drawConnections();

        // Draw stars
        this.drawStars();

        // Draw particles
        if (this.config.enableParticles) {
            this.drawParticles();
        }

        // Draw labels for hovered star
        if (this.hoveredStar) {
            this.drawLabel(this.hoveredStar);
        }
    }

    /**
     * Draw background grid
     */
    drawGrid() {
        this.ctx.strokeStyle = this.config.gridColor;
        this.ctx.lineWidth = 1;

        const gridSize = 50;

        // Vertical lines
        for (let x = 0; x <= this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    /**
     * Draw constellation connections
     */
    drawConnections() {
        this.connections.forEach(conn => {
            const fromStar = this.stars.find(s => s.id === conn.from);
            const toStar = this.stars.find(s => s.id === conn.to);

            if (!fromStar || !toStar) return;

            // Only draw if both stars have appeared
            if (fromStar.scale === 0 || toStar.scale === 0) return;

            // Line style based on relationship type
            const alpha = conn.strength * 0.6;
            let lineColor;

            switch (conn.type) {
                case 'prerequisite':
                    lineColor = `rgba(100, 200, 255, ${alpha})`;
                    break;
                case 'related':
                    lineColor = `rgba(150, 150, 255, ${alpha})`;
                    break;
                case 'advanced':
                    lineColor = `rgba(255, 150, 100, ${alpha})`;
                    break;
                default:
                    lineColor = `rgba(200, 200, 200, ${alpha})`;
            }

            this.ctx.strokeStyle = lineColor;
            this.ctx.lineWidth = this.config.connectionWidth * conn.strength;

            // Draw line
            this.ctx.beginPath();
            this.ctx.moveTo(fromStar.currentX, fromStar.currentY);
            this.ctx.lineTo(toStar.currentX, toStar.currentY);
            this.ctx.stroke();

            // Draw arrow for prerequisite relationships
            if (conn.type === 'prerequisite') {
                this.drawArrow(fromStar, toStar, lineColor);
            }
        });
    }

    /**
     * Draw arrow on connection line
     */
    drawArrow(fromStar, toStar, color) {
        const angle = Math.atan2(toStar.currentY - fromStar.currentY, toStar.currentX - fromStar.currentX);
        const arrowSize = 8;

        // Position arrow near the end
        const distance = Math.sqrt(
            Math.pow(toStar.currentX - fromStar.currentX, 2) +
            Math.pow(toStar.currentY - fromStar.currentY, 2)
        );
        const arrowPos = 0.7; // 70% along the line
        const arrowX = fromStar.currentX + (toStar.currentX - fromStar.currentX) * arrowPos;
        const arrowY = fromStar.currentY + (toStar.currentY - fromStar.currentY) * arrowPos;

        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowX, arrowY);
        this.ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * Draw all stars
     */
    drawStars() {
        this.stars.forEach(star => {
            if (star.scale === 0) return;

            const isHovered = this.hoveredStar && this.hoveredStar.id === star.id;
            const isSelected = this.selectedStar && this.selectedStar.id === star.id;

            // Update pulse animation
            star.pulse = (star.pulse + 0.05) % (Math.PI * 2);

            // Calculate current position (smooth movement)
            star.currentX += (star.targetX - star.currentX) * 0.1;
            star.currentY += (star.targetY - star.currentY) * 0.1;

            // Draw glow effect
            if (this.config.enableGlow || isHovered || isSelected) {
                const glowRadius = this.config.starGlowRadius * star.scale;
                const gradient = this.ctx.createRadialGradient(
                    star.currentX, star.currentY, 0,
                    star.currentX, star.currentY, glowRadius
                );

                const glowIntensity = isHovered ? 0.6 : (isSelected ? 0.5 : 0.3);
                gradient.addColorStop(0, star.glowColor.replace(')', `, ${glowIntensity})`).replace('rgb', 'rgba'));
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                this.ctx.fillStyle = gradient;
                this.ctx.fillRect(
                    star.currentX - glowRadius,
                    star.currentY - glowRadius,
                    glowRadius * 2,
                    glowRadius * 2
                );
            }

            // Draw star circle
            const starRadius = star.radius * star.scale * (isHovered ? 1.3 : 1);
            this.ctx.fillStyle = star.color;
            this.ctx.beginPath();
            this.ctx.arc(star.currentX, star.currentY, starRadius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw outer ring for selected/hovered
            if (isHovered || isSelected) {
                const ringRadius = starRadius + 3 + Math.sin(star.pulse) * 2;
                this.ctx.strokeStyle = star.glowColor;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(star.currentX, star.currentY, ringRadius, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Draw difficulty indicator (small number)
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                star.problem.difficulty,
                star.currentX,
                star.currentY
            );

            // Draw completion status indicator
            if (star.problem.studentStatus === 'completed' || star.problem.studentStatus === 'mastered') {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.fillText('✓', star.currentX, star.currentY - starRadius - 8);
            }
        });
    }

    /**
     * Draw label for hovered star
     */
    drawLabel(star) {
        const padding = 10;
        const maxWidth = 200;
        const lineHeight = 16;

        this.ctx.font = '12px Arial';
        const title = star.problem.title;
        const score = star.problem.studentScore > 0 ?
            `점수: ${star.problem.studentScore.toFixed(0)}점` : '';

        // Calculate label position (avoid edges)
        let labelX = star.currentX + 20;
        let labelY = star.currentY - 30;

        if (labelX + maxWidth > this.width) labelX = star.currentX - maxWidth - 20;
        if (labelY < 0) labelY = star.currentY + 30;

        // Draw background
        const labelHeight = lineHeight * (score ? 2 : 1) + padding * 2;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(labelX - padding, labelY - padding, maxWidth + padding * 2, labelHeight);

        // Draw text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textAlign = 'left';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText(this.truncateText(title, maxWidth), labelX, labelY);

        if (score) {
            this.ctx.fillStyle = '#a0aec0';
            this.ctx.fillText(score, labelX, labelY + lineHeight);
        }
    }

    /**
     * Truncate text to fit width
     */
    truncateText(text, maxWidth) {
        if (this.ctx.measureText(text).width <= maxWidth) {
            return text;
        }

        let truncated = text;
        while (this.ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
        }
        return truncated + '...';
    }

    /**
     * Create and update particles
     */
    updateParticles() {
        // Create new particles occasionally
        if (Math.random() < 0.1 && this.particles.length < this.config.particleCount) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                life: 1,
                decay: 0.005 + Math.random() * 0.01
            });
        }

        // Update and remove dead particles
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;

            // Wrap around edges
            if (p.x < 0) p.x = this.width;
            if (p.x > this.width) p.x = 0;
            if (p.y < 0) p.y = this.height;
            if (p.y > this.height) p.y = 0;

            return p.life > 0;
        });
    }

    /**
     * Draw particles
     */
    drawParticles() {
        this.particles.forEach(p => {
            this.ctx.fillStyle = `rgba(150, 150, 255, ${p.life * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 1, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredStar = null;
            this.canvas.style.cursor = 'default';
        });
    }

    /**
     * Handle mouse move
     */
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check if hovering over a star
        this.hoveredStar = this.stars.find(star => {
            const distance = Math.sqrt(
                Math.pow(x - star.currentX, 2) +
                Math.pow(y - star.currentY, 2)
            );
            return distance < star.radius * 1.5;
        });

        this.canvas.style.cursor = this.hoveredStar ? 'pointer' : 'default';
    }

    /**
     * Handle click
     */
    handleClick(e) {
        if (this.hoveredStar) {
            this.selectedStar = this.hoveredStar;
            this.onStarClick(this.hoveredStar);
        }
    }

    /**
     * Callback for star click (override this)
     */
    onStarClick(star) {
        console.log('Star clicked:', star.problem);
        // Dispatch custom event
        const event = new CustomEvent('starclick', { detail: star.problem });
        this.canvas.dispatchEvent(event);
    }

    /**
     * Destroy and cleanup
     */
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}
