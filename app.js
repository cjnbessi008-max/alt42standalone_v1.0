/**
 * Main Application - ALT42 Standalone Zero Spark Math
 * Integrates graph rendering, zero finding, and spark effects
 */

class GraphRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.zeros = [];
        this.currentExpression = '';
        this.xMin = -5;
        this.xMax = 5;
        this.yMin = -10;
        this.yMax = 10;
        this.animationId = null;
        this.pulsePhase = 0;
        this.animatingZeros = false;

        this.setupCanvas();
        this.render();
    }

    setupCanvas() {
        // Set canvas size to match display size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        this.width = rect.width;
        this.height = rect.height;
    }

    /**
     * Convert graph coordinates to canvas coordinates
     */
    graphToCanvas(x, y) {
        const canvasX = ((x - this.xMin) / (this.xMax - this.xMin)) * this.width;
        const canvasY = this.height - ((y - this.yMin) / (this.yMax - this.yMin)) * this.height;
        return { x: canvasX, y: canvasY };
    }

    /**
     * Calculate appropriate y-axis range based on function values
     */
    calculateYRange(expression) {
        let minY = Infinity;
        let maxY = -Infinity;

        for (let x = this.xMin; x <= this.xMax; x += 0.1) {
            const y = mathParser.evaluate(expression, x);
            if (isFinite(y)) {
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);
            }
        }

        // Add padding
        const padding = (maxY - minY) * 0.2;
        this.yMin = minY - padding;
        this.yMax = maxY + padding;

        // Ensure reasonable bounds
        if (!isFinite(this.yMin)) this.yMin = -10;
        if (!isFinite(this.yMax)) this.yMax = 10;
        if (this.yMax - this.yMin < 1) {
            this.yMin -= 5;
            this.yMax += 5;
        }
    }

    /**
     * Draw coordinate axes
     */
    drawAxes() {
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 2;

        // X-axis
        const yAxisPos = this.graphToCanvas(0, 0).y;
        if (yAxisPos >= 0 && yAxisPos <= this.height) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, yAxisPos);
            this.ctx.lineTo(this.width, yAxisPos);
            this.ctx.stroke();
        }

        // Y-axis
        const xAxisPos = this.graphToCanvas(0, 0).x;
        if (xAxisPos >= 0 && xAxisPos <= this.width) {
            this.ctx.beginPath();
            this.ctx.moveTo(xAxisPos, 0);
            this.ctx.lineTo(xAxisPos, this.height);
            this.ctx.stroke();
        }

        // Draw grid
        this.ctx.strokeStyle = '#e0e0e0';
        this.ctx.lineWidth = 1;

        // Vertical grid lines
        for (let x = Math.ceil(this.xMin); x <= this.xMax; x++) {
            const pos = this.graphToCanvas(x, 0);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, 0);
            this.ctx.lineTo(pos.x, this.height);
            this.ctx.stroke();

            // Labels
            if (x !== 0) {
                this.ctx.fillStyle = '#666';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(x.toString(), pos.x, yAxisPos + 15);
            }
        }

        // Horizontal grid lines
        const yStep = Math.pow(10, Math.floor(Math.log10(this.yMax - this.yMin))) || 1;
        for (let y = Math.ceil(this.yMin / yStep) * yStep; y <= this.yMax; y += yStep) {
            const pos = this.graphToCanvas(0, y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, pos.y);
            this.ctx.lineTo(this.width, pos.y);
            this.ctx.stroke();

            // Labels
            if (Math.abs(y) > 0.001) {
                this.ctx.fillStyle = '#666';
                this.ctx.font = '10px Arial';
                this.ctx.textAlign = 'right';
                this.ctx.fillText(y.toFixed(1), xAxisPos - 5, pos.y + 4);
            }
        }
    }

    /**
     * Draw the function graph
     */
    drawFunction(expression) {
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();

        let started = false;
        const step = (this.xMax - this.xMin) / (this.width * 2);

        for (let x = this.xMin; x <= this.xMax; x += step) {
            const y = mathParser.evaluate(expression, x);

            if (isFinite(y) && y >= this.yMin && y <= this.yMax) {
                const pos = this.graphToCanvas(x, y);

                if (!started) {
                    this.ctx.moveTo(pos.x, pos.y);
                    started = true;
                } else {
                    this.ctx.lineTo(pos.x, pos.y);
                }
            } else if (started) {
                this.ctx.stroke();
                this.ctx.beginPath();
                started = false;
            }
        }

        if (started) {
            this.ctx.stroke();
        }
    }

    /**
     * Draw zero points with spark effects
     */
    drawZeros() {
        this.zeros.forEach((zero, index) => {
            const pos = this.graphToCanvas(zero.x, 0);

            // Draw pulsing glow
            const pulseOffset = index * 0.3;
            sparkEffect.drawPulsingGlow(
                this.ctx,
                pos.x,
                pos.y,
                15,
                this.pulsePhase + pulseOffset
            );

            // Draw star
            this.ctx.save();
            this.ctx.fillStyle = '#FFD700';
            this.ctx.shadowColor = '#FFA500';
            this.ctx.shadowBlur = 20;

            sparkEffect.drawStar(
                this.ctx,
                pos.x,
                pos.y,
                5,
                12,
                6,
                this.pulsePhase * 2
            );
            this.ctx.fill();

            // Draw inner star (rotating opposite direction)
            this.ctx.fillStyle = '#FFFFFF';
            sparkEffect.drawStar(
                this.ctx,
                pos.x,
                pos.y,
                5,
                8,
                4,
                -this.pulsePhase * 3
            );
            this.ctx.fill();

            this.ctx.restore();

            // Draw zero marker
            this.ctx.fillStyle = '#FF4500';
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw label
            this.ctx.fillStyle = '#333';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`x = ${zero.x.toFixed(3)}`, pos.x, pos.y - 25);
        });
    }

    /**
     * Main render loop
     */
    render() {
        // Clear canvas
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw axes and grid
        this.drawAxes();

        // Draw function if available
        if (this.currentExpression) {
            this.drawFunction(this.currentExpression);
        }

        // Draw zeros with effects
        if (this.zeros.length > 0) {
            this.drawZeros();
        }

        // Update and draw particle effects
        sparkEffect.update();
        sparkEffect.draw(this.ctx);

        // Update pulse phase
        this.pulsePhase += 0.02;
        if (this.pulsePhase > 1) this.pulsePhase = 0;

        // Continue animation loop
        this.animationId = requestAnimationFrame(() => this.render());
    }

    /**
     * Set the function expression and find zeros
     */
    async setFunction(expression, xMin, xMax) {
        this.currentExpression = expression;
        this.xMin = xMin;
        this.xMax = xMax;

        // Calculate appropriate y range
        this.calculateYRange(expression);

        // Find zeros
        updateStatus('근을 찾는 중... / Finding zeros...');
        this.zeros = zeroFinder.findZeros(expression, xMin, xMax);

        // Trigger spark effects at each zero
        if (this.zeros.length > 0) {
            updateStatus(`${this.zeros.length}개의 근을 발견했습니다! / Found ${this.zeros.length} zero(s)!`);

            // Animate sparks one by one
            for (let i = 0; i < this.zeros.length; i++) {
                await this.animateZeroDiscovery(this.zeros[i], i);
            }
        } else {
            updateStatus('주어진 범위에서 근을 찾을 수 없습니다. / No zeros found in the given range.');
        }

        return this.zeros;
    }

    /**
     * Animate the discovery of a zero with spark effect
     */
    animateZeroDiscovery(zero, index) {
        return new Promise((resolve) => {
            const pos = this.graphToCanvas(zero.x, 0);

            // Create spark effect
            sparkEffect.createSpark(pos.x, pos.y, 80);

            // Play sound effect (if available)
            this.playSparkSound();

            // Wait for animation to settle
            setTimeout(resolve, 500);
        });
    }

    /**
     * Play spark sound effect (placeholder)
     */
    playSparkSound() {
        // In a full implementation, this would play an actual sound
        // For now, we'll use the Web Audio API to create a simple beep
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.2);
        } catch (e) {
            // Audio not supported or blocked
        }
    }

    /**
     * Reset the graph
     */
    reset() {
        this.zeros = [];
        this.currentExpression = '';
        sparkEffect.clear();
        updateStatus('그래프를 그리려면 "근 찾기"를 클릭하세요 / Click "Find Zeros" to draw graph');
    }
}

