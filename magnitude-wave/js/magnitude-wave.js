/**
 * Magnitude Wave Visualizer
 * 벡터의 크기를 파동으로 시각화하는 모듈
 */

class MagnitudeWaveVisualizer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Wave properties
        this.magnitude = 5.0;
        this.amplitude = 50;
        this.frequency = 2;
        this.speed = 5;
        this.phase = 0;
        this.isAnimating = true;

        // Canvas dimensions
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.centerY = this.height / 2;

        // Animation
        this.animationId = null;

        // History for trail effect
        this.waveHistory = [];
        this.maxHistoryLength = 50;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startAnimation();
    }

    setupEventListeners() {
        // Vector inputs
        document.getElementById('vector-x').addEventListener('input', () => this.updateFromInputs());
        document.getElementById('vector-y').addEventListener('input', () => this.updateFromInputs());
        document.getElementById('vector-z').addEventListener('input', () => this.updateFromInputs());

        // Calculate button
        document.getElementById('calculate-btn').addEventListener('click', () => this.updateFromInputs());

        // Wave speed control
        document.getElementById('wave-speed').addEventListener('input', (e) => {
            this.speed = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent = this.speed;
        });

        // Wave frequency control
        document.getElementById('wave-frequency').addEventListener('input', (e) => {
            this.frequency = parseFloat(e.target.value);
            document.getElementById('frequency-value').textContent = this.frequency;
        });

        // Toggle animation
        document.getElementById('toggle-animation').addEventListener('click', () => {
            this.toggleAnimation();
        });
    }

    calculateMagnitude(x, y, z) {
        return Math.sqrt(x * x + y * y + z * z);
    }

    updateFromInputs() {
        const x = parseFloat(document.getElementById('vector-x').value) || 0;
        const y = parseFloat(document.getElementById('vector-y').value) || 0;
        const z = parseFloat(document.getElementById('vector-z').value) || 0;

        this.magnitude = this.calculateMagnitude(x, y, z);
        this.amplitude = Math.min(this.magnitude * 10, this.centerY - 20);

        // Update displays
        document.getElementById('magnitude-value').textContent = this.magnitude.toFixed(2);
        document.getElementById('mobile-magnitude').textContent = this.magnitude.toFixed(2);
        document.getElementById('mobile-amplitude').textContent = this.amplitude.toFixed(0) + 'px';

        // Add visual feedback
        this.flashMagnitudeDisplay();
    }

    flashMagnitudeDisplay() {
        const display = document.getElementById('magnitude-value');
        display.style.transition = 'all 0.3s';
        display.style.transform = 'scale(1.2)';
        display.style.color = '#764ba2';

        setTimeout(() => {
            display.style.transform = 'scale(1)';
            display.style.color = '#667eea';
        }, 300);
    }

    toggleAnimation() {
        this.isAnimating = !this.isAnimating;
        const btn = document.getElementById('toggle-animation');
        btn.textContent = this.isAnimating ? '일시정지' : '재생';

        if (this.isAnimating && !this.animationId) {
            this.startAnimation();
        }
    }

    startAnimation() {
        const animate = () => {
            if (this.isAnimating) {
                this.phase += this.speed * 0.02;
                this.draw();
            }
            this.animationId = requestAnimationFrame(animate);
        };
        animate();
    }

    draw() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 10, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw grid
        this.drawGrid();

        // Draw center line
        this.drawCenterLine();

        // Draw wave
        this.drawWave();

        // Draw wave info
        this.drawWaveInfo();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(102, 126, 234, 0.1)';
        this.ctx.lineWidth = 1;

        // Horizontal lines
        for (let y = 0; y < this.height; y += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }

        // Vertical lines
        for (let x = 0; x < this.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
    }

    drawCenterLine() {
        this.ctx.strokeStyle = 'rgba(118, 75, 162, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY);
        this.ctx.lineTo(this.width, this.centerY);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    drawWave() {
        // Main wave
        this.ctx.strokeStyle = '#667eea';
        this.ctx.lineWidth = 3;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#667eea';

        this.ctx.beginPath();

        for (let x = 0; x < this.width; x++) {
            const angle = (x / this.width) * Math.PI * 2 * this.frequency + this.phase;
            const y = this.centerY + Math.sin(angle) * this.amplitude;

            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        // Secondary wave (phase shifted for depth effect)
        this.ctx.strokeStyle = 'rgba(118, 75, 162, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.shadowBlur = 5;
        this.ctx.shadowColor = '#764ba2';

        this.ctx.beginPath();

        for (let x = 0; x < this.width; x++) {
            const angle = (x / this.width) * Math.PI * 2 * this.frequency + this.phase + Math.PI / 4;
            const y = this.centerY + Math.sin(angle) * this.amplitude * 0.7;

            if (x === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }

        this.ctx.stroke();

        // Reset shadow
        this.ctx.shadowBlur = 0;

        // Draw amplitude indicators
        this.drawAmplitudeIndicators();
    }

    drawAmplitudeIndicators() {
        const indicatorX = this.width - 20;

        // Max amplitude line (top)
        this.ctx.strokeStyle = 'rgba(74, 222, 128, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY - this.amplitude);
        this.ctx.lineTo(this.width, this.centerY - this.amplitude);
        this.ctx.stroke();

        // Max amplitude line (bottom)
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.centerY + this.amplitude);
        this.ctx.lineTo(this.width, this.centerY + this.amplitude);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Amplitude value text
        this.ctx.fillStyle = '#4ade80';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`±${this.amplitude.toFixed(0)}`, indicatorX, this.centerY - this.amplitude - 5);
    }

    drawWaveInfo() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.fillText(`Magnitude: ${this.magnitude.toFixed(2)}`, 10, 20);
        this.ctx.fillText(`Frequency: ${this.frequency}`, 10, 40);
        this.ctx.fillText(`Speed: ${this.speed}`, 10, 60);
    }
}

// Initialize when DOM is ready
let visualizer;

document.addEventListener('DOMContentLoaded', () => {
    visualizer = new MagnitudeWaveVisualizer('wave-canvas');

    // Initial calculation
    visualizer.updateFromInputs();

    console.log('Magnitude Wave Visualizer initialized');
});
