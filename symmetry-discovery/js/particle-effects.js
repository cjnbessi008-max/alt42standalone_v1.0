/**
 * Particle Effects
 * Creates visual feedback with particles and animations
 */

class ParticleEffect {
    constructor(containerId = 'particle-container') {
        this.container = document.getElementById(containerId);
        this.particles = [];
        this.animationId = null;
    }

    /**
     * Create a single particle
     */
    createParticle(x, y, color = null) {
        const particle = document.createElement('div');
        particle.className = 'particle';

        // Random color if not specified
        if (!color) {
            const colors = ['#4facfe', '#00f2fe', '#ffd700', '#ff6b6b', '#667eea'];
            color = colors[Math.floor(Math.random() * colors.length)];
        }

        const size = Math.random() * 10 + 5;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = `radial-gradient(circle, #fff 0%, ${color} 100%)`;

        // Random animation duration
        const duration = Math.random() * 1000 + 1000;
        particle.style.animationDuration = duration + 'ms';

        // Random horizontal movement
        const xOffset = (Math.random() - 0.5) * 100;
        particle.style.setProperty('--x-offset', xOffset + 'px');

        this.container.appendChild(particle);

        // Remove after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, duration);

        return particle;
    }

    /**
     * Create particle burst effect
     */
    createBurst(x, y, count = 20, colors = null) {
        for (let i = 0; i < count; i++) {
            setTimeout(() => {
                const color = colors ? colors[Math.floor(Math.random() * colors.length)] : null;
                this.createParticle(x, y, color);
            }, i * 20);
        }
    }

    /**
     * Create circle of particles
     */
    createCircle(centerX, centerY, radius, count = 16, color = null) {
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            this.createParticle(x, y, color);
        }
    }

    /**
     * Create firework effect
     */
    createFirework(x, y) {
        const colors = ['#ffd700', '#ffed4e', '#fff44f', '#ffe135'];

        // Main burst
        this.createBurst(x, y, 30, colors);

        // Secondary bursts
        setTimeout(() => {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const distance = 50;
                const newX = x + Math.cos(angle) * distance;
                const newY = y + Math.sin(angle) * distance;
                this.createBurst(newX, newY, 10, colors);
            }
        }, 200);
    }

    /**
     * Create continuous sparkle effect
     */
    startSparkle(x, y, duration = 2000) {
        const startTime = Date.now();
        const colors = ['#ffd700', '#ffffff', '#ffed4e'];

        const sparkleInterval = setInterval(() => {
            if (Date.now() - startTime > duration) {
                clearInterval(sparkleInterval);
                return;
            }

            const offsetX = (Math.random() - 0.5) * 50;
            const offsetY = (Math.random() - 0.5) * 50;
            this.createParticle(x + offsetX, y + offsetY, colors[Math.floor(Math.random() * colors.length)]);
        }, 50);

        return sparkleInterval;
    }

    /**
     * Create screen flash effect
     */
    createScreenFlash(color = 'rgba(255, 215, 0, 0.3)') {
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        flash.style.background = `radial-gradient(circle, ${color} 0%, transparent 70%)`;
        document.body.appendChild(flash);

        setTimeout(() => {
            if (flash.parentNode) {
                flash.parentNode.removeChild(flash);
            }
        }, 500);
    }

    /**
     * Clear all particles
     */
    clear() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.particles = [];
    }
}

/**
 * Sound Effects using Web Audio API
 */
class SoundEffect {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
    }

    /**
     * Initialize audio context (must be called after user interaction)
     */
    init() {
        if (this.initialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    /**
     * Play success sound
     */
    playSuccess() {
        if (!this.initialized) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Ascending arpeggio
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        let time = ctx.currentTime;

        notes.forEach((freq, index) => {
            oscillator.frequency.setValueAtTime(freq, time);
            gainNode.gain.setValueAtTime(0.3, time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
            time += 0.15;
        });

        oscillator.type = 'sine';
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.6);
    }

    /**
     * Play hint sound
     */
    playHint() {
        if (!this.initialized) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(440, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);

        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        oscillator.type = 'sine';
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.2);
    }

    /**
     * Play complete sound (all symmetries found)
     */
    playComplete() {
        if (!this.initialized) return;

        const ctx = this.audioContext;

        // Play a celebratory chord
        const frequencies = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        const duration = 1.0;

        frequencies.forEach((freq, index) => {
            const oscillator = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
            gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

            oscillator.type = 'sine';
            oscillator.start(ctx.currentTime + index * 0.05);
            oscillator.stop(ctx.currentTime + duration);
        });
    }

    /**
     * Play rotation sound (subtle feedback)
     */
    playRotation() {
        if (!this.initialized) return;

        const ctx = this.audioContext;
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

        oscillator.type = 'sine';
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.05);
    }
}

/**
 * Visual Feedback Manager
 */
class FeedbackManager {
    constructor(messageElementId = 'feedback-message') {
        this.messageElement = document.getElementById(messageElementId);
        this.currentTimeout = null;
    }

    /**
     * Show feedback message
     */
    showMessage(message, type = 'success', duration = 2000) {
        if (!this.messageElement) return;

        // Clear previous timeout
        if (this.currentTimeout) {
            clearTimeout(this.currentTimeout);
        }

        // Remove previous classes
        this.messageElement.className = 'feedback-message show';

        // Add type class
        this.messageElement.classList.add(type);
        this.messageElement.textContent = message;

        // Auto-hide after duration
        this.currentTimeout = setTimeout(() => {
            this.hide();
        }, duration);
    }

    /**
     * Hide message
     */
    hide() {
        if (!this.messageElement) return;
        this.messageElement.classList.remove('show');
    }

    /**
     * Show success message
     */
    showSuccess(message, duration = 2000) {
        this.showMessage(message, 'success', duration);
    }

    /**
     * Show hint message
     */
    showHint(message, duration = 3000) {
        this.showMessage(message, 'hint', duration);
    }

    /**
     * Show error message
     */
    showError(message, duration = 2000) {
        this.showMessage(message, 'error', duration);
    }
}
