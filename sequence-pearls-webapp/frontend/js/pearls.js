/**
 * Pearls Visualization Module
 * Handles Canvas rendering and animations
 */

class PearlsRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.pearls = [];
        this.animationFrame = null;
        this.particleSystem = [];
    }

    // Create pearls from sequence data
    createPearls(sequence, missingPosition) {
        this.pearls = [];
        const numPearls = sequence.length;
        const spacing = this.canvas.width / (numPearls + 1);
        const centerY = this.canvas.height / 2;

        for (let i = 0; i < numPearls; i++) {
            const pearl = {
                x: spacing * (i + 1),
                y: centerY,
                radius: 25,
                value: sequence[i],
                isMissing: (i === missingPosition),
                hue: (360 / numPearls) * i,
                glowPhase: Math.random() * Math.PI * 2,
                pulseSpeed: 0.02 + Math.random() * 0.01
            };
            this.pearls.push(pearl);
        }
    }

    // Start animation loop
    startAnimation() {
        const animate = () => {
            this.render();
            this.animationFrame = requestAnimationFrame(animate);
        };
        animate();
    }

    // Stop animation
    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    // Main render function
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw connections
        this.drawConnections();

        // Draw pearls
        for (let i = 0; i < this.pearls.length; i++) {
            this.drawPearl(this.pearls[i], i);
        }

        // Draw particles
        this.updateParticles();
    }

    // Draw connection lines between pearls
    drawConnections() {
        if (this.pearls.length < 2) return;

        this.ctx.strokeStyle = 'rgba(107, 115, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();

        for (let i = 0; i < this.pearls.length - 1; i++) {
            const p1 = this.pearls[i];
            const p2 = this.pearls[i + 1];
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
        }

        this.ctx.stroke();
        this.ctx.setLineDash([]);
    }

    // Draw a single pearl
    drawPearl(pearl, index) {
        // Update glow phase
        pearl.glowPhase += pearl.pulseSpeed;
        const glowIntensity = 0.5 + 0.5 * Math.sin(pearl.glowPhase);

        // Create radial gradient
        const gradient = this.ctx.createRadialGradient(
            pearl.x - pearl.radius * 0.3,
            pearl.y - pearl.radius * 0.3,
            0,
            pearl.x,
            pearl.y,
            pearl.radius
        );

        if (pearl.isMissing) {
            // Missing pearl - gray with question mark
            gradient.addColorStop(0, 'rgba(240, 240, 240, 0.9)');
            gradient.addColorStop(1, 'rgba(180, 180, 180, 0.7)');
        } else {
            // Colorful pearl
            const lightness = 60 + glowIntensity * 20;
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
            gradient.addColorStop(0.3, `hsl(${pearl.hue}, 70%, ${lightness}%)`);
            gradient.addColorStop(1, `hsl(${pearl.hue}, 60%, 40%)`);
        }

        // Draw shadow
        this.ctx.shadowColor = pearl.isMissing
            ? 'rgba(0, 0, 0, 0.2)'
            : `hsla(${pearl.hue}, 70%, 50%, ${0.3 + glowIntensity * 0.3})`;
        this.ctx.shadowBlur = 15 + glowIntensity * 10;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 5;

        // Draw pearl circle
        this.ctx.beginPath();
        this.ctx.arc(pearl.x, pearl.y, pearl.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;

        // Draw highlight
        this.ctx.beginPath();
        this.ctx.arc(
            pearl.x - pearl.radius * 0.3,
            pearl.y - pearl.radius * 0.3,
            pearl.radius * 0.3,
            0,
            Math.PI * 2
        );
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.fill();

        // Draw value or question mark
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = pearl.isMissing ? '#666' : '#fff';
        this.ctx.font = pearl.isMissing ? 'bold 32px Arial' : 'bold 18px Arial';
        this.ctx.fillText(pearl.isMissing ? '?' : pearl.value, pearl.x, pearl.y);

        // Draw index
        this.ctx.fillStyle = '#999';
        this.ctx.font = '12px Arial';
        this.ctx.fillText(index + 1, pearl.x, pearl.y + pearl.radius + 15);
    }

    // Reveal answer for missing pearl
    revealAnswer(answer) {
        for (let pearl of this.pearls) {
            if (pearl.isMissing) {
                pearl.value = answer;
                pearl.isMissing = false;
                this.createCelebrationParticles(pearl.x, pearl.y, pearl.hue);
                break;
            }
        }
    }

    // Create celebration particles
    createCelebrationParticles(x, y, hue) {
        for (let i = 0; i < 30; i++) {
            this.particleSystem.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 60,
                maxLife: 60,
                hue: hue + (Math.random() - 0.5) * 60,
                size: 3 + Math.random() * 3
            });
        }
    }

    // Update and draw particles
    updateParticles() {
        for (let i = this.particleSystem.length - 1; i >= 0; i--) {
            const p = this.particleSystem[i];

            // Update position
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.2; // Gravity
            p.life--;

            // Draw particle
            if (p.life > 0) {
                const alpha = p.life / p.maxLife;
                this.ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fill();
            } else {
                // Remove dead particle
                this.particleSystem.splice(i, 1);
            }
        }
    }

    // Clear canvas
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.pearls = [];
        this.particleSystem = [];
    }
}
