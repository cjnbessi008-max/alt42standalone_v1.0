/**
 * Twin Shape Glow - Game Engine
 * Core game logic and state management
 */

class TwinShapeGame {
    constructor(canvas, config = {}) {
        this.canvas = canvas;
        this.config = {
            userId: config.userId || 1,
            problemId: config.problemId || null,
            difficulty: config.difficulty || 1,
            ...config
        };

        this.state = {
            shapes: [],
            selectedShape: null,
            matchedPairs: [],
            score: 0,
            attempts: 0,
            startTime: null,
            endTime: null,
            isPlaying: false,
            timeElapsed: 0
        };

        this.colors = [
            '#3498db', '#e74c3c', '#2ecc71', '#f39c12',
            '#9b59b6', '#1abc9c', '#e67e22', '#34495e'
        ];

        this.callbacks = {
            onScoreChange: null,
            onPairMatch: null,
            onGameComplete: null,
            onTimeUpdate: null
        };

        this.timerInterval = null;
    }

    /**
     * Initialize game with problem data
     */
    async initialize(problemData) {
        if (!problemData) {
            problemData = await this.loadProblem();
        }

        if (!problemData || !problemData.shapes) {
            throw new Error('Invalid problem data');
        }

        this.state.shapes = problemData.shapes.map((shape, index) => ({
            ...shape,
            id: shape.id || `shape_${index}`,
            color: this.colors[shape.pair_id % this.colors.length],
            matched: false,
            element: null
        }));

        this.state.totalPairs = Math.floor(this.state.shapes.length / 2);
        this.renderShapes();
    }

    /**
     * Load problem from server
     */
    async loadProblem() {
        if (!this.config.problemId) {
            // Generate default problem for testing
            return this.generateDefaultProblem();
        }

        try {
            const response = await fetch(`api/get_problem.php?problem_id=${this.config.problemId}`);
            const data = await response.json();

            if (data.success) {
                return JSON.parse(data.shape_config);
            } else {
                throw new Error(data.error || 'Failed to load problem');
            }
        } catch (error) {
            console.error('Error loading problem:', error);
            return this.generateDefaultProblem();
        }
    }

    /**
     * Generate default problem for testing
     */
    generateDefaultProblem() {
        const numPairs = 3 + this.config.difficulty;
        const shapes = [];
        const shapeTypes = ['circle', 'square', 'triangle', 'pentagon', 'hexagon', 'star'];

        for (let i = 0; i < numPairs; i++) {
            const shapeType = shapeTypes[i % shapeTypes.length];
            const pairId = i + 1;

            // Create two similar shapes (twins)
            shapes.push({
                id: `shape_${i * 2 + 1}`,
                pair_id: pairId,
                type: shapeType,
                similarity_group: pairId,
                position: this.randomPosition(),
                size: 'medium'
            });

            shapes.push({
                id: `shape_${i * 2 + 2}`,
                pair_id: pairId,
                type: shapeType,
                similarity_group: pairId,
                position: this.randomPosition(),
                size: 'medium'
            });
        }

        return { shapes, numPairs, difficulty: this.config.difficulty };
    }

    /**
     * Generate random position ensuring no overlap
     */
    randomPosition() {
        const margin = 15;
        return {
            x: margin + Math.random() * (100 - 2 * margin),
            y: margin + Math.random() * (100 - 2 * margin)
        };
    }

    /**
     * Render shapes on canvas
     */
    renderShapes() {
        this.canvas.innerHTML = '';

        this.state.shapes.forEach(shape => {
            const element = ShapeRenderer.createShape(shape);
            element.style.left = `${shape.position.x}%`;
            element.style.top = `${shape.position.y}%`;

            element.addEventListener('click', () => this.handleShapeClick(shape));

            this.canvas.appendChild(element);
            shape.element = element;
        });
    }

    /**
     * Handle shape click
     */
    handleShapeClick(shape) {
        if (!this.state.isPlaying) {
            this.showMessage('게임을 먼저 시작하세요! / Please start the game first!');
            return;
        }

        if (shape.matched) {
            return; // Already matched
        }

        if (!this.state.selectedShape) {
            // First selection
            this.selectShape(shape);
        } else if (this.state.selectedShape.id === shape.id) {
            // Deselect same shape
            this.deselectShape();
        } else {
            // Second selection - check match
            this.checkMatch(this.state.selectedShape, shape);
        }
    }

    /**
     * Select a shape
     */
    selectShape(shape) {
        this.state.selectedShape = shape;
        shape.element.classList.add('active');
        this.showMessage('이제 닮은 도형을 선택하세요! / Now select its twin shape!');

        // Add proximity detection
        this.checkProximity(shape);
    }

    /**
     * Deselect shape
     */
    deselectShape() {
        if (this.state.selectedShape) {
            this.state.selectedShape.element.classList.remove('active', 'twin-nearby');
            this.state.selectedShape = null;
        }

        this.state.shapes.forEach(s => {
            if (!s.matched) {
                s.element.classList.remove('twin-nearby');
            }
        });

        this.showMessage('');
    }