// Utility functions
function updateStatus(message) {
    document.getElementById('statusText').textContent = message;
}

function displayZeros(zeros) {
    const zerosList = document.getElementById('zerosList');

    if (zeros.length === 0) {
        zerosList.innerHTML = '<p>근을 찾을 수 없습니다. / No zeros found.</p>';
        return;
    }

    zerosList.innerHTML = zeros.map((zero, index) => `
        <div class="zero-item">
            <span class="zero-spark">✨</span>
            <strong>근 ${index + 1} / Zero ${index + 1}:</strong> x = ${zero.x.toFixed(6)}
        </div>
    `).join('');
}

// Moodle/LMS Integration
class MoodleIntegration {
    constructor() {
        this.moodleVersion = '3.7';
        this.phpVersion = '7.1.9';
        this.mysqlVersion = '5.7';
        this.connected = true;
    }

    /**
     * Simulate receiving problem data from Moodle
     */
    getProblemFromMoodle() {
        // In a real implementation, this would make an AJAX call to Moodle API
        // For now, return mock data
        return {
            id: 1,
            expression: 'x^2 - 4',
            xMin: -5,
            xMax: 5,
            courseId: 101,
            activityId: 202
        };
    }

    /**
     * Submit results back to Moodle
     */
    submitResultsToMoodle(zeros) {
        // In a real implementation, this would send results back to Moodle
        console.log('Submitting results to Moodle:', zeros);

        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: true, message: 'Results submitted successfully' });
            }, 500);
        });
    }

    /**
     * Update connection status
     */
    updateStatus() {
        const statusElement = document.getElementById('lmsStatus');
        statusElement.textContent = this.connected ? 'Connected' : 'Disconnected';
        statusElement.className = this.connected ? 'status-ready' : 'status-error';
    }
}

