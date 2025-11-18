/**
 * Angle Light - Vector Angle Visualization with Light Sensitivity
 * 두 벡터의 각도를 빛의 밝기로 시각화
 */

class AngleLightApp {
    constructor() {
        this.canvas = document.getElementById('vectorCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.vectorLength = 200;

        // Current state
        this.currentProblem = null;
        this.vector1 = { x: 1, y: 0 };
        this.vector2 = { x: 0.707, y: 0.707 };
        this.currentAngle = 45;
        this.targetAngle = 45;
        this.tolerance = 2;
        this.startTime = null;
        this.timerInterval = null;
        this.attemptCount = 0;
        this.maxAttempts = 3;

        // Problem list
        this.problems = [];
        this.currentFilter = 'all';

        this.initializeElements();
        this.attachEventListeners();
        this.loadProblems();
    }

    initializeElements() {
        // UI Elements
        this.elements = {
            // Sliders and displays
            angleSlider: document.getElementById('angleSlider'),
            currentAngleDisplay: document.getElementById('currentAngle'),
            targetAngleDisplay: document.getElementById('targetAngle'),
            toleranceDisplay: document.getElementById('tolerance'),
            angleDifferenceDisplay: document.getElementById('angleDifference'),
            lightIntensityDisplay: document.getElementById('lightIntensity'),

            // Buttons
            resetBtn: document.getElementById('resetBtn'),
            submitBtn: document.getElementById('submitBtn'),

            // Problem info
            problemTitle: document.getElementById('problemTitle'),
            problemDescription: document.getElementById('problemDescription'),

            // Feedback
            feedbackPanel: document.getElementById('feedbackPanel'),
            feedbackTitle: document.getElementById('feedbackTitle'),
            feedbackMessage: document.getElementById('feedbackMessage'),
            feedbackScore: document.getElementById('feedbackScore'),
            feedbackAttempts: document.getElementById('feedbackAttempts'),
            feedbackTime: document.getElementById('feedbackTime'),

            // Timer
            timeDisplay: document.getElementById('timeDisplay'),
            attemptDisplay: document.getElementById('attemptDisplay'),

            // Lists
            problemListContainer: document.getElementById('problemListContainer'),
            lightOverlay: document.getElementById('lightOverlay')
        };
    }

    attachEventListeners() {
        // Angle slider
        this.elements.angleSlider.addEventListener('input', (e) => {
            this.currentAngle = parseFloat(e.target.value);
            this.updateVectorFromAngle(this.currentAngle);
            this.updateDisplay();
            this.draw();
        });

        // Buttons
        this.elements.resetBtn.addEventListener('click', () => this.resetProblem());
        this.elements.submitBtn.addEventListener('click', () => this.submitAnswer());

        // Filter buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentFilter = e.target.dataset.difficulty;
                this.renderProblemList();
            });
        });
    }

    async loadProblems() {
        try {
            this.showLoading(true);
            const response = await fetch(`${CONFIG.API_BASE}/problems.php?student_id=${CONFIG.STUDENT_ID}`);
            const data = await response.json();

            if (data.success) {
                this.problems = data.data.problems;
                this.renderProblemList();

                // Load first problem by default
                if (this.problems.length > 0) {
                    this.loadProblem(this.problems[0]);
                }
            }
        } catch (error) {
            console.error('Failed to load problems:', error);
            alert('문제를 불러오는데 실패했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    renderProblemList() {
        const filtered = this.currentFilter === 'all'
            ? this.problems
            : this.problems.filter(p => p.difficulty === this.currentFilter);

        this.elements.problemListContainer.innerHTML = filtered.map(problem => {
            const stats = problem.student_stats || { attempts: 0, solved: 0 };
            const solvedIcon = stats.solved ? '✓' : '';

            return `
                <div class="problem-item" data-id="${problem.id}">
                    <div class="problem-name">${solvedIcon} ${problem.title}</div>
                    <div class="problem-meta">
                        <span class="difficulty-badge difficulty-${problem.difficulty}">
                            ${this.getDifficultyLabel(problem.difficulty)}
                        </span>
                        <span>${problem.target_angle.toFixed(1)}°</span>
                    </div>
                </div>
            `;
        }).join('');

        // Attach click handlers
        document.querySelectorAll('.problem-item').forEach(item => {
            item.addEventListener('click', () => {
                const problemId = parseInt(item.dataset.id);
                const problem = this.problems.find(p => p.id === problemId);
                if (problem) {
                    this.loadProblem(problem);
                }
            });
        });
    }

    getDifficultyLabel(difficulty) {
        const labels = {
            easy: '쉬움',
            medium: '중급',
            hard: '어려움'
        };
        return labels[difficulty] || difficulty;
    }

    loadProblem(problem) {
        this.currentProblem = problem;

        // Update UI
        this.elements.problemTitle.textContent = problem.title;
        this.elements.problemDescription.textContent = problem.description;
        this.elements.targetAngleDisplay.textContent = `${problem.target_angle.toFixed(1)}°`;
        this.elements.toleranceDisplay.textContent = `±${problem.tolerance.toFixed(1)}°`;

        // Set vectors
        this.vector1 = problem.vector1;
        this.vector2 = problem.vector2;
        this.targetAngle = problem.target_angle;
        this.tolerance = problem.tolerance;
        this.maxAttempts = problem.max_attempts;

        // Calculate initial angle from vector2
        this.currentAngle = this.calculateAngleFromVector(this.vector2);
        this.elements.angleSlider.value = this.currentAngle;

        // Reset state
        this.attemptCount = 0;
        this.elements.feedbackPanel.style.display = 'none';

        // Highlight selected problem
        document.querySelectorAll('.problem-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.id) === problem.id);
        });

        // Start timer
        this.startTimer();

        // Update display and draw
        this.updateDisplay();
        this.draw();

        // Update smartphone UI
        if (window.smartphoneUI) {
            window.smartphoneUI.updateProblem(problem);
        }
    }

    updateVectorFromAngle(angleDeg) {
        const angleRad = angleDeg * Math.PI / 180;
        this.vector2 = {
            x: Math.cos(angleRad),
            y: Math.sin(angleRad)
        };
    }

    calculateAngleFromVector(vector) {
        const angleRad = Math.atan2(vector.y, vector.x);
        let angleDeg = angleRad * 180 / Math.PI;
        if (angleDeg < 0) angleDeg += 360;
        return angleDeg;
    }

    calculateAngleBetweenVectors(v1, v2) {
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

        if (mag1 === 0 || mag2 === 0) return 0;

        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        return Math.acos(cosAngle) * 180 / Math.PI;
    }

    updateDisplay() {
        // Update angle displays
        this.elements.currentAngleDisplay.textContent = `${this.currentAngle.toFixed(1)}°`;

        // Calculate angle difference
        let diff = Math.abs(this.currentAngle - this.targetAngle);
        this.elements.angleDifferenceDisplay.textContent = `${diff.toFixed(1)}°`;

        // Calculate light intensity
        const maxError = 180;
        let intensity = Math.max(0, Math.min(100, 100 - (diff / maxError) * 100));
        this.elements.lightIntensityDisplay.textContent = `${intensity.toFixed(1)}%`;

        // Update light overlay
        this.elements.lightOverlay.style.opacity = intensity / 100;

        // Update attempt display
        this.elements.attemptDisplay.textContent = `${this.attemptCount}/${this.maxAttempts}`;

        // Update smartphone UI
        if (window.smartphoneUI) {
            window.smartphoneUI.updateAngle(this.currentAngle, intensity);
        }
    }

    draw() {
        const ctx = this.ctx;
        const centerX = this.centerX;
        const centerY = this.centerY;

        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw grid
        this.drawGrid(ctx, centerX, centerY);

        // Draw angle arc
        const angle1 = this.calculateAngleFromVector(this.vector1);
        const angle2 = this.calculateAngleFromVector(this.vector2);
        this.drawAngleArc(ctx, centerX, centerY, angle1, angle2);

        // Draw vectors
        this.drawVector(ctx, centerX, centerY, this.vector1, '#00ff88', 'Vector 1');
        this.drawVector(ctx, centerX, centerY, this.vector2, '#ff4444', 'Vector 2');

        // Draw center point
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        ctx.fill();

        // Draw angle labels
        const angleBetween = this.calculateAngleBetweenVectors(this.vector1, this.vector2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${angleBetween.toFixed(1)}°`, centerX, centerY - 30);
    }

    drawGrid(ctx, centerX, centerY) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Draw concentric circles
        for (let r = 50; r <= 250; r += 50) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw axis lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;

        // X axis
        ctx.beginPath();
        ctx.moveTo(centerX - 250, centerY);
        ctx.lineTo(centerX + 250, centerY);
        ctx.stroke();

        // Y axis
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 250);
        ctx.lineTo(centerX, centerY + 250);
        ctx.stroke();
    }

    drawAngleArc(ctx, centerX, centerY, angle1Deg, angle2Deg) {
        const angle1 = angle1Deg * Math.PI / 180;
        const angle2 = angle2Deg * Math.PI / 180;
        const radius = 80;

        ctx.strokeStyle = 'rgba(255, 255, 100, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, angle1, angle2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 100, 0.1)';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle1, angle2);
        ctx.closePath();
        ctx.fill();
    }

    drawVector(ctx, centerX, centerY, vector, color, label) {
        const endX = centerX + vector.x * this.vectorLength;
        const endY = centerY - vector.y * this.vectorLength; // Invert Y for canvas

        // Draw arrow
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 4;

        // Line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(-(vector.y), vector.x);
        const headLength = 20;

        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - headLength * Math.cos(angle - Math.PI / 6),
            endY + headLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            endX - headLength * Math.cos(angle + Math.PI / 6),
            endY + headLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();

        // Label
        ctx.fillStyle = color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, endX, endY - 15);
    }

    startTimer() {
        this.startTime = Date.now();
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.elements.timeDisplay.textContent =
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    }

    resetProblem() {
        if (!this.currentProblem) return;

        // Reset to initial state
        this.vector2 = this.currentProblem.vector2;
        this.currentAngle = this.calculateAngleFromVector(this.vector2);
        this.elements.angleSlider.value = this.currentAngle;
        this.elements.feedbackPanel.style.display = 'none';

        this.updateDisplay();
        this.draw();
    }

    async submitAnswer() {
        if (!this.currentProblem) {
            alert('문제를 먼저 선택하세요.');
            return;
        }

        if (this.attemptCount >= this.maxAttempts) {
            alert('최대 시도 횟수를 초과했습니다.');
            return;
        }

        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);

        try {
            this.showLoading(true);

            const response = await fetch(`${CONFIG.API_BASE}/progress.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    student_id: CONFIG.STUDENT_ID,
                    problem_id: this.currentProblem.id,
                    submitted_angle: this.currentAngle,
                    time_spent: timeSpent
                })
            });

            const data = await response.json();

            if (data.success) {
                this.attemptCount++;
                this.showFeedback(data.data);
            } else {
                alert('답안 제출에 실패했습니다: ' + data.error);
            }
        } catch (error) {
            console.error('Submit error:', error);
            alert('답안 제출 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    showFeedback(data) {
        const panel = this.elements.feedbackPanel;
        panel.style.display = 'block';
        panel.className = 'feedback ' + (data.is_correct ? '' : 'error');

        this.elements.feedbackTitle.textContent = data.is_correct ? '✓ 정답입니다!' : '✗ 틀렸습니다';
        this.elements.feedbackMessage.textContent = data.feedback;
        this.elements.feedbackScore.textContent = data.score.toFixed(0);
        this.elements.feedbackAttempts.textContent = `${data.attempt_number}/${this.maxAttempts}`;
        this.elements.feedbackTime.textContent = data.time_spent || '--';

        // Disable submit if max attempts reached
        if (data.attempts_remaining === 0) {
            this.elements.submitBtn.disabled = true;
        }
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.angleLightApp = new AngleLightApp();
});