    /**
     * Check proximity to twin shape
     */
    checkProximity(shape) {
        this.state.shapes.forEach(s => {
            if (s.id !== shape.id && !s.matched) {
                const distance = this.calculateDistance(shape.position, s.position);

                if (s.pair_id === shape.pair_id && distance < 30) {
                    s.element.classList.add('twin-nearby');
                } else {
                    s.element.classList.remove('twin-nearby');
                }
            }
        });
    }

    /**
     * Calculate distance between two positions
     */
    calculateDistance(pos1, pos2) {
        const dx = pos1.x - pos2.x;
        const dy = pos1.y - pos2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Check if two shapes match
     */
    checkMatch(shape1, shape2) {
        this.state.attempts++;

        const isMatch = shape1.pair_id === shape2.pair_id;

        if (isMatch) {
            this.handleCorrectMatch(shape1, shape2);
        } else {
            this.handleWrongMatch(shape1, shape2);
        }
    }

    /**
     * Handle correct match
     */
    handleCorrectMatch(shape1, shape2) {
        // Mark as matched
        shape1.matched = true;
        shape2.matched = true;

        // Color synchronization animation
        shape1.element.classList.add('matched', 'syncing');
        shape2.element.classList.add('matched', 'syncing');

        // Draw connection line
        this.drawConnectionLine(shape1, shape2);

        // Create particles
        this.createParticles(shape1.element);
        this.createParticles(shape2.element);

        // Update score
        const points = 100 * this.config.difficulty;
        this.addScore(points, shape2.element);

        // Record match
        this.state.matchedPairs.push([shape1.id, shape2.id]);

        // Show success message
        this.showMessage('완벽해요! 🎉 / Perfect Match! 🎉', 'success');

        // Play success sound (if available)
        this.playSound('success');

        // Deselect
        this.state.selectedShape = null;

        // Check if game complete
        if (this.state.matchedPairs.length === this.state.totalPairs) {
            setTimeout(() => this.completeGame(), 800);
        }

        // Callback
        if (this.callbacks.onPairMatch) {
            this.callbacks.onPairMatch(shape1, shape2, this.state.matchedPairs.length);
        }
    }

    /**
     * Handle wrong match
     */
    handleWrongMatch(shape1, shape2) {
        shape1.element.classList.add('wrong');
        shape2.element.classList.add('wrong');

        setTimeout(() => {
            shape1.element.classList.remove('wrong');
            shape2.element.classList.remove('wrong');
        }, 500);

        this.showMessage('다시 시도해보세요! / Try again!', 'error');
        this.playSound('error');

        // Deselect after delay
        setTimeout(() => this.deselectShape(), 600);

        // Penalty
        this.addScore(-10);
    }

    /**
     * Draw connection line between matched shapes
     */
    drawConnectionLine(shape1, shape2) {
        const rect1 = shape1.element.getBoundingClientRect();
        const rect2 = shape2.element.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();

        const x1 = rect1.left + rect1.width / 2 - canvasRect.left;
        const y1 = rect1.top + rect1.height / 2 - canvasRect.top;
        const x2 = rect2.left + rect2.width / 2 - canvasRect.left;
        const y2 = rect2.top + rect2.height / 2 - canvasRect.top;

        const line = document.createElement('div');
        line.className = 'connection-line';
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;

        const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg)`;
        line.style.color = shape1.color;

        this.canvas.appendChild(line);

        setTimeout(() => line.remove(), 1000);
    }

    /**
     * Create particle effects
     */
    createParticles(element) {
        const rect = element.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();

        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = `${rect.left + rect.width / 2 - canvasRect.left}px`;
            particle.style.top = `${rect.top + rect.height / 2 - canvasRect.top}px`;
            particle.style.background = element.style.color || '#fff';

            const angle = (Math.PI * 2 * i) / 10;
            const distance = 50 + Math.random() * 50;

            particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
            particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);

            this.canvas.appendChild(particle);

            setTimeout(() => particle.remove(), 1000);
        }
    }

    /**
     * Add score with animation
     */
    addScore(points, element = null) {
        this.state.score = Math.max(0, this.state.score + points);

        if (this.callbacks.onScoreChange) {
            this.callbacks.onScoreChange(this.state.score);
        }

        if (points > 0 && element) {
            const scorePop = document.createElement('div');
            scorePop.className = 'score-pop';
            scorePop.textContent = `+${points}`;

            const rect = element.getBoundingClientRect();
            const canvasRect = this.canvas.getBoundingClientRect();

            scorePop.style.left = `${rect.left + rect.width / 2 - canvasRect.left}px`;
            scorePop.style.top = `${rect.top - canvasRect.top}px`;

            this.canvas.appendChild(scorePop);

            setTimeout(() => scorePop.remove(), 1000);
        }
    }

    /**
     * Start game
     */
    start() {
        this.state.isPlaying = true;
        this.state.startTime = Date.now();
        this.state.score = 0;
        this.state.attempts = 0;
        this.state.matchedPairs = [];

        // Reset all shapes
        this.state.shapes.forEach(shape => {
            shape.matched = false;
            shape.element.classList.remove('matched', 'active', 'syncing', 'wrong');
        });

        this.deselectShape();
        this.showMessage('도형을 클릭하여 쌍을 맞춰보세요! / Click shapes to find matching pairs!');

        // Start timer
        this.startTimer();
    }

    /**
     * Start timer
     */
    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            this.state.timeElapsed = Math.floor((Date.now() - this.state.startTime) / 1000);

            if (this.callbacks.onTimeUpdate) {
                this.callbacks.onTimeUpdate(this.state.timeElapsed);
            }
        }, 1000);
    }

    /**
     * Stop timer
     */
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Complete game
     */
    completeGame() {
        this.state.isPlaying = false;
        this.state.endTime = Date.now();
        this.stopTimer();

        const accuracy = ((this.state.matchedPairs.length / this.state.attempts) * 100).toFixed(1);

        this.showCompletionScreen({
            score: this.state.score,
            time: this.state.timeElapsed,
            attempts: this.state.attempts,
            accuracy: accuracy
        });

        if (this.callbacks.onGameComplete) {
            this.callbacks.onGameComplete(this.state);
        }

        // Save progress to server
        this.saveProgress();
    }

    /**
     * Show completion screen
     */
    showCompletionScreen(stats) {
        const overlay = document.createElement('div');
        overlay.className = 'completion-overlay';

        const stars = stats.accuracy >= 90 ? '⭐⭐⭐' :
                     stats.accuracy >= 70 ? '⭐⭐' : '⭐';

        overlay.innerHTML = `
            <h2>🎉 완료! / Complete! 🎉</h2>
            <div class="stars">${stars}</div>
            <div class="completion-stats">
                <p>점수 / Score: <strong>${stats.score}</strong></p>
                <p>시간 / Time: <strong>${this.formatTime(stats.time)}</strong></p>
                <p>시도 / Attempts: <strong>${stats.attempts}</strong></p>
                <p>정확도 / Accuracy: <strong>${stats.accuracy}%</strong></p>
            </div>
        `;

        this.canvas.appendChild(overlay);
    }

    /**
     * Format time as MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Show message
     */
    showMessage(text, type = 'info') {
        const messageEl = document.getElementById('game-message');
        if (messageEl) {
            messageEl.textContent = text;
            messageEl.className = `game-message ${type}`;
        }
    }

    /**
     * Provide hint
     */
    showHint() {
        if (!this.state.isPlaying) {
            this.showMessage('게임을 먼저 시작하세요! / Start the game first!');
            return;
        }

        // Find first unmatched pair
        const unmatchedPairs = {};

        this.state.shapes.forEach(shape => {
            if (!shape.matched) {
                if (!unmatchedPairs[shape.pair_id]) {
                    unmatchedPairs[shape.pair_id] = [];
                }
                unmatchedPairs[shape.pair_id].push(shape);
            }
        });

        const firstPair = Object.values(unmatchedPairs)[0];

        if (firstPair && firstPair.length === 2) {
            firstPair.forEach(shape => {
                shape.element.classList.add('hint');
                setTimeout(() => shape.element.classList.remove('hint'), 3000);
            });

            this.showMessage('힌트를 확인하세요! / Check the hint!');
            this.addScore(-20); // Penalty for hint
        }
    }

    /**
     * Reset game
     */
    reset() {
        this.stopTimer();
        this.state.isPlaying = false;
        this.state.selectedShape = null;
        this.state.matchedPairs = [];
        this.state.score = 0;
        this.state.attempts = 0;
        this.state.timeElapsed = 0;

        this.state.shapes.forEach(shape => {
            shape.matched = false;
            if (shape.element) {
                shape.element.classList.remove('matched', 'active', 'syncing', 'wrong', 'hint');
            }
        });

        const overlay = this.canvas.querySelector('.completion-overlay');
        if (overlay) {
            overlay.remove();
        }

        this.showMessage('');

        if (this.callbacks.onScoreChange) {
            this.callbacks.onScoreChange(0);
        }
    }

    /**
     * Save progress to server
     */
    async saveProgress() {
        if (!this.config.problemId) {
            return;
        }

        try {
            const data = {
                user_id: this.config.userId,
                problem_id: this.config.problemId,
                score: this.state.score,
                time_spent: this.state.timeElapsed,
                completed: this.state.matchedPairs.length === this.state.totalPairs
            };

            await fetch('api/save_progress.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    /**
     * Play sound effect
     */
    playSound(type) {
        // Implement sound effects if needed
        console.log(`Sound: ${type}`);
    }

    /**
     * Register callback
     */
    on(event, callback) {
        this.callbacks[event] = callback;
    }
}
