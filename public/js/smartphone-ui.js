/**
 * Smartphone UI Component
 * 우측 하단 가상 스마트폰 화면에 표시되는 UI
 */

class SmartphoneUI {
    constructor() {
        this.canvas = document.getElementById('phoneCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.vectorLength = 100;

        this.currentProblem = null;
        this.currentAngle = 0;
        this.lightIntensity = 0;

        this.elements = {
            problemInfo: document.getElementById('phoneProblemInfo'),
            meterValue: document.getElementById('phoneMeterValue'),
            meterFill: document.getElementById('phoneMeterFill')
        };

        this.initialize();
    }

    initialize() {
        // Draw initial state
        this.draw();
    }

    updateProblem(problem) {
        this.currentProblem = problem;

        // Update problem info
        this.elements.problemInfo.innerHTML = `
            <h4 style="margin-bottom: 10px; color: #667eea;">${problem.title}</h4>
            <p style="margin-bottom: 8px;">${problem.description}</p>
            <div style="display: flex; justify-content: space-around; margin-top: 10px; font-size: 0.85em;">
                <div>
                    <strong>목표 각도</strong><br>
                    <span style="font-size: 1.2em; color: #667eea;">${problem.target_angle.toFixed(1)}°</span>
                </div>
                <div>
                    <strong>허용 오차</strong><br>
                    <span style="font-size: 1.2em; color: #764ba2;">±${problem.tolerance.toFixed(1)}°</span>
                </div>
            </div>
        `;

        this.draw();
    }

    updateAngle(angle, intensity) {
        this.currentAngle = angle;
        this.lightIntensity = intensity;

        // Update meter display
        this.elements.meterValue.textContent = `${angle.toFixed(1)}°`;
        this.elements.meterFill.style.width = `${(angle / 360) * 100}%`;

        // Update meter color based on intensity
        const hue = intensity * 1.2; // 0 (red) to 120 (green)
        this.elements.meterFill.style.background = `hsl(${hue}, 80%, 50%)`;

        this.draw();
    }

    draw() {
        const ctx = this.ctx;
        const centerX = this.centerX;
        const centerY = this.centerY;

        // Clear canvas
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.currentProblem) {
            // Draw placeholder
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('문제를 선택하면', centerX, centerY - 10);
            ctx.fillText('여기에 표시됩니다', centerX, centerY + 10);
            return;
        }

        // Draw light effect based on intensity
        this.drawLightEffect(ctx, centerX, centerY);

        // Draw simplified grid
        this.drawSimpleGrid(ctx, centerX, centerY);

        // Draw vectors
        const vector1 = this.currentProblem.vector1;
        const angleRad = this.currentAngle * Math.PI / 180;
        const vector2 = {
            x: Math.cos(angleRad),
            y: Math.sin(angleRad)
        };

        this.drawVector(ctx, centerX, centerY, vector1, '#00ff88');
        this.drawVector(ctx, centerX, centerY, vector2, '#ff4444');

        // Draw center point
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw angle value
        const angle = this.calculateAngleBetweenVectors(vector1, vector2);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${angle.toFixed(1)}°`, centerX, centerY - 20);
    }

    drawLightEffect(ctx, centerX, centerY) {
        // Create radial gradient for light effect
        const intensity = this.lightIntensity / 100;
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, this.vectorLength * 1.5
        );

        // Color based on intensity (from red to yellow to white)
        let r, g, b;
        if (intensity < 0.5) {
            // Red to yellow
            r = 255;
            g = Math.floor(255 * intensity * 2);
            b = 0;
        } else {
            // Yellow to white
            r = 255;
            g = 255;
            b = Math.floor(255 * (intensity - 0.5) * 2);
        }

        gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.6})`);
        gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.vectorLength * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawSimpleGrid(ctx, centerX, centerY) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        // Draw concentric circles
        for (let r = 30; r <= 120; r += 30) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Draw axis lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';

        // X axis
        ctx.beginPath();
        ctx.moveTo(centerX - 120, centerY);
        ctx.lineTo(centerX + 120, centerY);
        ctx.stroke();

        // Y axis
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - 120);
        ctx.lineTo(centerX, centerY + 120);
        ctx.stroke();
    }

    drawVector(ctx, centerX, centerY, vector, color) {
        const endX = centerX + vector.x * this.vectorLength;
        const endY = centerY - vector.y * this.vectorLength;

        // Draw line
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 3;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Draw arrowhead
        const angle = Math.atan2(-(vector.y), vector.x);
        const headLength = 12;

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
    }

    calculateAngleBetweenVectors(v1, v2) {
        const dot = v1.x * v2.x + v1.y * v2.y;
        const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
        const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

        if (mag1 === 0 || mag2 === 0) return 0;

        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        return Math.acos(cosAngle) * 180 / Math.PI;
    }
}

// Initialize smartphone UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.smartphoneUI = new SmartphoneUI();
});
