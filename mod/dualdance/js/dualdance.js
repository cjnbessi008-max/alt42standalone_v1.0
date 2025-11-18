/**
 * Dual Dance - Interactive Exponential & Logarithmic Function Visualizer
 *
 * @package    mod_dualdance
 * @copyright  2025 AI Education System
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

(function() {
    'use strict';

    // Main application state
    const DualDance = {
        canvas: null,
        ctx: null,
        currentProblem: null,
        startTime: null,
        timerInterval: null,
        animationFrame: null,
        animationPhase: 0,

        // Function parameters for visualization
        expBase: 2,
        logBase: 2,
        expCoeff: 1,
        logCoeff: 1,

        // Initialize the application
        init: function() {
            this.canvas = document.getElementById('dance-canvas');
            if (!this.canvas) {
                console.error('Canvas element not found');
                return;
            }

            this.ctx = this.canvas.getContext('2d');
            this.setupEventListeners();
            this.startAnimation();
        },

        // Set up all event listeners
        setupEventListeners: function() {
            const startBtn = document.getElementById('start-btn');
            const submitBtn = document.getElementById('submit-btn');
            const nextBtn = document.getElementById('next-btn');
            const answerInput = document.getElementById('answer-input');

            if (startBtn) {
                startBtn.addEventListener('click', () => this.startProblem());
            }

            if (submitBtn) {
                submitBtn.addEventListener('click', () => this.submitAnswer());
            }

            if (nextBtn) {
                nextBtn.addEventListener('click', () => this.nextProblem());
            }

            if (answerInput) {
                answerInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && !submitBtn.disabled) {
                        this.submitAnswer();
                    }
                });
            }
        },

        // Start the visualization animation
        startAnimation: function() {
            const animate = () => {
                this.animationPhase += 0.02 * DualDanceConfig.animation_speed;
                this.drawVisualization();
                this.animationFrame = requestAnimationFrame(animate);
            };
            animate();
        },

        // Draw the dual dance visualization
        drawVisualization: function() {
            const ctx = this.ctx;
            const width = this.canvas.width;
            const height = this.canvas.height;

            // Clear canvas
            ctx.clearRect(0, 0, width, height);

            // Draw background gradient
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#f8f9fa');
            gradient.addColorStop(1, '#e9ecef');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // Draw grid
            this.drawGrid(ctx, width, height);

            // Draw axes
            this.drawAxes(ctx, width, height);

            // Draw functions with animation
            this.drawExponentialFunction(ctx, width, height);
            this.drawLogarithmicFunction(ctx, width, height);

            // Draw intersection point if applicable
            this.drawIntersection(ctx, width, height);
        },

        // Draw coordinate grid
        drawGrid: function(ctx, width, height) {
            ctx.strokeStyle = '#dee2e6';
            ctx.lineWidth = 0.5;

            // Vertical grid lines
            for (let x = 0; x <= width; x += width / 10) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
                ctx.stroke();
            }

            // Horizontal grid lines
            for (let y = 0; y <= height; y += height / 10) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
            }
        },

        // Draw coordinate axes
        drawAxes: function(ctx, width, height) {
            const centerX = width / 2;
            const centerY = height / 2;

            ctx.strokeStyle = '#495057';
            ctx.lineWidth = 2;

            // X-axis
            ctx.beginPath();
            ctx.moveTo(0, centerY);
            ctx.lineTo(width, centerY);
            ctx.stroke();

            // Y-axis
            ctx.beginPath();
            ctx.moveTo(centerX, 0);
            ctx.lineTo(centerX, height);
            ctx.stroke();

            // Arrows
            this.drawArrow(ctx, width - 10, centerY, width, centerY);
            this.drawArrow(ctx, centerX, 10, centerX, 0);

            // Labels
            ctx.fillStyle = '#495057';
            ctx.font = '12px Arial';
            ctx.fillText('x', width - 20, centerY - 10);
            ctx.fillText('y', centerX + 10, 15);
        },

        // Draw arrow helper
        drawArrow: function(ctx, fromX, fromY, toX, toY) {
            const headlen = 8;
            const angle = Math.atan2(toY - fromY, toX - fromX);

            ctx.beginPath();
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6),
                       toY - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(toX, toY);
            ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6),
                       toY - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
        },

        // Draw exponential function with dancing animation
        drawExponentialFunction: function(ctx, width, height) {
            const centerX = width / 2;
            const centerY = height / 2;
            const scale = 30;

            // Animated parameters
            const animatedBase = this.expBase + 0.3 * Math.sin(this.animationPhase);
            const animatedCoeff = this.expCoeff + 0.2 * Math.cos(this.animationPhase * 0.7);

            ctx.strokeStyle = '#ff6b6b';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(255, 107, 107, 0.5)';

            ctx.beginPath();
            let started = false;

            for (let x = -5; x <= 5; x += 0.05) {
                const y = animatedCoeff * Math.pow(animatedBase, x);
                const canvasX = centerX + x * scale;
                const canvasY = centerY - y * scale;

                if (canvasY >= -50 && canvasY <= height + 50) {
                    if (!started) {
                        ctx.moveTo(canvasX, canvasY);
                        started = true;
                    } else {
                        ctx.lineTo(canvasX, canvasY);
                    }
                }
            }

            ctx.stroke();
            ctx.shadowBlur = 0;

            // Update label
            const expLabel = document.getElementById('exp-function-label');
            if (expLabel) {
                expLabel.textContent = `f(x) = ${this.expCoeff.toFixed(1)} × ${this.expBase.toFixed(1)}^x`;
            }
        },

        // Draw logarithmic function with dancing animation
        drawLogarithmicFunction: function(ctx, width, height) {
            const centerX = width / 2;
            const centerY = height / 2;
            const scale = 30;

            // Animated parameters
            const animatedBase = this.logBase + 0.3 * Math.cos(this.animationPhase * 1.1);
            const animatedCoeff = this.logCoeff + 0.2 * Math.sin(this.animationPhase * 0.9);

            ctx.strokeStyle = '#4facfe';
            ctx.lineWidth = 3;
            ctx.shadowBlur = 10;
            ctx.shadowColor = 'rgba(79, 172, 254, 0.5)';

            ctx.beginPath();
            let started = false;

            for (let x = 0.1; x <= 10; x += 0.05) {
                const y = animatedCoeff * Math.log(x) / Math.log(animatedBase);
                const canvasX = centerX + x * scale;
                const canvasY = centerY - y * scale;

                if (canvasX >= 0 && canvasX <= width && canvasY >= -50 && canvasY <= height + 50) {
                    if (!started) {
                        ctx.moveTo(canvasX, canvasY);
                        started = true;
                    } else {
                        ctx.lineTo(canvasX, canvasY);
                    }
                }
            }

            ctx.stroke();
            ctx.shadowBlur = 0;

            // Update label
            const logLabel = document.getElementById('log-function-label');
            if (logLabel) {
                logLabel.textContent = `g(x) = ${this.logCoeff.toFixed(1)} × log${this.logBase.toFixed(1)}(x)`;
            }
        },

        // Draw intersection point with pulsing animation
        drawIntersection: function(ctx, width, height) {
            if (!this.currentProblem || this.currentProblem.problem_type !== 'intersection') {
                return;
            }

            const centerX = width / 2;
            const centerY = height / 2;
            const scale = 30;

            // Approximate intersection point (simplified)
            const intersectX = 2;
            const intersectY = this.expCoeff * Math.pow(this.expBase, intersectX);

            const canvasX = centerX + intersectX * scale;
            const canvasY = centerY - intersectY * scale;

            // Pulsing circle
            const pulseSize = 5 + 3 * Math.sin(this.animationPhase * 3);

            ctx.fillStyle = '#feca57';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(254, 202, 87, 0.8)';

            ctx.beginPath();
            ctx.arc(canvasX, canvasY, pulseSize, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 0;
        },

        // Start a new problem
        startProblem: function() {
            const startBtn = document.getElementById('start-btn');
            const submitBtn = document.getElementById('submit-btn');
            const answerInput = document.getElementById('answer-input');
            const feedbackArea = document.getElementById('feedback-area');

            // Disable start button and show loading
            startBtn.disabled = true;
            startBtn.textContent = DualDanceConfig.strings.loading;

            // Hide feedback
            feedbackArea.style.display = 'none';

            // Make AJAX request to generate problem
            fetch(DualDanceConfig.wwwroot + '/mod/dualdance/view.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    id: DualDanceConfig.cmid,
                    action: 'generate_problem',
                    sesskey: DualDanceConfig.sesskey
                })
            })
            .then(response => response.json())
            .then(data => {
                this.currentProblem = data;

                // Update visualization parameters
                this.expBase = parseFloat(data.exp_base);
                this.logBase = parseFloat(data.log_base);
                this.expCoeff = parseFloat(data.exp_coefficient);
                this.logCoeff = parseFloat(data.log_coefficient);

                // Display problem
                document.getElementById('problem-text').innerHTML = data.question_text;

                // Enable input and submit button
                answerInput.disabled = false;
                answerInput.value = '';
                answerInput.focus();
                submitBtn.disabled = false;

                // Start timer
                this.startTimer();

                // Update button
                startBtn.textContent = DualDanceConfig.strings.start;
                startBtn.style.display = 'none';
            })
            .catch(error => {
                console.error('Error generating problem:', error);
                alert('Error generating problem. Please try again.');
                startBtn.disabled = false;
                startBtn.textContent = DualDanceConfig.strings.start;
            });
        },

        // Start timer
        startTimer: function() {
            this.startTime = Date.now();
            const timerDisplay = document.getElementById('timer');

            this.timerInterval = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const minutes = Math.floor(elapsed / 60);
                const seconds = elapsed % 60;
                timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }, 1000);
        },

        // Stop timer
        stopTimer: function() {
            if (this.timerInterval) {
                clearInterval(this.timerInterval);
                this.timerInterval = null;
            }
        },

        // Get elapsed time in seconds
        getElapsedTime: function() {
            return Math.floor((Date.now() - this.startTime) / 1000);
        },

        // Submit answer
        submitAnswer: function() {
            const answerInput = document.getElementById('answer-input');
            const submitBtn = document.getElementById('submit-btn');
            const answer = parseFloat(answerInput.value);

            if (isNaN(answer)) {
                alert('Please enter a valid number');
                return;
            }

            // Disable input and button
            answerInput.disabled = true;
            submitBtn.disabled = true;
            submitBtn.textContent = DualDanceConfig.strings.loading;

            // Stop timer
            const timeSpent = this.getElapsedTime();
            this.stopTimer();

            // Submit to server
            fetch(DualDanceConfig.wwwroot + '/mod/dualdance/view.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    id: DualDanceConfig.cmid,
                    action: 'submit_answer',
                    sesskey: DualDanceConfig.sesskey,
                    problemid: this.currentProblem.id,
                    answer: answer,
                    time_spent: timeSpent,
                    interaction_data: JSON.stringify({
                        animation_phase: this.animationPhase,
                        exp_base: this.expBase,
                        log_base: this.logBase
                    })
                })
            })
            .then(response => response.json())
            .then(data => {
                this.showFeedback(data);
                this.updateStats();
                submitBtn.textContent = DualDanceConfig.strings.submit;
            })
            .catch(error => {
                console.error('Error submitting answer:', error);
                alert('Error submitting answer. Please try again.');
                answerInput.disabled = false;
                submitBtn.disabled = false;
                submitBtn.textContent = DualDanceConfig.strings.submit;
            });
        },

        // Show feedback
        showFeedback: function(attempt) {
            const feedbackArea = document.getElementById('feedback-area');
            const feedbackMessage = document.getElementById('feedback-message');
            const nextBtn = document.getElementById('next-btn');

            let message = '';
            let className = '';

            if (attempt.is_correct == 1) {
                message = `<div class="feedback-correct">✓ ${DualDanceConfig.strings.correct}</div>`;
                message += `<div>Grade: ${Math.round(attempt.grade)}%</div>`;
                className = 'feedback-correct';
            } else {
                message = `<div class="feedback-incorrect">✗ ${DualDanceConfig.strings.incorrect}</div>`;
                message += `<div>${DualDanceConfig.strings.correct_answer.replace('{$a}',
                    this.currentProblem.answer)}</div>`;
                className = 'feedback-incorrect';
            }

            feedbackMessage.innerHTML = message;
            feedbackMessage.className = className;
            feedbackArea.style.display = 'block';
            nextBtn.style.display = 'inline-block';
        },

        // Update statistics display
        updateStats: function() {
            fetch(DualDanceConfig.wwwroot + '/mod/dualdance/view.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    id: DualDanceConfig.cmid,
                    action: 'get_stats',
                    sesskey: DualDanceConfig.sesskey
                })
            })
            .then(response => response.json())
            .then(stats => {
                if (stats) {
                    document.getElementById('current-grade').textContent =
                        Math.round(stats.grade) + '%';
                    document.getElementById('attempts-count').textContent =
                        stats.attempts_count || 0;
                    document.getElementById('correct-count').textContent =
                        stats.correct_count || 0;
                }
            })
            .catch(error => {
                console.error('Error updating stats:', error);
            });
        },

        // Next problem
        nextProblem: function() {
            const startBtn = document.getElementById('start-btn');
            const nextBtn = document.getElementById('next-btn');
            const feedbackArea = document.getElementById('feedback-area');
            const answerInput = document.getElementById('answer-input');

            // Reset UI
            feedbackArea.style.display = 'none';
            nextBtn.style.display = 'none';
            answerInput.value = '';
            startBtn.style.display = 'inline-block';
            startBtn.disabled = false;

            // Automatically start next problem
            this.startProblem();
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DualDance.init());
    } else {
        DualDance.init();
    }

    // Expose to global scope for debugging
    window.DualDance = DualDance;
})();
