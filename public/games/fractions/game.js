/**
 * Fraction Game (Frani the Slice Fairy)
 * Stage 1: Pure Sensation - Divide pizza by feeling
 */

class FractionGame {
    constructor() {
        this.canvas = document.getElementById('food-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.sessionId = this.getSessionId();
        this.currentStage = 1;
        this.currentLevel = 1;
        this.score = 0;
        this.targetSlices = 4; // How many equal pieces needed
        this.sliceLines = [];
        this.attempts = 0;
        this.startTime = Date.now();

        this.init();
    }

    getSessionId() {
        const params = new URLSearchParams(window.location.search);
        return params.get('session');
    }

    init() {
        // Set up canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Set up event listeners
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e));
        this.canvas.addEventListener('mousemove', (e) => this.draw(e));
        this.canvas.addEventListener('mouseup', () => this.endDrawing());

        // Touch support
        this.canvas.addEventListener('touchstart', (e) => this.startDrawing(e.touches[0]));
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            this.draw(e.touches[0]);
        });
        this.canvas.addEventListener('touchend', () => this.endDrawing());

        // Buttons
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('check-btn').addEventListener('click', () => this.checkAnswer());
        document.getElementById('next-stage-btn').addEventListener('click', () => this.nextStage());

        // Start game
        this.loadLevel();
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth - 40, 300);
        this.canvas.width = size;
        this.canvas.height = size;
        this.drawPizza();
    }

    loadLevel() {
        // Stage 1: Different target slice counts
        const levels = [
            { slices: 2, message: '피자를 2조각으로 나눠보세요!' },
            { slices: 4, message: '이번엔 4조각으로 나눠볼까요?' },
            { slices: 3, message: '3조각으로 나눠보세요!' },
            { slices: 6, message: '6조각이면 어떨까요?' },
            { slices: 8, message: '마지막! 8조각으로 도전해보세요!' }
        ];

        const level = levels[this.currentLevel - 1] || levels[0];
        this.targetSlices = level.slices;

        this.updateUI();
        this.setFairyMessage(level.message);
        this.setFairyEmotion('happy');
        this.reset();
    }

    updateUI() {
        document.getElementById('stage-name').textContent = `Stage 1 - Level ${this.currentLevel}/5`;
        document.getElementById('current-score').textContent = Math.round(this.score);
        document.getElementById('progress-fill').style.width = `${(this.currentLevel / 5) * 100}%`;
    }

    drawPizza() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = Math.min(this.canvas.width, this.canvas.height) / 2 - 20;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw pizza base
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fill();

        // Draw pizza toppings (pepperoni)
        const toppings = 8;
        for (let i = 0; i < toppings; i++) {
            const angle = (Math.PI * 2 * i) / toppings + Math.random() * 0.3;
            const distance = radius * 0.5 + Math.random() * radius * 0.3;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;

            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, 2 * Math.PI);
            this.ctx.fillStyle = '#C41E3A';
            this.ctx.fill();
        }

        // Draw crust
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 8;
        this.ctx.stroke();

        // Draw existing slice lines
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 3;
        this.sliceLines.forEach(line => {
            this.ctx.beginPath();
            this.ctx.moveTo(line.x1, line.y1);
            this.ctx.lineTo(line.x2, line.y2);
            this.ctx.stroke();
        });

        // Draw current line being drawn
        if (this.isDrawing && this.currentLine) {
            this.ctx.strokeStyle = '#667eea';
            this.ctx.lineWidth = 3;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.currentLine.x1, this.currentLine.y1);
            this.ctx.lineTo(this.currentLine.x2, this.currentLine.y2);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
    }

    startDrawing(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        this.isDrawing = true;
        this.currentLine = {
            x1: centerX,
            y1: centerY,
            x2: x,
            y2: y
        };
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = (e.clientX || e.pageX) - rect.left;
        const y = (e.clientY || e.pageY) - rect.top;

        this.currentLine.x2 = x;
        this.currentLine.y2 = y;

        this.drawPizza();
    }

    endDrawing() {
        if (!this.isDrawing) return;
        this.isDrawing = false;

        if (this.currentLine) {
            // Add line to sliceLines
            this.sliceLines.push({ ...this.currentLine });
            this.currentLine = null;
            this.attempts++;
            this.drawPizza();

            this.setFairyMessage('좋아요! 계속해보세요!');
            this.setFairyEmotion('happy');
        }
    }

    reset() {
        this.sliceLines = [];
        this.currentLine = null;
        this.isDrawing = false;
        this.attempts = 0;
        this.drawPizza();

        this.setFairyMessage('다시 시작해봐요!');
        this.setFairyEmotion('happy');
    }

    checkAnswer() {
        const sliceCount = this.sliceLines.length + 1; // +1 for the original pizza

        if (sliceCount === 0) {
            this.setFairyMessage('선을 그어서 피자를 나눠주세요!');
            this.setFairyEmotion('thinking');
            return;
        }

        // Check if slice count matches target
        const isCorrectCount = sliceCount === this.targetSlices;

        // Check if slices are roughly equal (simplified check)
        const areSlicesEqual = this.checkSlicesEquality();

        if (isCorrectCount && areSlicesEqual) {
            // Correct!
            this.handleCorrect();
        } else if (isCorrectCount && !areSlicesEqual) {
            // Right number but not equal
            this.setFairyMessage('조각 수는 맞지만, 크기가 다른 것 같아요. 똑같이 나눠볼까요?');
            this.setFairyEmotion('thinking');
            this.score += 20; // Partial credit
            this.updateUI();
        } else {
            // Wrong count
            this.setFairyMessage(`${this.targetSlices}조각으로 나눠주세요! 지금은 ${sliceCount}조각이에요.`);
            this.setFairyEmotion('sad');
            this.score += 5; // Small credit for trying
            this.updateUI();
        }
    }

    checkSlicesEquality() {
        // Simplified equality check based on angles
        if (this.sliceLines.length === 0) return true;

        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        const angles = this.sliceLines.map(line => {
            return Math.atan2(line.y2 - centerY, line.x2 - centerX);
        }).sort((a, b) => a - b);

        // Add 2π to get full circle
        angles.push(angles[0] + Math.PI * 2);

        // Calculate angle differences
        const differences = [];
        for (let i = 0; i < angles.length - 1; i++) {
            differences.push(angles[i + 1] - angles[i]);
        }

        // Check if all differences are similar (within 20% tolerance)
        const avgDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
        const isEqual = differences.every(diff => Math.abs(diff - avgDiff) < avgDiff * 0.2);

        return isEqual;
    }

    handleCorrect() {
        const bonusPoints = Math.max(100 - this.attempts * 5, 50);
        this.score += bonusPoints;
        this.updateUI();

        this.setFairyMessage('완벽해요! 🎉 모든 조각이 똑같아요!');
        this.setFairyEmotion('excited');

        // Show completion modal if level complete
        if (this.currentLevel < 5) {
            setTimeout(() => {
                this.showCompleteModal(`Level ${this.currentLevel} 완료!`, '다음 단계로 가볼까요?');
            }, 1000);
        } else {
            // Stage complete!
            setTimeout(() => {
                this.completeStage();
            }, 1000);
        }
    }

    showCompleteModal(title, message) {
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-message').textContent = message;
        document.getElementById('complete-modal').classList.add('active');
    }

    nextStage() {
        document.getElementById('complete-modal').classList.remove('active');

        if (this.currentLevel < 5) {
            this.currentLevel++;
            this.loadLevel();
        }
    }

    async completeStage() {
        const timeSpent = Math.floor((Date.now() - this.startTime) / 1000);
        const finalScore = Math.min(this.score, 100);

        this.showCompleteModal(
            '🎉 Stage 1 완료!',
            `점수: ${finalScore.toFixed(0)} / 100\n프라니가 정말 기뻐해요!`
        );

        // Send completion to parent (widget)
        if (window.parent && this.sessionId) {
            window.parent.postMessage({
                type: 'GAME_COMPLETE',
                session_id: this.sessionId,
                stage: this.currentStage,
                score: finalScore,
                time_spent: timeSpent
            }, '*');
        }
    }

    setFairyMessage(message) {
        document.getElementById('fairy-message').textContent = message;
    }

    setFairyEmotion(emotion) {
        const fairy = document.getElementById('fairy');
        fairy.className = `fairy ${emotion}`;

        const mouthEmojis = {
            happy: '😊',
            excited: '😄',
            sad: '😕',
            thinking: '🤔'
        };

        document.getElementById('fairy-mouth').textContent = mouthEmojis[emotion] || '😊';
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    new FractionGame();
});