// Initialize application
let graphRenderer;
let moodleIntegration;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize graph renderer
    graphRenderer = new GraphRenderer('graphCanvas');

    // Initialize Moodle integration
    moodleIntegration = new MoodleIntegration();
    document.getElementById('moodleVersion').textContent = moodleIntegration.moodleVersion;
    moodleIntegration.updateStatus();

    // Event listeners
    document.getElementById('findZerosBtn').addEventListener('click', async () => {
        const expression = document.getElementById('functionInput').value;
        const xMin = parseFloat(document.getElementById('rangeMin').value);
        const xMax = parseFloat(document.getElementById('rangeMax').value);

        if (!expression) {
            alert('함수를 입력해주세요. / Please enter a function.');
            return;
        }

        if (!mathParser.isValid(expression)) {
            alert('유효하지 않은 함수입니다. / Invalid function expression.');
            return;
        }

        if (xMin >= xMax) {
            alert('최소값은 최대값보다 작아야 합니다. / Min must be less than Max.');
            return;
        }

        // Disable button during processing
        const btn = document.getElementById('findZerosBtn');
        btn.disabled = true;
        btn.textContent = '처리 중... / Processing...';

        try {
            const zeros = await graphRenderer.setFunction(expression, xMin, xMax);
            displayZeros(zeros);

            // Submit to Moodle (optional)
            // await moodleIntegration.submitResultsToMoodle(zeros);
        } catch (error) {
            console.error('Error:', error);
            updateStatus('오류가 발생했습니다. / An error occurred.');
        } finally {
            btn.disabled = false;
            btn.textContent = '근 찾기 / Find Zeros';
        }
    });

    document.getElementById('resetBtn').addEventListener('click', () => {
        graphRenderer.reset();
        displayZeros([]);
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        graphRenderer.setupCanvas();
    });

    // Initial status
    updateStatus('함수를 입력하고 "근 찾기"를 클릭하세요 / Enter a function and click "Find Zeros"');
});
